/**
 * src/behaviors/weaponBehaviors/areaBurst.js
 *
 * 역할:
 *   플레이어 위치에서 범위 폭발 투사체 생성.
 *   projectileCount가 있으면 areaBurst + 확산 투사체를 복합으로 발사.
 *
 * 계약:
 *   입력: { weapon, player, enemies, spawnQueue }
 *   출력: spawnQueue에 areaBurst (및 선택적으로 targetProjectile) 요청 추가
 *   반환: 항상 true (범위 안에 적이 없어도 중심 폭발은 발사)
 *
 * REFACTOR: 로컬 findClosestEnemy() 제거 → weaponBehaviorUtils 공유 함수 사용
 *   Before: targetProjectile.js와 동일한 findClosestEnemy() 로컬 복사 존재
 *   After:  weaponBehaviorUtils.findClosestEnemy import 한 줄로 대체
 */

import { normalize, sub }    from '../../math/Vector2.js';
import { findClosestEnemy }  from './weaponBehaviorUtils.js';

/**
 * areaBurst 무기 동작 실행.
 *
 * @param {{
 *   weapon:     object,
 *   player:     object,
 *   enemies:    object[],
 *   spawnQueue: object[],
 * }} ctx
 * @returns {boolean} 항상 true (중심 폭발은 무조건 발사)
 */
export function areaBurst({ weapon, player, enemies, spawnQueue }) {
  // 범위 안에 적이 없어도 중심 폭발 투사체는 발사됨
  const target = findClosestEnemy(player, enemies, weapon.range);

  // ── 범위 폭발 투사체 ───────────────────────────────────────
  spawnQueue.push({
    type: 'projectile',
    config: {
      x: player.x,
      y: player.y,
      dirX: 0,
      dirY: 0,
      speed:       0,
      damage:      weapon.damage,
      radius:      weapon.radius,
      color:       weapon.projectileColor,
      pierce:      weapon.pierce ?? 999,
      maxRange:    0,
      behaviorId:  'areaBurst',
      maxLifetime: weapon.burstDuration ?? 0.3,
      ownerId:     player.id,
      statusEffectId:     weapon.statusEffectId     ?? null,
      statusEffectChance: weapon.statusEffectChance ?? 1.0,
    },
  });

  // ── areaBurst + targetProjectile 복합 패턴 ────────────────
  // projectileCount가 있고 타겟이 존재하면 확산 투사체 발사
  const projCount = weapon.projectileCount ?? 0;
  if (projCount > 0 && target) {
    const dir    = normalize(sub(target, player));
    const spread = Math.PI / 14;
    for (let i = 0; i < projCount; i++) {
      const offset = (i - (projCount - 1) / 2) * spread;
      const cos = Math.cos(offset);
      const sin = Math.sin(offset);
      spawnQueue.push({
        type: 'projectile',
        config: {
          x: player.x,
          y: player.y,
          dirX:  dir.x * cos - dir.y * sin,
          dirY:  dir.x * sin + dir.y * cos,
          speed:      weapon.projectileSpeed ?? 350,
          damage:     weapon.damage,
          radius:     weapon.radius ?? 5,
          color:      weapon.projectileColor,
          pierce:     weapon.pierce ?? 1,
          maxRange:   weapon.range,
          behaviorId: 'targetProjectile',
          ownerId:    player.id,
          statusEffectId:     weapon.statusEffectId     ?? null,
          statusEffectChance: weapon.statusEffectChance ?? 1.0,
        },
      });
    }
  }

  return true;
}
