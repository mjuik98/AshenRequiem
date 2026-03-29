function normalizeActions(actions) {
  if (actions instanceof Set) {
    return [...actions].sort();
  }
  if (Array.isArray(actions)) {
    return [...actions].sort();
  }
  return [];
}

export function ensureReplayTraceRuntime(world) {
  world.runtime ??= {};
  world.runtime.replayTrace ??= [];
  world.runtime.replayFrame ??= 0;
  world.runtime.maxReplaySamples ??= 240;
  return world.runtime;
}

export function recordReplaySample(world, inputState, deltaTime = 0) {
  if (!world?.runtime || !inputState) return;
  const runtime = ensureReplayTraceRuntime(world);
  runtime.replayFrame += 1;

  runtime.replayTrace.push({
    frame: runtime.replayFrame,
    deltaTime,
    moveX: inputState.moveX ?? 0,
    moveY: inputState.moveY ?? 0,
    actions: normalizeActions(inputState.actions),
  });

  const maxSamples = runtime.maxReplaySamples ?? 240;
  if (runtime.replayTrace.length > maxSamples) {
    runtime.replayTrace.splice(0, runtime.replayTrace.length - maxSamples);
  }
}
