/**
 * enemyBehaviorRegistry — 적 AI 행동 패턴 레지스트리
 *
 * WHY(P3): weaponBehaviorRegistry와 동일한 패턴.
 *   EnemyMovementSystem 내부에 if/switch로 행동 분기가 쌓이는 것을 방지한다.
 *   새 적 AI 추가 = 이 파일에 핸들러 등록 + enemyData.js에 behaviorId 추가.
 *
 * 각 핸들러 계약:
 *   handler(enemy, context) → void
 *   context = { player, enemies, deltaTime, world }
 *   핸들러는 enemy 위치만 수정한다. 다른 시스템 직접 호출 금지.
 *
 * enemyData.js 사용 예:
 *   { id: 'fast_runner', behaviorId: 'chase',  speed: 180, ... }
 *   { id: 'tank',        behaviorId: 'charge', speed: 80,  ... }
 *   { id: 'circler',     behaviorId: 'circle', speed: 130, ... }
 *
 * EnemyMovementSystem 적용 예:
 *   import { getEnemyBehavior } from '../../behaviors/enemyBehaviorRegistry.js';
 *
 *   for (const enemy of world.enemies) {
 *     if (!enemy.isAlive || enemy.pendingDestroy) continue;
 *     const fn = getEnemyBehavior(enemy.behaviorId);
 *     fn(enemy, { player: world.player, enemies: world.enemies, deltaTime, world });
 *   }
 */

// ─── 유틸 ──────────────────────────────────────────────────────────

function dist2(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const d  = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.1) return;
  entity.x += (dx / d) * speed * dt;
  entity.y += (dy / d) * speed * dt;
}

// ─── 행동 핸들러 ───────────────────────────────────────────────────

/**
 * chase — 기본 추적
 * 플레이어를 향해 직선으로 이동한다.
 */
function chase(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;
  moveToward(enemy, player.x, player.y, enemy.speed, deltaTime);
}

/**
 * charge — 돌진
 * 평소에는 느리게 추적하다가, 일정 거리 안에 들어오면 빠르게 돌진.
 * enemy에 chargeState 필드가 없으면 초기화한다.
 */
const CHARGE_TRIGGER_DIST_SQ = 300 * 300;
const CHARGE_DURATION        = 0.4; // s
const CHARGE_SPEED_MULT      = 3.5;

function charge(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  // 상태 초기화 (풀 재사용 시에도 안전하도록 undefined 체크)
  if (enemy.chargeState === undefined) {
    enemy.chargeState = { charging: false, timer: 0, dirX: 0, dirY: 0 };
  }
  const s = enemy.chargeState;

  if (s.charging) {
    s.timer -= deltaTime;
    enemy.x += s.dirX * enemy.speed * CHARGE_SPEED_MULT * deltaTime;
    enemy.y += s.dirY * enemy.speed * CHARGE_SPEED_MULT * deltaTime;
    if (s.timer <= 0) s.charging = false;
  } else {
    if (dist2(enemy, player) < CHARGE_TRIGGER_DIST_SQ) {
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      s.dirX    = dx / d;
      s.dirY    = dy / d;
      s.timer   = CHARGE_DURATION;
      s.charging = true;
    } else {
      // 느린 추적
      moveToward(enemy, player.x, player.y, enemy.speed * 0.5, deltaTime);
    }
  }
}

/**
 * circle — 포위 회전
 * 플레이어 주변을 원형으로 회전하며 접근한다.
 * enemy.circleAngle 필드를 사용한다.
 */
const CIRCLE_RADIUS      = 180;  // px
const CIRCLE_APPROACH_SPEED = 60; // px/s (반지름 유지 속도)

function circle(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  if (enemy.circleAngle === undefined) {
    // 현재 각도에서 시작
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    enemy.circleAngle = Math.atan2(dy, dx);
  }

  const rotSpeed = (enemy.circleSpeed ?? 1.5) * deltaTime; // rad/s
  enemy.circleAngle += rotSpeed;

  const targetX = player.x + Math.cos(enemy.circleAngle) * CIRCLE_RADIUS;
  const targetY = player.y + Math.sin(enemy.circleAngle) * CIRCLE_RADIUS;
  moveToward(enemy, targetX, targetY, enemy.speed + CIRCLE_APPROACH_SPEED, deltaTime);
}

/**
 * keepDistance — 원거리 유지
 * 최소 거리 안에 들어오면 후퇴, 너무 멀면 접근.
 */
const KEEP_MIN_DIST_SQ = 200 * 200;
const KEEP_MAX_DIST_SQ = 350 * 350;

function keepDistance(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  const d2   = dist2(enemy, player);
  const dx   = player.x - enemy.x;
  const dy   = player.y - enemy.y;
  const d    = Math.sqrt(d2) || 1;
  const dirX = dx / d;
  const dirY = dy / d;

  if (d2 < KEEP_MIN_DIST_SQ) {
    // 후퇴
    enemy.x -= dirX * enemy.speed * deltaTime;
    enemy.y -= dirY * enemy.speed * deltaTime;
  } else if (d2 > KEEP_MAX_DIST_SQ) {
    // 접근
    enemy.x += dirX * enemy.speed * deltaTime;
    enemy.y += dirY * enemy.speed * deltaTime;
  }
  // else: 적정 거리 — 제자리
}

/**
 * swarm — 군집 이동
 * 다른 swarm 적들과 뭉치면서 플레이어를 향해 이동.
 * 단순 분리(separation) + 추적(cohesion) 조합.
 */
const SWARM_SEPARATION_DIST_SQ = 40 * 40;
const SWARM_SEPARATION_FORCE   = 0.4;

function swarm(enemy, { player, enemies, deltaTime }) {
  if (!player?.isAlive) return;

  // 1. 플레이어를 향한 이동 벡터
  let fx = player.x - enemy.x;
  let fy = player.y - enemy.y;
  const d = Math.sqrt(fx * fx + fy * fy) || 1;
  fx /= d; fy /= d;

  // 2. 인접 같은 타입과의 분리 벡터
  for (let i = 0; i < enemies.length; i++) {
    const other = enemies[i];
    if (other === enemy || !other.isAlive || other.behaviorId !== 'swarm') continue;
    const od2 = dist2(enemy, other);
    if (od2 < SWARM_SEPARATION_DIST_SQ && od2 > 0) {
      const od = Math.sqrt(od2);
      fx -= ((other.x - enemy.x) / od) * SWARM_SEPARATION_FORCE;
      fy -= ((other.y - enemy.y) / od) * SWARM_SEPARATION_FORCE;
    }
  }

  const len = Math.sqrt(fx * fx + fy * fy) || 1;
  enemy.x += (fx / len) * enemy.speed * deltaTime;
  enemy.y += (fy / len) * enemy.speed * deltaTime;
}

// ─── 레지스트리 ────────────────────────────────────────────────────

const registry = {
  chase,
  charge,
  circle,
  keepDistance,
  swarm,
};

/**
 * @param {string} [behaviorId]
 * @returns {Function}  handler(enemy, context) → void
 */
export function getEnemyBehavior(behaviorId) {
  return registry[behaviorId] ?? registry.chase;
}

/**
 * 새로운 행동 패턴을 런타임에 등록한다. (테스트 또는 mod 지원용)
 * @param {string}   id
 * @param {Function} handler
 */
export function registerEnemyBehavior(id, handler) {
  if (typeof handler !== 'function') {
    console.warn(`[enemyBehaviorRegistry] handler는 함수여야 합니다: ${id}`);
    return;
  }
  if (registry[id]) {
    console.warn(`[enemyBehaviorRegistry] 이미 등록된 id를 덮어씁니다: ${id}`);
  }
  registry[id] = handler;
}

/** 등록된 모든 behaviorId 목록 반환 (디버그용) */
export function listEnemyBehaviors() {
  return Object.keys(registry);
}
