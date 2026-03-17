/**
 * src/behaviors/weaponBehaviors/chainLightning.js
 *
 * 연쇄 번개 — 가장 가까운 적을 1차 타깃으로 공격하고,
 *              그로부터 chainRange 안의 다른 적에게 최대 chainCount번 번개를 튀긴다.
 *
 * 동작 방식:
 *   - 투사체를 spawnQueue에 넣는 대신 즉시 hits 이벤트를 직접 생성한다.
 *     (투사체 없는 즉발 공격 패턴의 예시)
 *   - events.hits 배열에 { attacker, target, damage, weaponId } 형태로 삽입.
 *   - DamageSystem이 이 이벤트를 소비해 실제 데미지를 처리한다.
 *
 * 주의:
 *   - 이 behavior는 spawnQueue 대신 events.hits 를 직접 기록한다.
 *   - WeaponSystem 컨텍스트에 events가 없으면 폴백으로 spawnQueue 방식을 사용한다.
 *
 * weaponData.js 추가 예시:
 *   {
 *     id:          'weapon_chain_lightning',
 *     name:        '연쇄 번개',
 *     behaviorId:  'chainLightning',
 *     damage:      12,
 *     cooldown:    2.0,
 *     range:       350,
 *     chainCount:  3,      // 최대 튀는 횟수 (커스텀 필드)
 *     chainRange:  120,    // 각 번개가 튀는 반경 (커스텀 필드)
 *     color:       '#b388ff',
 *     maxLevel:    5,
 *   }
 */

/**
 * chainLightning — 연쇄 번개 즉발 공격
 *
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[], events?: object }} ctx
 * @returns {boolean}  발동 성공 여부
 */
export function chainLightning({ weapon, player, enemies, spawnQueue, events }) {
  const alive = enemies.filter(e => e.isAlive && !e.pendingDestroy);
  if (alive.length === 0) return false;

  const range      = weapon.range      ?? 350;
  const chainCount = weapon.chainCount ?? 3;
  const chainRange = weapon.chainRange ?? 120;
  const damage     = weapon.damage     ?? 12;

  // ── 1차 타깃: 플레이어로부터 가장 가까운 적 ──────────────────
  let nearestDist = Infinity;
  let firstTarget = null;

  for (let i = 0; i < alive.length; i++) {
    const e  = alive[i];
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const d  = Math.sqrt(dx * dx + dy * dy);
    if (d < nearestDist) {
      nearestDist = d;
      firstTarget = e;
    }
  }

  if (!firstTarget || nearestDist > range) return false;

  // ── 연쇄 타깃 수집 ───────────────────────────────────────────
  const chain    = [firstTarget];
  const visited  = new Set([firstTarget.id]);

  for (let hop = 0; hop < chainCount - 1; hop++) {
    const current  = chain[chain.length - 1];
    let nextTarget = null;
    let nextDist   = Infinity;

    for (let i = 0; i < alive.length; i++) {
      const e = alive[i];
      if (visited.has(e.id)) continue;
      const dx = e.x - current.x;
      const dy = e.y - current.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < chainRange && d < nextDist) {
        nextDist   = d;
        nextTarget = e;
      }
    }

    if (!nextTarget) break;
    chain.push(nextTarget);
    visited.add(nextTarget.id);
  }

  // ── 데미지 적용 방식 결정 ─────────────────────────────────────
  if (events?.hits) {
    // events.hits 직접 기록 (즉발 공격)
    for (let i = 0; i < chain.length; i++) {
      const dmg = Math.round(damage * Math.pow(0.75, i)); // 튈수록 25% 감쇠
      events.hits.push({
        attacker: player,
        target:   chain[i],
        damage:   dmg,
        weaponId: weapon.id,
      });
    }
  } else {
    // fallback: 투사체를 각 적 위치에 areaBurst 형태로 생성
    for (let i = 0; i < chain.length; i++) {
      const dmg = Math.round(damage * Math.pow(0.75, i));
      spawnQueue.push({
        type: 'projectile',
        config: {
          x:           chain[i].x,
          y:           chain[i].y,
          dirX:        0,
          dirY:        0,
          speed:       0,
          damage:      dmg,
          radius:      weapon.radius ?? 12,
          color:       weapon.color  ?? '#b388ff',
          pierce:      1,
          maxRange:    0,
          behaviorId:  'areaBurst',
          maxLifetime: 0.08,
          ownerId:     player.id,
        },
      });
    }
  }

  return true;
}
