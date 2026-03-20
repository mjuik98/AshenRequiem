/**
 * src/behaviors/enemyBehaviors/rangedChase.js — 원거리 유지 + 투사체 발사
 *
 * ghost 등 원거리형 적에 적용.
 *
 * 동작:
 *   - MIN_DIST 이내 : 후퇴
 *   - MIN_DIST ~ MAX_DIST : 정지 (사거리 내 위치 유지)
 *   - MAX_DIST 이상 : 천천히 접근
 *   - shootTimer 종료 시 : 플레이어 방향으로 투사체 발사 (projectileConfig 필요)
 */

const MIN_DIST    = 180;   // 이 거리 이내면 후퇴
const MAX_DIST    = 320;   // 이 거리 이상이면 접근
const SHOOT_INTERVAL_BASE  = 2.2;  // 기본 발사 간격 (s)
const SHOOT_INTERVAL_RAND  = 1.0;  // 랜덤 추가 간격

/**
 * @param {object} enemy
 * @param {{ player: object, deltaTime: number, spawnQueue?: object[] }} ctx
 */
export function rangedChase(enemy, { player, deltaTime, spawnQueue = [] }) {
  if (!player?.isAlive) return;

  const dx   = player.x - enemy.x;
  const dy   = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;

  // ── 이동 로직 ────────────────────────────────────────────────────────────
  if (dist < MIN_DIST) {
    // 후퇴
    enemy.x -= dirX * enemy.moveSpeed * deltaTime;
    enemy.y -= dirY * enemy.moveSpeed * deltaTime;
  } else if (dist > MAX_DIST) {
    // 천천히 접근
    enemy.x += dirX * enemy.moveSpeed * 0.55 * deltaTime;
    enemy.y += dirY * enemy.moveSpeed * 0.55 * deltaTime;
  }
  // MIN_DIST ~ MAX_DIST 구간: 이동 없음 (현 위치 유지)

  // ── 투사체 발사 ───────────────────────────────────────────────────────────
  if (!enemy.projectileConfig) return;

  if (enemy._shootTimer === undefined) {
    enemy._shootTimer = SHOOT_INTERVAL_BASE * 0.5; // 첫 발사 빠르게
  }

  enemy._shootTimer -= deltaTime;
  if (enemy._shootTimer > 0) return;

  enemy._shootTimer = SHOOT_INTERVAL_BASE + Math.random() * SHOOT_INTERVAL_RAND;

  const cfg = enemy.projectileConfig;
  spawnQueue.push({
    type: 'projectile',
    config: {
      x:          enemy.x,
      y:          enemy.y,
      dirX,
      dirY,
      speed:      cfg.speed  ?? 170,
      damage:     cfg.damage ?? 5,
      radius:     cfg.radius ?? 6,
      color:      cfg.color  ?? '#cfd8dc',
      pierce:     cfg.pierce ?? 1,
      maxRange:   420,
      behaviorId: 'targetProjectile',
      ownerId:    enemy.id,
    },
  });
}
