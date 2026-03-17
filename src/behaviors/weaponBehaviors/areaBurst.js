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
 *   반환: 대상 없으면 false (쿨다운 즉시 재시도 신호)
 */

import { normalize, sub } from '../../math/Vector2.js';

/**
 * 플레이어에서 가장 가까운 살아있는 적 반환.
 * @param {{x:number, y:number}} player
 * @param {object[]} enemies
 * @param {number} range
 * @returns {object|null}
 */
function findClosestEnemy(player, enemies, range) {
  let closest   = null;
  let minDistSq = range * range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.isAlive || e.pendingDestroy) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDistSq) { minDistSq = dSq; closest = e; }
  }
  return closest;
}

/**
 * areaBurst 무기 동작 실행.
 *
 * @param {{
 *   weapon:     object,
 *   player:     object,
 *   enemies:    object[],
 *   spawnQueue: object[],
 * }} ctx
 * @returns {boolean} 타겟이 있어서 실제 발동하면 true, 없으면 false
 */
export function areaBurst({ weapon, player, enemies, spawnQueue }) {
  // 범위 안에 적이 없어도 중심 폭발 투사체는 발사되어야 함
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
