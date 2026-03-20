import { EFFECT_DEFAULTS }                      from '../../data/constants.js';
import { transitionPlayMode, PlayMode }          from '../../state/PlayMode.js';
import { spawnPickup, spawnEffect, spawnEnemy }  from '../../state/spawnRequest.js';

/**
 * src/systems/combat/DeathSystem.js — 사망 후처리
 *
 * REFACTOR (R-14): DeathSystem → Session 직접 접근 제거
 * REFACTOR (R-15): spawnQueue 요청 시 SpawnRequest 팩토리 사용
 *
 * FIX(P3-8): world.playMode 직접 변경 → transitionPlayMode() 사용
 * FIX(BUG-XP-NAN): entity.xpValue 미설정 시 NaN XP 전파 방지
 */
export const DeathSystem = {
  update({ world }) {
    const { events, spawnQueue } = world;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        world.killCount++;

        // R-14: world.events.currencyEarned 이벤트 발행 (PipelineBuilder 핸들러가 처리)
        if (world.events.currencyEarned) {
          const reward = _calcCurrencyReward(entity);
          world.events.currencyEarned.push({ amount: reward });
        }

        // deathSpawn (슬라임 분열 등)
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
          if (enemyId && count > 0) {
            for (let d = 0; d < count; d++) {
              const angle = (d / count) * Math.PI * 2;
              // R-15: spawnEnemy 팩토리 사용
              spawnQueue.push(spawnEnemy({
                enemyId,
                x: entity.x + Math.cos(angle) * (entity.radius + 10),
                y: entity.y + Math.sin(angle) * (entity.radius + 10),
              }));
            }
          }
        }

        // FIX(BUG-XP-NAN): xpValue ?? 0
        // R-15: spawnPickup 팩토리 사용
        spawnQueue.push(spawnPickup({
          x:       entity.x,
          y:       entity.y,
          xpValue: entity.xpValue ?? 0,
        }));

        // 사망 이펙트
        // R-15: spawnEffect 팩토리 사용
        spawnQueue.push(spawnEffect({
          x:          entity.x,
          y:          entity.y,
          effectType: 'burst',
          color:      entity.color,
          radius:     entity.radius * 1.5,
          duration:   EFFECT_DEFAULTS.burstDuration,
        }));
      }

      if (entity.type === 'player') {
        // FIX(P3-8): transitionPlayMode 사용
        transitionPlayMode(world, PlayMode.DEAD);
      }
    }
  },
};

export function _calcCurrencyReward(enemy) {
  const base = enemy.currencyValue ?? 1;
  if (enemy.isBoss)  return base * 20;
  if (enemy.isElite) return base * 5;
  return base;
}
