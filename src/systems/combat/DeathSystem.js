import { EFFECT_DEFAULTS } from '../../data/constants.js';

/**
 * DeathSystem — 사망 후처리
 *
 * 입력: events.deaths
 * 쓰기: worldState.killCount, worldState.playMode, spawnQueue (XP 픽업, 사망 이펙트, deathSpawn)
 */
export const DeathSystem = {
  update({ events, worldState, spawnQueue }) {
    const deaths = events.deaths;

    for (let i = 0; i < deaths.length; i++) {
      const death = deaths[i];
      const entity = death.entity;

      if (entity.type === 'enemy') {
        // 킬 카운트 증가
        worldState.killCount++;

        // deathSpawn — 사망 시 파생 적 스폰 (슬라임 분열 등)
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
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

        // XP 픽업 스폰
        spawnQueue.push({
          type: 'pickup',
          config: {
            x: entity.x,
            y: entity.y,
            xpValue: entity.xpValue,
          },
        });

        // 사망 이펙트
        spawnQueue.push({
          type: 'effect',
          config: {
            x: entity.x,
            y: entity.y,
            effectType: 'burst',
            color: entity.color,
            radius: entity.radius * 1.5,
            duration: EFFECT_DEFAULTS.burstDuration,
          },
        });
      }

      if (entity.type === 'player') {
        // 플레이어 사망 → playMode 변경
        worldState.playMode = 'dead';
      }
    }
  },
};
