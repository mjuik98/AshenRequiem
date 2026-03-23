/**
 * src/behaviors/weaponBehaviors/chainLightning.js
 *
 * 연쇄 번개 — 가장 가까운 적을 1차 타깃으로 공격하고,
 *              chainRange 안의 다른 적에게 최대 chainCount번 번개를 튀긴다.
 *
 * 동작 방식:
 *   - 투사체를 spawnQueue에 넣는 대신 즉시 events.hits 이벤트를 직접 생성한다.
 *   - DamageSystem이 이 이벤트를 소비해 실제 데미지를 처리한다.
 *   - events가 없는 환경(헤드리스 테스트 등)에서는 areaBurst 투사체 fallback 사용.
 *
 * REFACTOR: 인라인 중복 로직 제거
 *   Before:
 *     - enemies.filter(e => e.isAlive && !e.pendingDestroy) 인라인 필터
 *     - 1차 타깃 탐색: Math.sqrt 기반 최소 거리 루프 인라인
 *     - 연쇄 hop 탐색: 동일 패턴의 루프 또 인라인
 *   After:
 *     - getLiveEnemies: 필터 공유
 *     - findClosestEnemy: 1차 타깃 탐색 (origin=player)
 *     - findNearestFrom: hop 탐색 (origin=currentTarget, visited 제외)
 *     → 3개 인라인 루프 → 3줄 함수 호출로 대체
 *
 * weaponData.js 항목 예시:
 *   {
 *     id: 'chain_lightning', name: '연쇄 번개', behaviorId: 'chainLightning',
 *     damage: 12, cooldown: 2.0, range: 350,
 *     chainCount: 3, chainRange: 120, radius: 12,
 *     projectileColor: '#b388ff', maxLevel: 7,
 *   }
 */

import { getLiveEnemies, findClosestEnemy, findNearestFrom } from './weaponBehaviorUtils.js';
import { spawnProjectile } from '../../state/spawnRequest.js';

/**
 * chainLightning — 연쇄 번개 즉발 공격
 *
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[], events?: object }} ctx
 * @returns {boolean}  발동 성공 여부
 */
export function chainLightning({ weapon, player, enemies, spawnQueue, events }) {
  const alive = getLiveEnemies(enemies);
  if (alive.length === 0) return false;

  const range      = weapon.range      ?? 350;
  const chainCount = weapon.chainCount ?? 3;
  const chainRange = weapon.chainRange ?? 120;
  const damage     = weapon.damage     ?? 12;

  // ── 1차 타깃: 플레이어로부터 가장 가까운 적 ──────────────────────
  const firstTarget = findClosestEnemy(player, alive, range);
  if (!firstTarget) return false;

  // ── 연쇄 타깃 수집 ────────────────────────────────────────────────
  const chain   = [firstTarget];
  const visited = new Set([firstTarget.id]);

  for (let hop = 0; hop < chainCount - 1; hop++) {
    const current    = chain[chain.length - 1];
    const nextTarget = findNearestFrom(current, alive, chainRange, visited);
    if (!nextTarget) break;
    chain.push(nextTarget);
    visited.add(nextTarget.id);
  }

  // ── 데미지 적용 ──────────────────────────────────────────────────
  if (events?.hits) {
    // 정상 경로: events.hits 직접 기록 (투사체 없는 즉발 공격)
    for (let i = 0; i < chain.length; i++) {
      // 튈수록 25% 데미지 감쇠
      const dmg = Math.round(damage * Math.pow(0.75, i));
      events.hits.push({
        attackerId:   player.id,
        targetId:     chain[i].id,
        target:       chain[i],
        damage:       dmg,
        projectileId: null,
        projectile:   null,
      });
    }
  } else {
    // fallback: events 없는 환경 — areaBurst 투사체로 대체
    for (let i = 0; i < chain.length; i++) {
      const dmg = Math.round(damage * Math.pow(0.75, i));
      spawnQueue.push(spawnProjectile({
        x: chain[i].x,
        y: chain[i].y,
        config: {
          dirX:        0,
          dirY:        0,
          speed:       0,
          damage:      dmg,
          radius:      weapon.radius ?? 12,
          color:       weapon.projectileColor ?? weapon.color ?? '#b388ff',
          pierce:      1,
          maxRange:    0,
          behaviorId:  'areaBurst',
          maxLifetime: 0.08,
          ownerId:     player.id,
        },
      }));
    }
  }

  return true;
}
