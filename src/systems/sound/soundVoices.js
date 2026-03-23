export function scheduleBeepVoice({
  ctx,
  sfxBus,
  typeName,
  freq,
  duration,
  wave,
  volume,
  pan = 0,
  intensity = 1,
  randomDetune = 0,
  randomVolume = 0,
  extraDetune = 0,
  startTime = null,
  createPanner = () => null,
  registerVoice = () => {},
  unregisterVoice = () => {},
  disconnectSafely = () => {},
  randomSpread = () => 0,
}) {
  if (!ctx || !sfxBus) return;

  const t = startTime ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = createPanner(pan);

  const voiceId = Symbol(typeName);
  registerVoice(voiceId, typeName);

  const detuneMul = 1 + randomSpread(randomDetune);
  const volMul = 1 + randomSpread(randomVolume);
  const effectiveFreq = Math.max(20, freq * detuneMul * (1 + extraDetune));
  const effectiveVol = Math.max(0.0001, volume * intensity * volMul);

  const attack = Math.min(0.005, duration * 0.25);
  const release = Math.min(0.05, Math.max(0.015, duration * 0.45));
  const sustainEnd = Math.max(t + attack, t + duration - release);
  const stopAt = t + duration + 0.01;

  osc.type = wave;
  osc.frequency.setValueAtTime(effectiveFreq, t);
  osc.frequency.linearRampToValueAtTime(effectiveFreq * 0.995, t + Math.min(0.02, duration * 0.5));

  osc.connect(gain);
  if (panner) {
    gain.connect(panner);
    panner.connect(sfxBus);
  } else {
    gain.connect(sfxBus);
  }

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(effectiveVol, t + attack);
  gain.gain.setValueAtTime(effectiveVol, sustainEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.start(t);
  osc.stop(stopAt);

  osc.onended = () => {
    unregisterVoice(voiceId, typeName);
    disconnectSafely(osc, gain, panner);
  };
}

export function scheduleChordVoice({
  ctx,
  freqs,
  duration,
  wave,
  volume,
  pan = 0,
  intensity = 1,
  step = 0.06,
  randomDetune = 0,
  randomVolume = 0,
  extraDetune = 0,
  ...rest
}) {
  if (!ctx) return;

  const start = ctx.currentTime;
  freqs.forEach((freq, index) => {
    scheduleBeepVoice({
      ...rest,
      ctx,
      freq,
      duration,
      wave,
      volume: volume * 0.72,
      pan,
      intensity,
      randomDetune,
      randomVolume,
      extraDetune,
      startTime: start + index * step,
    });
  });
}

export function createBgmVoice({ ctx, bgmBus, id, def }) {
  if (!ctx || !bgmBus) return null;

  const output = ctx.createGain();
  const toneGainA = ctx.createGain();
  const toneGainB = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(id === 'boss' ? 1100 : 1800, ctx.currentTime);
  filter.Q.setValueAtTime(0.5, ctx.currentTime);

  output.connect(filter);
  filter.connect(bgmBus);

  const oscA = ctx.createOscillator();
  oscA.type = def.waveA;
  oscA.frequency.setValueAtTime(def.baseFreq, ctx.currentTime);

  const oscB = ctx.createOscillator();
  oscB.type = def.waveB;
  oscB.frequency.setValueAtTime(def.baseFreq * def.interval, ctx.currentTime);

  toneGainA.gain.setValueAtTime(0.55, ctx.currentTime);
  toneGainB.gain.setValueAtTime(0.25, ctx.currentTime);

  oscA.connect(toneGainA);
  oscB.connect(toneGainB);
  toneGainA.connect(output);
  toneGainB.connect(output);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(def.lfoRate, ctx.currentTime);
  lfoDepth.gain.setValueAtTime(def.lfoDepth, ctx.currentTime);
  lfo.connect(lfoDepth);
  lfoDepth.connect(oscA.frequency);

  oscA.start(ctx.currentTime);
  oscB.start(ctx.currentTime);
  lfo.start(ctx.currentTime);

  return {
    id,
    output,
    filter,
    lfo,
    lfoDepth,
    oscillators: [oscA, oscB],
    gains: [toneGainA, toneGainB],
  };
}

export function disposeBgmVoice({
  ctx,
  bgm,
  afterSeconds = 0.02,
  disconnectSafely = () => {},
  timer = globalThis.setTimeout?.bind(globalThis) ?? setTimeout,
}) {
  if (!ctx || !bgm) return;
  const stopAt = ctx.currentTime + Math.max(0.01, afterSeconds);

  for (const osc of bgm.oscillators ?? []) {
    try { osc.stop(stopAt); } catch {}
  }
  try { bgm.lfo?.stop(stopAt); } catch {}

  const delayMs = Math.ceil((afterSeconds + 0.05) * 1000);
  timer(() => {
    disconnectSafely(
      ...(bgm.oscillators ?? []),
      ...(bgm.gains ?? []),
      bgm.lfo,
      bgm.lfoDepth,
      bgm.filter,
      bgm.output,
    );
  }, delayMs);
}
