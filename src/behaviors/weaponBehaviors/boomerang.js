/**
 * src/behaviors/weaponBehaviors/boomerang.js
 *
 * 부메랑 — 플레이어로부터 가장 가까운 적 방향으로 발사,
 *           maxRange 도달 후 방향을 반전해 플레이어 쪽으로 귀환하는 투사체.
 *
 * 동작 방식:
 *   1. 발사 시 dirX/dirY 설정 (일반 투사체와 동일)
 *   2. distanceTraveled >= maxRange/2 에서 방향 반전 (dirX/Y *= -1)
 *   3. 원점(플레이어) 근처 도달 시 소멸
 *
 * 구현 방법:
 *   - 투사체 자체에 behaviorId: 'boomerang' 을 부여하고,
 *     ProjectileSystem이 orbit/areaBurst처럼 별도 분기로 처리하거나,
 *     이 동작 함수가 spawnQueue에 커스텀 필드를 담은 투사체를 요청한다.
 *   - 이 파일은 WeaponSystem이 호출하는 "발사" 단계만 담당한다.
 *     방향 반전 로직은 ProjectileSystem 또는 별도 BoomerangSystem에서 처리한다.
 *
 * ProjectileSystem에 추가해야 할 분기 (boomerang 이동):
 *   } else if (p.behaviorId === 'boomerang') {
 *     const dist = p.speed * deltaTime;
 *     p.x += p.dirX * dist;
 *     p.y += p.dirY * dist;
 *     p.distanceTraveled += dist;
 *     // 절반 거리 도달 시 반전
 *     if (!p._reversed && p.distanceTraveled >= p.maxRange / 2) {
 *       p.dirX *= -1;
 *       p.dirY *= -1;
 *       p._reversed = true;
 *     }
 *     // 전체 거리(왕복) 소멸
 *     if (p.distanceTraveled >= p.maxRange) {
 *       p.isAlive = false;
 *       p.pendingDestroy = true;
 *     }
 *   }
 *
 * weaponData.js 추가 예시:
 *   {
 *     id:          'weapon_boomerang',
 *     name:        '부메랑',
 *     behaviorId:  'boomerang',
 *     damage:      8,
 *     cooldown:    1.4,
 *     speed:       280,
 *     radius:      10,
 *     pierce:      3,        // 귀환 중에도 관통
 *     maxRange:    600,       // 왕복 총 거리
 *     color:       '#ffd54f',
 *     maxLevel:    5,
 *   }
 */

/**
 * boomerang — 가장 가까운 적 방향으로 부메랑 투사체 발사
 *
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[] }} ctx
 * @returns {boolean}  발동 성공 여부
 */
export function boomerang({ weapon, player, enemies, spawnQueue }) {
  // 살아있는 적만 필터
  const alive = enemies.filter(e => e.isAlive && !e.pendingDestroy);
  if (alive.length === 0) return false;

  // 가장 가까운 적 탐색
  let nearestDist = Infinity;
  let nearest     = null;

  for (let i = 0; i < alive.length; i++) {
    const e  = alive[i];
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < nearestDist) {
      nearestDist = d;
      nearest     = e;
    }
  }

  // 사거리 밖이면 발동 실패
  const range = weapon.range ?? 500;
  if (nearestDist > range) return false;

  // 방향 벡터 정규화
  const dx  = nearest.x - player.x;
  const dy  = nearest.y - player.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  spawnQueue.push({
    type: 'projectile',
    config: {
      x:          player.x,
      y:          player.y,
      dirX:       dx / len,
      dirY:       dy / len,
      speed:      weapon.speed      ?? 280,
      damage:     weapon.damage     ?? 8,
      radius:     weapon.radius     ?? 10,
      color:      weapon.color      ?? '#ffd54f',
      pierce:     weapon.pierce     ?? 3,
      maxRange:   weapon.maxRange   ?? 600,
      behaviorId: 'boomerang',
      ownerId:    player.id,
      // 부메랑 전용 상태 플래그 (ProjectileSystem에서 참조)
      _reversed:  false,
    },
  });

  return true;
}
