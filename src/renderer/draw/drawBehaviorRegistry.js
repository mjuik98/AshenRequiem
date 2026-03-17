/**
 * src/renderer/draw/drawBehaviorRegistry.js
 *
 * ─── 변경 사항 ────────────────────────────────────────────────────────
 * [P2-①] drawProjectile.js의 behaviorId if/else 분기 제거 → registry 위임
 *   Before: drawProjectile.js 내에 if/else if 분기로 behaviorId 처리
 *           → 새 무기 추가 시 drawProjectile.js 직접 수정 필요 (WeaponSystem 패턴 불일치)
 *   After:  weaponBehaviorRegistry와 동일한 위임 패턴
 *           → 새 무기 렌더: 이 파일에 draw 함수 등록 2줄만 추가
 *           → drawProjectile.js 수정 불필요
 * ──────────────────────────────────────────────────────────────────────
 */

// ── 기본 draw 구현체들 ────────────────────────────────────────────────

/**
 * 일반 투사체 (targetProjectile, boomerang 기본형 등)
 * PERF: shadowBlur 제거 — 중심 하이라이트로 대체
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} proj
 * @param {number} sx  화면 좌표 x
 * @param {number} sy  화면 좌표 y
 */
function drawDefault(ctx, proj, sx, sy) {
  ctx.fillStyle = proj.color ?? '#ffffff';
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle   = '#ffffff';
  ctx.beginPath();
  ctx.arc(
    sx - proj.radius * 0.25,
    sy - proj.radius * 0.25,
    proj.radius * 0.4,
    0, Math.PI * 2,
  );
  ctx.fill();
}

/**
 * 궤도 투사체 (orbit) — 강한 글로우 + 외곽 링
 */
function drawOrbit(ctx, proj, sx, sy) {
  ctx.shadowColor = proj.color;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = proj.color;
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 0;
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius + 3, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * 범위 폭발 투사체 (areaBurst) — 수명에 따라 페이드 아웃
 */
function drawAreaBurst(ctx, proj, sx, sy) {
  const alpha = Math.max(0, 1 - (proj.lifetime / (proj.maxLifetime || 1)));
  ctx.globalAlpha = alpha * 0.4;
  ctx.fillStyle   = proj.color;
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = proj.color;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * 부메랑 투사체 — 회전 사각형 실루엣
 */
function drawBoomerang(ctx, proj, sx, sy) {
  const angle = (proj.lifetime ?? 0) * 6;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);
  ctx.fillStyle   = proj.color ?? '#ffd740';
  ctx.shadowColor = proj.color ?? '#ffd740';
  ctx.shadowBlur  = 8;
  ctx.fillRect(-proj.radius, -proj.radius * 0.4, proj.radius * 2, proj.radius * 0.8);
  ctx.restore();
}

/**
 * 번개 연쇄 이펙트 (chainLightning) — 잔류 이펙트용
 */
function drawChainLightning(ctx, proj, sx, sy) {
  const alpha = Math.max(0, 1 - (proj.lifetime / (proj.maxLifetime || 0.3)));
  ctx.strokeStyle   = proj.color ?? '#40c4ff';
  ctx.lineWidth     = 2;
  ctx.shadowColor   = proj.color ?? '#40c4ff';
  ctx.shadowBlur    = 14;
  ctx.globalAlpha   = alpha;

  const segments = 4;
  const spread   = proj.radius * 1.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy - proj.radius);
  for (let i = 1; i <= segments; i++) {
    const t  = i / segments;
    const ox = (Math.random() - 0.5) * spread;
    ctx.lineTo(sx + ox, sy - proj.radius + proj.radius * 2 * t);
  }
  ctx.stroke();
}

// ── 레지스트리 ────────────────────────────────────────────────────────

/** @type {Map<string, Function>} */
const _registry = new Map([
  ['targetProjectile', drawDefault],
  ['orbit',           drawOrbit],
  ['areaBurst',       drawAreaBurst],
  ['boomerang',       drawBoomerang],
  ['chainLightning',  drawChainLightning],
]);

/**
 * behaviorId에 대응하는 draw 함수를 반환한다.
 * 등록되지 않은 behaviorId는 drawDefault로 폴백.
 */
export function getDrawBehavior(behaviorId) {
  return _registry.get(behaviorId) ?? drawDefault;
}

/**
 * 새 draw 함수를 등록한다.
 */
export function registerDrawBehavior(behaviorId, drawFn) {
  _registry.set(behaviorId, drawFn);
}

/** 등록된 behaviorId 목록 반환 (디버그용) */
export function getRegisteredDrawBehaviorIds() {
  return new Set(_registry.keys());
}
