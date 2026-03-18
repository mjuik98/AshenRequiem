/**
 * src/behaviors/weaponBehaviors/weaponBehaviorUtils.js
 *
 * 무기 행동(weaponBehaviors/*.js)에서 공통으로 사용하는 유틸리티 함수 모음.
 *
 * ── 중앙화 배경 ──────────────────────────────────────────────────────
 *   Before:
 *     - targetProjectile.js / areaBurst.js — 동일한 findClosestEnemy() 로컬 복사
 *     - boomerangWeapon.js / chainLightning.js — getLiveEnemies 필터 + 근접 탐색 인라인
 *     - 4개 파일 전부 distanceSq 수식(dx*dx+dy*dy)을 직접 인라인 반복
 *       (Vector2.distanceSq가 있음에도 미활용)
 *
 *   After:
 *     - findClosestEnemy / findNearestFrom / getLiveEnemies 를 이 파일에서 단일 정의
 *     - 각 behavior 파일은 import 한 줄로 사용
 *     - 내부적으로 Vector2.distanceSq 사용 → sqrt 생략, 성능 일관성 확보
 *
 * ── 공개 API ─────────────────────────────────────────────────────────
 *   getLiveEnemies(enemies)
 *   findClosestEnemy(origin, enemies, maxRange)
 *   findNearestFrom(origin, candidates, maxRange, visited?)
 */

import { distanceSq } from '../../math/Vector2.js';

// ─────────────────────────────────────────────────────────────────────
// 적 목록 필터링
// ─────────────────────────────────────────────────────────────────────

/**
 * 살아있는 적 목록 반환 (pendingDestroy 제외).
 *
 * Before(중복): 각 behavior 파일에서 enemies.filter(e => e.isAlive && !e.pendingDestroy) 반복
 * After:        이 함수 한 줄 호출로 대체
 *
 * @param {object[]} enemies
 * @returns {object[]}
 */
export function getLiveEnemies(enemies) {
  return enemies.filter(e => e.isAlive && !e.pendingDestroy);
}

// ─────────────────────────────────────────────────────────────────────
// 근접 적 탐색
// ─────────────────────────────────────────────────────────────────────

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 살아있는 적 반환.
 *
 * Before(중복):
 *   targetProjectile.js 와 areaBurst.js 각각에 동일한 findClosestEnemy() 로컬 함수 존재.
 *   boomerangWeapon.js, chainLightning.js 는 Math.sqrt 기반 인라인 루프 사용.
 * After:
 *   이 함수 하나로 통일. distanceSq() 사용으로 sqrt 불필요 → 성능 향상.
 *   isAlive / pendingDestroy 가드 내장 → 호출 측에서 별도 필터 불필요.
 *
 * @param {{x:number, y:number}} origin   기준점 (통상 player)
 * @param {object[]}             enemies  전체 적 배열 (필터 안 된 원본도 OK)
 * @param {number}               maxRange 최대 탐지 거리 (px)
 * @returns {object|null}        가장 가까운 적 엔티티, 없으면 null
 */
export function findClosestEnemy(origin, enemies, maxRange) {
  let closest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.isAlive || e.pendingDestroy) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      closest   = e;
    }
  }
  return closest;
}

/**
 * 기준점(origin)으로부터 maxRange 이내에서 가장 가까운 후보 반환.
 * visited Set으로 이미 선택된 적을 제외할 수 있어 chainLightning 연쇄 hop에 적합.
 *
 * Before(인라인):
 *   chainLightning.js 연쇄 루프 내부에 동일한 최소 거리 탐색 로직 반복 존재.
 * After:
 *   이 함수로 분리. visited 파라미터로 hop 이력 관리까지 위임.
 *
 * @param {{x:number, y:number}} origin      기준점 (현재 hop의 출발 적)
 * @param {object[]}             candidates  탐색 대상 목록 (getLiveEnemies 결과 권장)
 * @param {number}               maxRange    최대 연결 거리 (px)
 * @param {Set<string>}          [visited]   이미 방문한 적 id 집합 (선택)
 * @returns {object|null}        가장 가까운 미방문 적, 없으면 null
 */
export function findNearestFrom(origin, candidates, maxRange, visited) {
  let nearest   = null;
  let minDistSq = maxRange * maxRange;

  for (let i = 0; i < candidates.length; i++) {
    const e = candidates[i];
    if (visited?.has(e.id)) continue;
    const dSq = distanceSq(origin, e);
    if (dSq < minDistSq) {
      minDistSq = dSq;
      nearest   = e;
    }
  }
  return nearest;
}
