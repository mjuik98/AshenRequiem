import { spawnEnemy, spawnPickup } from '../../state/spawnRequest.js';
import { nextFloat } from '../../utils/random.js';

function ensureStageRuntime(world) {
  const runtime = world.run.stageRuntime ??= { gimmicks: {} };
  runtime.gimmicks ??= {};
  return runtime;
}

function queueStageEvent(world, gimmick = {}) {
  world.queues.events.stageEventTriggered?.push({
    stageId: world.run.stageId ?? world.run.stage?.id ?? 'ash_plains',
    stageName: world.run.stage?.name ?? world.run.stageId ?? 'Ash Plains',
    gimmickId: gimmick.id ?? gimmick.type ?? 'stage_gimmick',
    announceText: gimmick.announceText ?? '',
    accentColor: gimmick.effectColor ?? gimmick.color ?? '#f2cf84',
  });
}

function triggerEnemyRing(world, player, gimmick) {
  const count = Math.max(1, gimmick.count ?? 1);
  const ringRadius = gimmick.ringRadius ?? 180;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    world.queues.spawnQueue.push(spawnEnemy({
      enemyId: gimmick.enemyId,
      x: player.x + Math.cos(angle) * ringRadius,
      y: player.y + Math.sin(angle) * ringRadius,
    }));
  }
}

function triggerPickupCluster(world, player, gimmick) {
  const count = Math.max(1, gimmick.count ?? 1);
  const radius = gimmick.radius ?? 120;
  const rng = world.runtime?.rng;
  for (let index = 0; index < count; index += 1) {
    const angle = nextFloat(rng) * Math.PI * 2;
    const distance = radius * (0.35 + nextFloat(rng) * 0.65);
    world.queues.spawnQueue.push(spawnPickup({
      x: player.x + Math.cos(angle) * distance,
      y: player.y + Math.sin(angle) * distance,
      xpValue: 0,
      config: {
        pickupType: gimmick.pickupType ?? 'gold',
        color: gimmick.color ?? '#ffcc66',
        radius: gimmick.pickupRadius ?? 10,
        currencyValue: gimmick.currencyValue ?? 3,
      },
    }));
  }
}

function triggerGimmick(world, player, gimmick) {
  if (!gimmick?.type) return;

  if (gimmick.type === 'enemy_ring' && gimmick.enemyId) {
    triggerEnemyRing(world, player, gimmick);
  } else if (gimmick.type === 'pickup_cluster') {
    triggerPickupCluster(world, player, gimmick);
  }

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
        ? state.nextTriggerAt + Math.max(1, gimmick.interval)
        : Number.POSITIVE_INFINITY;
    }
  },
};
