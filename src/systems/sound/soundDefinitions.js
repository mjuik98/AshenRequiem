function cloneEntry(entry) {
  return {
    ...entry,
    ...(Array.isArray(entry?.freqs) ? { freqs: [...entry.freqs] } : {}),
  };
}

function deepFreezeDefs(definitions) {
  Object.values(definitions).forEach((entry) => Object.freeze(entry));
  return Object.freeze(definitions);
}

export const SOUND_SFX_DEFS = deepFreezeDefs({
  hit: {
    kind: 'beep',
    freq: 440,
    duration: 0.05,
    type: 'square',
    volume: 0.08,
    cooldown: 0.018,
    maxPolyphony: 6,
    randomDetune: 0.03,
    randomVolume: 0.08,
    duck: 0,
  },
  death: {
    kind: 'beep',
    freq: 200,
    duration: 0.14,
    type: 'sawtooth',
    volume: 0.16,
    cooldown: 0.08,
    maxPolyphony: 2,
    randomDetune: 0.02,
    randomVolume: 0.05,
    duck: 0.2,
  },
  levelup: {
    kind: 'chord',
    freqs: [523.25, 659.25, 783.99],
    duration: 0.2,
    type: 'sine',
    volume: 0.18,
    cooldown: 0.25,
    maxPolyphony: 1,
    randomDetune: 0.01,
    randomVolume: 0.03,
    step: 0.06,
    duck: 0.45,
  },
  pickup: {
    kind: 'beep',
    freq: 880,
    duration: 0.04,
    type: 'sine',
    volume: 0.06,
    cooldown: 0.025,
    maxPolyphony: 4,
    randomDetune: 0.05,
    randomVolume: 0.1,
    duck: 0,
  },
  damage: {
    kind: 'beep',
    freq: 180,
    duration: 0.08,
    type: 'sawtooth',
    volume: 0.1,
    cooldown: 0.06,
    maxPolyphony: 3,
    randomDetune: 0.025,
    randomVolume: 0.05,
    duck: 0.12,
  },
});

export const SOUND_BGM_DEFS = deepFreezeDefs({
  title: {
    baseFreq: 196.0,
    interval: 1.5,
    waveA: 'triangle',
    waveB: 'sine',
    lfoRate: 0.08,
    lfoDepth: 5,
  },
  battle: {
    baseFreq: 164.81,
    interval: 1.5,
    waveA: 'triangle',
    waveB: 'square',
    lfoRate: 0.11,
    lfoDepth: 7,
  },
  boss: {
    baseFreq: 130.81,
    interval: 1.498,
    waveA: 'sawtooth',
    waveB: 'triangle',
    lfoRate: 0.16,
    lfoDepth: 10,
  },
  default: {
    baseFreq: 174.61,
    interval: 1.5,
    waveA: 'triangle',
    waveB: 'sine',
    lfoRate: 0.09,
    lfoDepth: 6,
  },
});

export function cloneSoundSfxDefs() {
  return Object.fromEntries(
    Object.entries(SOUND_SFX_DEFS).map(([key, entry]) => [key, cloneEntry(entry)]),
  );
}

export function cloneSoundBgmDefs() {
  return Object.fromEntries(
    Object.entries(SOUND_BGM_DEFS).map(([key, entry]) => [key, cloneEntry(entry)]),
  );
}
