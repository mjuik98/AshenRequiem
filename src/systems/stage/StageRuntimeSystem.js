import {
  queueStageEvent,
  triggerStageGimmick,
} from '../../domain/play/stage/stageGimmickRuntime.js';

function ensureStageRuntime(world) {
  const runtime = world.run.stageRuntime ??= { gimmicks: {} };
  runtime.gimmicks ??= {};
  return runtime;
}

function triggerGimmick(world, player, gimmick) {
  if (!gimmick?.type) return;
  triggerStageGimmick(world, gimmick, {
    anchor: player,
    ownerIdPrefix: 'stage',
  });
  queueStageEvent(world, gimmick);
}

export const StageRuntimeSystem = {
  update({ world }) {
    const player = world.entities.player;
    const stage = world.run.stage ?? null;
    if (world.run.playMode !== 'playing') return;
    if (!player?.isAlive) return;
    if (!Array.isArray(stage?.gimmicks) || stage.gimmicks.length === 0) return;

    const elapsedTime = world.run.elapsedTime ?? 0;
    const runtime = ensureStageRuntime(world);
    const gimmickIntervalMult = Math.max(0.1, world.run.encounterState?.currentBeat?.gimmickIntervalMult ?? 1);

    for (const gimmick of stage.gimmicks) {
      if (!gimmick?.id) continue;

      const state = runtime.gimmicks[gimmick.id] ??= {
        triggerCount: 0,
        nextTriggerAt: gimmick.startAt ?? gimmick.interval ?? Number.POSITIVE_INFINITY,
        lastTriggeredAt: null,
      };

      if (!Number.isFinite(state.nextTriggerAt) || elapsedTime < state.nextTriggerAt) continue;

      triggerGimmick(world, player, gimmick);
      state.triggerCount += 1;
      state.lastTriggeredAt = elapsedTime;
      state.nextTriggerAt = Number.isFinite(gimmick.interval)
        ? state.nextTriggerAt + Math.max(1, gimmick.interval * gimmickIntervalMult)
        : Number.POSITIVE_INFINITY;
    }
  },
};
