import { EFFECT_DEFAULTS } from '../../data/constants.js';

/**
 * DeathSystem — 사망 후처리
 * 입력: events.deaths
 * 출력: spawnQueue (XP 픽업, 사망 이펙트, deathSpawn), worldState.playMode 변경
 */
export const DeathSystem = {
  update({ world }) {
    const { events, spawnQueue } = world;
    const worldState = world;
    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        worldState.killCount++;

        // deathSpawn (슬라임 분열 등)
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

        // XP 픽업
        spawnQueue.push({ type: 'pickup', config: { x: entity.x, y: entity.y, xpValue: entity.xpValue } });

        // 사망 이펙트
        spawnQueue.push({
          type: 'effect',
          config: {
            x: entity.x, y: entity.y,
            effectType: 'burst',
            color:      entity.color,
            radius:     entity.radius * 1.5,
            duration:   EFFECT_DEFAULTS.burstDuration,
          },
        });
      }

      if (entity.type === 'player') {
        worldState.playMode = 'dead';
      }
    }
  },
};
