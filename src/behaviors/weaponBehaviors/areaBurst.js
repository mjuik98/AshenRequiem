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
 * ── 개선 이력 ──────────────────────────────────────────────────────
 * Before:
 *   projectileCount 처리 루프(spread 계산 + spawnQueue.push)가
 *   targetProjectile.js 와 동일하게 이 파일에 복붙되어 있었음.
 *
 * After:
 *   spawnDirectionalProjectiles() 1줄 호출로 대체.
 *   중심 폭발(areaBurst) 투사체 생성만 이 파일에서 담당.
 * ──────────────────────────────────────────────────────────────────
 */

import { findClosestEnemy, spawnDirectionalProjectiles } from './weaponBehaviorUtils.js';

/**
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
      x:                  player.x,
      y:                  player.y,
      dirX:               0,
      dirY:               0,
      speed:              0,
      damage:             weapon.damage,
      radius:             weapon.radius,
      color:              weapon.projectileColor,
      pierce:             weapon.pierce ?? 999,
      maxRange:           0,
      behaviorId:         'areaBurst',
      maxLifetime:        weapon.burstDuration ?? 0.3,
      ownerId:            player.id,
      statusEffectId:     weapon.statusEffectId     ?? null,
      statusEffectChance: weapon.statusEffectChance ?? 1.0,
    },
  });

  // ── areaBurst + targetProjectile 복합 패턴 ────────────────
  // projectileCount가 있고 타겟이 존재하면 확산 투사체 발사
  const projCount = weapon.projectileCount ?? 0;
  if (projCount > 0 && target) {
    spawnDirectionalProjectiles(
      { ...weapon, projectileCount: projCount },
      player,
      target,
      spawnQueue,
    );
  }

  return true;
}

