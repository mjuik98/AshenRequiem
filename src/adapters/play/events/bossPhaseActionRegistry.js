import { spawnEffect, spawnEnemy, spawnProjectile } from '../../../domain/play/state/spawnRequest.js';
import {
  queueStageEvent,
  triggerStageGimmick,
} from '../../../domain/play/stage/stageGimmickRuntime.js';

function queueSummon(world, enemy, phaseAction) {
  const count = Math.max(1, phaseAction.count ?? 1);
  const ringRadius = phaseAction.ringRadius ?? (enemy.radius + 36);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    world.queues.spawnQueue.push(spawnEnemy({
      enemyId: phaseAction.enemyId,
      x: enemy.x + Math.cos(angle) * ringRadius,
      y: enemy.y + Math.sin(angle) * ringRadius,
    }));
  }
}

function queueBurst(world, enemy, phaseAction) {
  const count = Math.max(1, phaseAction.count ?? 1);
  const ringRadius = phaseAction.ringRadius ?? (enemy.radius + 28);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    world.queues.spawnQueue.push(spawnEffect({
      effectType: phaseAction.effectType ?? 'burst',
      x: enemy.x + Math.cos(angle) * ringRadius,
      y: enemy.y + Math.sin(angle) * ringRadius,
      config: {
        color: phaseAction.color ?? enemy.color,
        radius: phaseAction.radius ?? (enemy.radius * 0.9),
        duration: phaseAction.duration ?? 0.65,
      },
    }));
  }
}

function queueProjectileBarrage(world, enemy, phaseAction) {
  if (!enemy.projectileConfig) return;
  const count = Math.max(1, phaseAction.count ?? 6);
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: `${enemy.enemyDataId}_phase_barrage` },
      x: enemy.x,
      y: enemy.y,
      angle,
      config: {
        speed: (enemy.projectileConfig.speed ?? 220) * (phaseAction.speedMult ?? 1),
        damage: Math.round((enemy.projectileConfig.damage ?? 10) * (phaseAction.damageMult ?? 1)),
        radius: enemy.projectileConfig.radius ?? 8,
        color: phaseAction.color ?? enemy.projectileConfig.color ?? enemy.color,
        pierce: enemy.projectileConfig.pierce ?? 1,
        ownerId: enemy.id,
        ownerType: 'enemy',
        maxRange: phaseAction.maxRange ?? 560,
      },
    }));
  }
}

function queueReposition(world, enemy, phaseAction) {
  const player = world.entities.player;
  if (!player) return;

  const distance = phaseAction.distance ?? 160;
  const angle = phaseAction.angleOffset ?? 0;
  enemy.x = player.x + Math.cos(angle) * distance;
  enemy.y = player.y + Math.sin(angle) * distance;

  world.queues.spawnQueue.push(spawnEffect({
    effectType: 'burst',
    x: enemy.x,
    y: enemy.y,
    config: {
      color: phaseAction.burstColor ?? enemy.color,
      radius: phaseAction.radius ?? (enemy.radius * 1.4),
      duration: phaseAction.duration ?? 0.55,
    },
  }));
}

function queueHealPulse(world, enemy, phaseAction) {
  const healRatio = Math.max(0, Number(phaseAction.healRatio) || 0);
  const healAmount = Math.round((enemy.maxHp ?? enemy.hp ?? 0) * healRatio);
  enemy.hp = Math.min(enemy.maxHp ?? enemy.hp ?? 0, (enemy.hp ?? 0) + healAmount);

  world.queues.spawnQueue.push(spawnEffect({
    effectType: phaseAction.effectType ?? 'burst',
    x: enemy.x,
    y: enemy.y,
    config: {
      color: phaseAction.color ?? '#aaffcc',
      radius: phaseAction.radius ?? (enemy.radius * 1.2),
      duration: phaseAction.duration ?? 0.75,
    },
  }));
}

function queueProjectileArc(world, enemy, phaseAction) {
  if (!enemy.projectileConfig) return;
  const player = world.entities.player;
  const count = Math.max(1, phaseAction.count ?? 3);
  const spreadAngle = Number(phaseAction.spreadAngle) || 0.6;
  const baseAngle = player
    ? Math.atan2(player.y - enemy.y, player.x - enemy.x)
    : 0;
  const stepAngle = count > 1 ? spreadAngle / (count - 1) : 0;
  const startAngle = baseAngle - spreadAngle * 0.5;

  for (let index = 0; index < count; index += 1) {
    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: `${enemy.enemyDataId}_phase_arc` },
      x: enemy.x,
      y: enemy.y,
      angle: startAngle + stepAngle * index,
      config: {
        speed: (enemy.projectileConfig.speed ?? 220) * (phaseAction.speedMult ?? 1),
        damage: Math.round((enemy.projectileConfig.damage ?? 10) * (phaseAction.damageMult ?? 1)),
        radius: enemy.projectileConfig.radius ?? 8,
        color: phaseAction.color ?? enemy.projectileConfig.color ?? enemy.color,
        pierce: enemy.projectileConfig.pierce ?? 1,
        ownerId: enemy.id,
        ownerType: 'enemy',
        maxRange: phaseAction.maxRange ?? 520,
      },
    }));
  }
}

function queueProjectileNova(world, enemy, phaseAction) {
  if (!enemy.projectileConfig) return;
  const count = Math.max(1, phaseAction.count ?? 6);
  for (let index = 0; index < count; index += 1) {
    world.queues.spawnQueue.push(spawnProjectile({
      weapon: { id: `${enemy.enemyDataId}_phase_nova` },
      x: enemy.x,
      y: enemy.y,
      angle: (index / count) * Math.PI * 2,
      config: {
        speed: (enemy.projectileConfig.speed ?? 220) * (phaseAction.speedMult ?? 1),
        damage: Math.round((enemy.projectileConfig.damage ?? 10) * (phaseAction.damageMult ?? 1)),
        radius: enemy.projectileConfig.radius ?? 8,
        color: phaseAction.color ?? enemy.projectileConfig.color ?? enemy.color,
        pierce: enemy.projectileConfig.pierce ?? 1,
        ownerId: enemy.id,
        ownerType: 'enemy',
        maxRange: phaseAction.maxRange ?? 560,
      },
    }));
  }
}

function queueStageEcho(world, enemy) {
  const stageEcho = world.run?.stage?.bossEcho ?? null;
  if (!stageEcho) return;

  const anchor = stageEcho.target === 'player'
    ? world.entities.player
    : enemy;
  if (!anchor) return;

  triggerStageGimmick(world, stageEcho, {
    anchor,
    ownerIdPrefix: `boss:${enemy.enemyDataId ?? enemy.id ?? 'unknown'}`,
  });
  queueStageEvent(world, stageEcho);
}

const BOSS_PHASE_ACTION_REGISTRY = Object.freeze({
  summon: queueSummon,
  burst: queueBurst,
  projectile_barrage: queueProjectileBarrage,
  projectile_arc: queueProjectileArc,
  projectile_nova: queueProjectileNova,
  reposition: queueReposition,
  heal_pulse: queueHealPulse,
  stage_echo: queueStageEcho,
});

export function queueBossPhaseAction(world, enemy, phaseAction = null) {
  if (!phaseAction?.type || !world?.queues?.spawnQueue) return;
  BOSS_PHASE_ACTION_REGISTRY[phaseAction.type]?.(world, enemy, phaseAction);
}
