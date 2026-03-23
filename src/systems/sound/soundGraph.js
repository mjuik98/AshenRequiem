function configureCompressor(compressor, currentTime) {
  compressor.threshold.setValueAtTime(-18, currentTime);
  compressor.knee.setValueAtTime(18, currentTime);
  compressor.ratio.setValueAtTime(8, currentTime);
  compressor.attack.setValueAtTime(0.003, currentTime);
  compressor.release.setValueAtTime(0.15, currentTime);
}

export function createSoundGraph(ctx) {
  const masterBus = ctx.createGain();
  const bgmBus = ctx.createGain();
  const sfxBus = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();

  configureCompressor(compressor, ctx.currentTime);

  bgmBus.connect(masterBus);
  sfxBus.connect(masterBus);
  masterBus.connect(compressor);
  compressor.connect(ctx.destination);

  return { masterBus, bgmBus, sfxBus, compressor };
}

export function disconnectSoundGraph(graph) {
  for (const node of [
    graph?.masterBus,
    graph?.bgmBus,
    graph?.sfxBus,
    graph?.compressor,
  ]) {
    if (!node) continue;
    try { node.disconnect(); } catch {}
  }
}
