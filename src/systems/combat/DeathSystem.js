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
import { spawnPickup, spawnEffect, spawnEnemy }  from '../../state/spawnRequest.js';

export const DeathSystem = {
  update({ world }) {
    const { events, spawnQueue } = world;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        world.killCount++;

        if (world.events.currencyEarned) {
          const reward = _calcCurrencyReward(entity, world.player);
          world.events.currencyEarned.push({ amount: reward });
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
          _spawnBossXpDrop(spawnQueue, entity, xpVal);

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
      }

      if (entity.type === 'player') {
        transitionPlayMode(world, PlayMode.DEAD);
      }
    }
  },
};

function _spawnBossXpDrop(spawnQueue, boss, totalXp) {
  const BIG_GEM_XP = 12;
  const MED_GEM_XP = 5;
  const BIG_COUNT  = 4;
  const MED_COUNT  = 8;

  let remaining = totalXp;

  for (let i = 0; i < BIG_COUNT && remaining > 0; i++) {
    const angle   = (i / BIG_COUNT) * Math.PI * 2 + Math.PI / 4;
    const scatter = 60 + Math.random() * 40;
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
    const scatter = 30 + Math.random() * 50;
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
    const angle   = Math.random() * Math.PI * 2;
    const scatter = 20 + Math.random() * 80;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 8 },
    }));
  }
}

function _getXpGemColor(xpValue) {
  if (xpValue <= 3)  return '#64b5f6';
  if (xpValue <= 10) return '#66bb6a';
  return '#ef5350';
}

export function _calcCurrencyReward(enemy, player) {
  const base = enemy.currencyValue ?? 1;
  const mult = player?.currencyMult ?? 1;
  if (enemy.isBoss)  return Math.round(base * 20 * mult);
  if (enemy.isElite) return Math.round(base * 5  * mult);
  return Math.round(base * mult);
}
