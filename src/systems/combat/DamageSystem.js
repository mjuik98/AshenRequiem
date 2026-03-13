/**
 * DamageSystem — 데미지 적용
 *
 * 입력: events.hits
 * 쓰기: 대상 HP, 피격 상태, 사망 상태
 * 출력: events.deaths, spawnQueue(이펙트)
 */
export const DamageSystem = {
  update({ events, player, spawnQueue }) {
    const hits = events.hits;

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const target = hit.target;

      if (!target || !target.isAlive) continue;

      target.hp -= hit.damage;

      // 적에게 피격 플래시
      if (target.type === 'enemy') {
        target.hitFlashTimer = 0.1;
      }

      // 플레이어 피격 시 무적 부여
      if (target.type === 'player') {
        target.invincibleTimer = target.invincibleDuration;
      }

      // 데미지 텍스트 이펙트
      spawnQueue.push({
        type: 'effect',
        config: {
          x: target.x,
          y: target.y - target.radius,
          effectType: 'damageText',
          text: `-${hit.damage}`,
          color: target.type === 'player' ? '#ef5350' : '#ffffff',
          duration: 0.5,
        },
      });

      // 사망 판정
      if (target.hp <= 0) {
        target.hp = 0;
        target.isAlive = false;
        target.pendingDestroy = true;

        events.deaths.push({
          entityId: target.id,
          entity: target,
          killedBy: hit.attackerId,
        });
      }
    }
  },
};
