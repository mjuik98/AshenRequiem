import { EFFECT_DEFAULTS } from '../../data/constants.js';
import { earnCurrency } from '../../state/createSessionState.js';
import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';

/**
 * src/systems/combat/DeathSystem.js — 사망 후처리
 *
 * FIX(P3-8): world.playMode 직접 변경 → transitionPlayMode() 사용
 *
 * Before:
 *   worldState.playMode = 'dead';  // 전이 규칙 검증 없음
 *
 * After:
 *   transitionPlayMode(worldState, PlayMode.DEAD);
 *   → PlayMode.js의 전이 규칙 검증 포함
 *
 * FIX(BUG-XP-NAN): entity.xpValue 미설정 시 NaN XP 전파 방지
 * 입력: events.deaths
 * 출력: spawnQueue (XP 픽업, 사망 이펙트, deathSpawn), worldState.playMode 변경
 */
export const DeathSystem = {
  update({ world, services }) {
    const { events, spawnQueue } = world;
    const worldState = world;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        worldState.killCount++;

        if (services?.session) {
          const reward = _calcCurrencyReward(entity);
          earnCurrency(services.session, reward);
        }

        // deathSpawn (슬라임 분열 등)
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
          if (enemyId && count > 0) {
            for (let d = 0; d < count; d++) {
              const angle = (d / count) * Math.PI * 2;
              spawnQueue.push({
                type: 'enemy',
                config: {
                  enemyId,
                  x: entity.x + Math.cos(angle) * (entity.radius + 10),
                  y: entity.y + Math.sin(angle) * (entity.radius + 10),
                },
              });
            }
          }
        }

        // FIX(BUG-XP-NAN): xpValue ?? 0 — undefined이면 0으로 대체
        spawnQueue.push({
          type: 'pickup',
          config: {
            x:       entity.x,
            y:       entity.y,
            xpValue: entity.xpValue ?? 0,
          },
        });

        // 사망 이펙트
        spawnQueue.push({
          type: 'effect',
          config: {
            x:          entity.x,
            y:          entity.y,
            effectType: 'burst',
            color:      entity.color,
            radius:     entity.radius * 1.5,
            duration:   EFFECT_DEFAULTS.burstDuration,
          },
        });
      }

      if (entity.type === 'player') {
        // FIX(P3-8): 직접 playMode 변경 → transitionPlayMode 사용
        transitionPlayMode(worldState, PlayMode.DEAD);
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
