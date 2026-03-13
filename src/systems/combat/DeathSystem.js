/**
 * DeathSystem — 사망 후처리
 *
 * 입력: events.deaths
 * 쓰기: killCount, spawnQueue(XP 픽업, 사망 이펙트)
 */
export const DeathSystem = {
  update({ events, world, spawnQueue }) {
    const deaths = events.deaths;

    for (let i = 0; i < deaths.length; i++) {
      const death = deaths[i];
      const entity = death.entity;

      if (entity.type === 'enemy') {
        // 킬 카운트 증가
        world.killCount++;

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
            duration: 0.3,
          },
        });
      }

      if (entity.type === 'player') {
        // 플레이어 사망 → playMode 변경
        world.playMode = 'dead';
      }
    }
  },
};
