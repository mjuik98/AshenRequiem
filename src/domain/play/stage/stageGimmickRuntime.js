import { spawnEffect, spawnEnemy, spawnPickup, spawnProjectile } from '../state/spawnRequest.js';
import { nextFloat } from '../../../utils/random.js';

export function queueStageEvent(world, gimmick = {}) {
  const dangerLevel = gimmick.dangerLevel
    ?? (
      ['projectile_barrage', 'hazard_ring', 'cross_barrage'].includes(gimmick.type)
        ? 'high'
        : (gimmick.type === 'pickup_cluster' && gimmick.pickupType !== 'gold' ? 'low' : 'medium')
    );
  const telegraphTone = gimmick.telegraphTone
    ?? (dangerLevel === 'high' ? 'danger' : (dangerLevel === 'low' ? 'info' : 'warning'));
  const telegraphText = gimmick.telegraphText
    ?? (dangerLevel === 'high' ? 'Incoming warning pattern' : (gimmick.announceText ?? 'Stage warning'));
  world.queues.events.stageEventTriggered?.push({
    stageId: world.run.stageId ?? world.run.stage?.id ?? 'ash_plains',
    stageName: world.run.stage?.name ?? world.run.stageId ?? 'Ash Plains',
    gimmickId: gimmick.id ?? gimmick.type ?? 'stage_gimmick',
    announceText: gimmick.announceText ?? '',
    accentColor: gimmick.effectColor ?? gimmick.color ?? '#f2cf84',
    dangerLevel,
    telegraphTone,
    telegraphText,
  });
}

function triggerEnemyRing(world, anchor, gimmick) {
  const count = Math.max(1, gimmick.count ?? 1);
  const ringRadius = gimmick.ringRadius ?? 180;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    world.queues.spawnQueue.push(spawnEnemy({
      enemyId: gimmick.enemyId,
      x: anchor.x + Math.cos(angle) * ringRadius,
      y: anchor.y + Math.sin(angle) * ringRadius,
    }));
  }
}

function triggerPickupCluster(world, anchor, gimmick) {
  const count = Math.max(1, gimmick.count ?? 1);
  const radius = gimmick.radius ?? 120;
  const rng = world.runtime?.rng;
  for (let index = 0; index < count; index += 1) {
    const angle = nextFloat(rng) * Math.PI * 2;
    const distance = radius * (0.35 + nextFloat(rng) * 0.65);
    world.queues.spawnQueue.push(spawnPickup({
      x: anchor.x + Math.cos(angle) * distance,
      y: anchor.y + Math.sin(angle) * distance,
      xpValue: gimmick.xpValue ?? 0,
      config: {
        pickupType: gimmick.pickupType ?? 'gold',
        color: gimmick.color ?? '#ffcc66',
        radius: gimmick.pickupRadius ?? 10,
        currencyValue: gimmick.currencyValue ?? 3,
        healValue: gimmick.healValue ?? 0,
        duration: gimmick.duration ?? 0,
      },
    }));
  }
}

function triggerProjectileBarrage(world, anchor, gimmick, ownerIdPrefix) {
  const count = Math.max(1, gimmick.count ?? 1);
  const ringRadius = gimmick.ringRadius ?? 180;
  const sourceId = `${ownerIdPrefix}:${gimmick.id ?? gimmick.type ?? 'barrage'}`;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const spawnX = anchor.x + Math.cos(angle) * ringRadius;
    const spawnY = anchor.y + Math.sin(angle) * ringRadius;
    const aimAngle = Math.atan2(anchor.y - spawnY, anchor.x - spawnX);

    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: sourceId },
      x: spawnX,
      y: spawnY,
      angle: aimAngle,
      config: {
        speed: gimmick.projectileSpeed ?? 220,
        damage: gimmick.damage ?? 8,
        radius: gimmick.projectileRadius ?? 9,
        color: gimmick.color ?? gimmick.effectColor ?? '#d9e4ff',
        pierce: gimmick.pierce ?? 1,
        projectileVisualId: gimmick.projectileVisualId ?? null,
        impactEffectType: gimmick.impactEffectType ?? null,
        impactEffectVisualId: gimmick.impactEffectVisualId ?? gimmick.impactEffectType ?? null,
        ownerId: sourceId,
        ownerType: gimmick.ownerType ?? 'stage',
        maxRange: gimmick.maxRange ?? (ringRadius + 420),
      },
    }));
  }
}

function triggerHazardRing(world, anchor, gimmick, ownerIdPrefix) {
  const count = Math.max(1, gimmick.count ?? 1);
  const ringRadius = gimmick.ringRadius ?? 140;
  const sourceId = `${ownerIdPrefix}:${gimmick.id ?? gimmick.type ?? 'hazard_ring'}`;

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const spawnX = anchor.x + Math.cos(angle) * ringRadius;
    const spawnY = anchor.y + Math.sin(angle) * ringRadius;
    const aimAngle = Math.atan2(anchor.y - spawnY, anchor.x - spawnX);

    world.queues.spawnQueue.push(spawnEffect({
      effectType: gimmick.effectType ?? 'burst',
      x: spawnX,
      y: spawnY,
      config: {
        effectVisualId: gimmick.effectVisualId ?? gimmick.effectType ?? 'burst',
        color: gimmick.effectColor ?? gimmick.color ?? '#ff9f68',
        radius: gimmick.effectRadius ?? 18,
        duration: gimmick.effectDuration ?? 0.55,
      },
    }));
    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: sourceId },
      x: spawnX,
      y: spawnY,
      angle: aimAngle,
      config: {
        speed: gimmick.projectileSpeed ?? 210,
        damage: gimmick.damage ?? 10,
        radius: gimmick.projectileRadius ?? 8,
        color: gimmick.color ?? '#ffb27a',
        pierce: gimmick.pierce ?? 1,
        projectileVisualId: gimmick.projectileVisualId ?? null,
        impactEffectType: gimmick.impactEffectType ?? null,
        impactEffectVisualId: gimmick.impactEffectVisualId ?? gimmick.impactEffectType ?? null,
        ownerId: sourceId,
        ownerType: gimmick.ownerType ?? 'stage',
        maxRange: gimmick.maxRange ?? (ringRadius + 340),
      },
    }));
  }
}

function triggerCrossBarrage(world, anchor, gimmick, ownerIdPrefix) {
  const ringRadius = gimmick.ringRadius ?? 150;
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];
  const sourceId = `${ownerIdPrefix}:${gimmick.id ?? gimmick.type ?? 'cross_barrage'}`;

  for (const direction of directions) {
    const spawnX = anchor.x + direction.x * ringRadius;
    const spawnY = anchor.y + direction.y * ringRadius;
    const aimAngle = Math.atan2(anchor.y - spawnY, anchor.x - spawnX);

    world.queues.spawnQueue.push(spawnEffect({
      effectType: gimmick.effectType ?? 'burst',
      x: spawnX,
      y: spawnY,
      config: {
        effectVisualId: gimmick.effectVisualId ?? gimmick.effectType ?? 'burst',
        color: gimmick.effectColor ?? gimmick.color ?? '#a5d8ff',
        radius: gimmick.effectRadius ?? 16,
        duration: gimmick.effectDuration ?? 0.5,
      },
    }));
    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: sourceId },
      x: spawnX,
      y: spawnY,
      angle: aimAngle,
      config: {
        speed: gimmick.projectileSpeed ?? 220,
        damage: gimmick.damage ?? 11,
        radius: gimmick.projectileRadius ?? 8,
        color: gimmick.color ?? '#a5d8ff',
        pierce: gimmick.pierce ?? 1,
        projectileVisualId: gimmick.projectileVisualId ?? null,
        impactEffectType: gimmick.impactEffectType ?? null,
        impactEffectVisualId: gimmick.impactEffectVisualId ?? gimmick.impactEffectType ?? null,
        ownerId: sourceId,
        ownerType: gimmick.ownerType ?? 'stage',
        maxRange: gimmick.maxRange ?? (ringRadius + 360),
      },
    }));
  }
}

export function triggerStageGimmick(world, gimmick = {}, {
  anchor = null,
  ownerIdPrefix = 'stage',
} = {}) {
  if (!gimmick?.type || !anchor) return;

  if (gimmick.type === 'enemy_ring' && gimmick.enemyId) {
    triggerEnemyRing(world, anchor, gimmick);
  } else if (gimmick.type === 'pickup_cluster') {
    triggerPickupCluster(world, anchor, gimmick);
  } else if (gimmick.type === 'projectile_barrage') {
    triggerProjectileBarrage(world, anchor, gimmick, ownerIdPrefix);
  } else if (gimmick.type === 'hazard_ring') {
    triggerHazardRing(world, anchor, gimmick, ownerIdPrefix);
  } else if (gimmick.type === 'cross_barrage') {
    triggerCrossBarrage(world, anchor, gimmick, ownerIdPrefix);
  }
}
