/**
 * src/behaviors/enemyBehaviors/behaviorUtils.js
 * 적 행동 패턴 공통 유틸리티
 *
 * ── 리팩터링 이력 ─────────────────────────────────────────────────────
 * Before:
 *   dist2()      — distanceSq()와 동일 로직을 이 파일에서 중복 구현
 *   moveToward() — normalize 로직을 이 파일에서 인라인 중복 구현
 *
 * After:
 *   두 함수 모두 src/math/Vector2.js를 re-export.
 *   로직은 Vector2.js 한 곳에서만 관리.
 *   기존 호출자(chase, charge, keepDistance, swarm, circle)는
 *   import 경로 변경 없이 그대로 사용 가능 — 하위 호환 유지.
 * ──────────────────────────────────────────────────────────────────────
 */

export { distanceSq as dist2, moveToward } from '../../math/Vector2.js';
