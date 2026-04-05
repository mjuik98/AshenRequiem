/**
 * src/systems/combat/DeathSystem.js
 *
 * FIX(5): 상자 드랍 시 burst 이펙트 추가
 *   Before: 상자가 조용히 스폰됨
 *   After:  spawnEffect로 황금빛 burst 이펙트를 함께 스폰
 *           → 플레이어에게 "특별한 것이 드랍됐다"는 시각적 피드백 제공
 */
import { EFFECT_DEFAULTS }                      from '../../data/constants.js';
import { transitionPlayMode, PlayMode }          from '../../state/PlayMode.js';
import { spawnPickup, spawnEffect, spawnEnemy }  from '../../domain/play/state/spawnRequest.js';
import { getPropDropTableById }                  from '../../data/propDropData.js';
import { nextFloat, randomRange, weightedPick }  from '../../utils/random.js';

export const DeathSystem = {
  update({ world, data = {} }) {
    const events = world.queues.events;
    const spawnQueue = world.queues.spawnQueue;
    const rng = world.runtime.rng;
    const totalBosses = Array.isArray(data?.bossData) ? data.bossData.length : Infinity;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        if (entity.isProp) {
          _handlePropDeath(world, entity, data?.propDropData);
          continue;
        }

        world.run.killCount++;

        if (world.queues.events.currencyEarned) {
          const reward = _calcCurrencyReward(entity, world.entities.player, world.run.ascension, world.run.stage);
          world.queues.events.currencyEarned.push({ amount: reward });
        }

        if (entity.isBoss) {
          world.run.bossKillCount = (world.run.bossKillCount ?? 0) + 1;
        }

        // deathSpawn (슬라임 분열 등)
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
          if (enemyId && count > 0) {
            for (let d = 0; d < count; d++) {
              const angle = (d / count) * Math.PI * 2;
              spawnQueue.push(spawnEnemy({
                enemyId,
                x: entity.x + Math.cos(angle) * (entity.radius + 10),
                y: entity.y + Math.sin(angle) * (entity.radius + 10),
              }));
            }
          }
        }

        const xpVal = entity.xpValue ?? 0;

        if (entity.isBoss) {
          // XP 젬 대량 드랍
          _spawnBossXpDrop(spawnQueue, entity, xpVal, rng);

          // 상자 드랍
          spawnQueue.push(spawnPickup({
            x:       entity.x,
            y:       entity.y,
            xpValue: 0,
            config:  {
              pickupType: 'chest',
              color:      '#ffd54f',
              radius:     18,
            },
          }));

          // FIX(5): 상자 등장 황금 burst 이펙트 (일반 사망 burst보다 크고 밝음)
          spawnQueue.push(spawnEffect({
            x:          entity.x,
            y:          entity.y,
            effectType: 'burst',
            config: {
              color:    '#ffd54f',
              radius:   entity.radius * 2.2,
              duration: EFFECT_DEFAULTS.burstDuration * 1.4,
            },
          }));

        } else {
          // 일반 / 엘리트: 단일 젬 드랍
          spawnQueue.push(spawnPickup({
            x:       entity.x,
            y:       entity.y,
            xpValue: xpVal,
            config:  { color: _getXpGemColor(xpVal) },
          }));
        }

        // 사망 이펙트 (보스 포함 항상)
        spawnQueue.push(spawnEffect({
          x:          entity.x,
          y:          entity.y,
          effectType: 'burst',
          config: {
            color:    entity.color,
            radius:   entity.radius * 1.5,
            duration: EFFECT_DEFAULTS.burstDuration,
          }
        }));

        if (entity.isBoss && world.run.bossKillCount >= totalBosses) {
          _setRunOutcome(world, 'victory');
          if (world.run.playMode !== PlayMode.DEAD) {
            transitionPlayMode(world, PlayMode.DEAD);
          }
        }
      }

      if (entity.type === 'player') {
        _setRunOutcome(world, 'defeat');
        if (world.run.playMode !== PlayMode.DEAD) {
          transitionPlayMode(world, PlayMode.DEAD);
        }
      }
    }
  },
};

function _handlePropDeath(world, entity, propDropTables = null) {
  const spawnQueue = world.queues.spawnQueue;
  const dropTable = _getPropDropTable(entity, propDropTables);
  const drop = weightedPick(dropTable?.drops ?? [], world.runtime.rng);

  if (drop && drop.pickupType !== 'none') {
    spawnQueue.push(spawnPickup({
      x: entity.x,
      y: entity.y,
      xpValue: 0,
      config: {
        pickupType: drop.pickupType,
        color: drop.color ?? '#ffd54f',
        radius: drop.radius ?? 10,
        currencyValue: drop.currencyValue ?? 0,
        healValue: drop.healValue ?? 0,
        duration: drop.duration ?? 0,
      },
    }));
  }

  spawnQueue.push(spawnEffect({
    x: entity.x,
    y: entity.y,
    effectType: 'burst',
    config: {
      color: drop?.pickupType && drop.pickupType !== 'none'
        ? (drop.color ?? '#ffd54f')
        : (entity.color ?? '#a1887f'),
      radius: entity.radius * 1.6,
      duration: EFFECT_DEFAULTS.burstDuration,
    },
  }));
}

function _setRunOutcome(world, type) {
  if (type === 'defeat') {
    world.run.runOutcome = { type };
    return;
  }

  if (!world.run.runOutcome) {
    world.run.runOutcome = { type };
  }
}

function _spawnBossXpDrop(spawnQueue, boss, totalXp, rng) {
  const BIG_GEM_XP = 12;
  const MED_GEM_XP = 5;
  const BIG_COUNT  = 4;
  const MED_COUNT  = 8;

  let remaining = totalXp;

  for (let i = 0; i < BIG_COUNT && remaining > 0; i++) {
    const angle   = (i / BIG_COUNT) * Math.PI * 2 + Math.PI / 4;
    const scatter = randomRange(60, 100, rng);
    const gemXp   = Math.min(BIG_GEM_XP, remaining);
    remaining    -= gemXp;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 14 },
    }));
  }

  for (let i = 0; i < MED_COUNT && remaining > 0; i++) {
    const angle   = (i / MED_COUNT) * Math.PI * 2;
    const scatter = randomRange(30, 80, rng);
    const gemXp   = Math.min(MED_GEM_XP, remaining);
    remaining    -= gemXp;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 10 },
    }));
  }

  while (remaining > 0) {
    const gemXp  = Math.min(3, remaining);
    remaining   -= gemXp;
    const angle   = nextFloat(rng) * Math.PI * 2;
    const scatter = randomRange(20, 100, rng);
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 8 },
    }));
  }
}

function _getPropDropTable(entity, propDropTables) {
  if (Array.isArray(propDropTables)) {
    return propDropTables.find((table) => table.id === entity.propDropTableId) ?? null;
  }
  return getPropDropTableById(entity.propDropTableId);
}

function _getXpGemColor(xpValue) {
  if (xpValue <= 3)  return '#64b5f6';
  if (xpValue <= 10) return '#66bb6a';
  return '#ef5350';
}

export function _calcCurrencyReward(enemy, player, ascension = null, stage = null) {
  const base = enemy.currencyValue ?? 1;
  const mult = player?.currencyMult ?? 1;
  const ascensionRewardMult = ascension?.rewardMult ?? 1;
  const stageRewardMult = stage?.rewardMult ?? 1;
  if (enemy.isBoss)  return Math.round(base * 20 * mult * ascensionRewardMult * stageRewardMult);
  if (enemy.isElite) return Math.round(base * 5  * mult * ascensionRewardMult * stageRewardMult);
  return Math.round(base * mult * ascensionRewardMult * stageRewardMult);
}
