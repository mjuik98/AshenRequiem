/**
 * src/renderer/draw/drawBehaviorRegistry.js
 *
 * CHANGE(P2-①): drawProjectile.js의 if/else behaviorId 분기 제거
 *   Before: drawProjectile.js 내에 if (proj.behaviorId === 'orbit') ... else if ... 분기
 *           → 새 무기 추가 시 drawProjectile.js도 수정 필요
 *   After:  weaponBehaviorRegistry 패턴과 동일하게 레지스트리 위임
 *           → 새 무기 렌더: drawBehaviorRegistry에 2줄 추가만으로 완성
 *
 * 새 무기 렌더 추가 방법:
 *   1. src/renderer/draw/weaponDrawBehaviors/myWeapon.js 생성
 *   2. 이 파일에 import 추가
 *   3. drawBehaviorRegistry.set('myWeaponId', drawMyWeapon) 추가
 *   → drawProjectile.js 수정 불필요
 */

// ─── 개별 draw 함수 ───────────────────────────────────────────────────

/**
 * 일반 투사체 (targetProjectile, boomerang 등)
 * PERF: shadowBlur 제거 — 중심 하이라이트로 대체
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
  const alpha = Math.max(0, 1 - (proj.lifetime / proj.maxLifetime));
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
  const angle = (proj.lifetime ?? 0) * 6; // 회전 속도
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
 * 번개 연쇄 이펙트 (chainLightning) — 즉발이므로 별도 투사체 없음.
 * spawnQueue 대신 events.hits에 직접 push하는 방식이지만,
 * 잔류 이펙트 표현이 필요한 경우 이 함수를 사용.
 */
function drawChainLightning(ctx, proj, sx, sy) {
  ctx.strokeStyle = proj.color ?? '#40c4ff';
  ctx.lineWidth   = 2;
  ctx.shadowColor = proj.color ?? '#40c4ff';
  ctx.shadowBlur  = 14;
  ctx.globalAlpha = Math.max(0, 1 - (proj.lifetime / (proj.maxLifetime ?? 0.15)));

  // 지그재그 번개 표현
  const segments = 6;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 1; i <= segments; i++) {
    const t  = i / segments;
    const jx = sx + (proj.targetX - sx) * t + (Math.random() - 0.5) * 14;
    const jy = sy + (proj.targetY - sy) * t + (Math.random() - 0.5) * 14;
    ctx.lineTo(jx, jy);
  }
  ctx.stroke();
}

// ─── 레지스트리 ───────────────────────────────────────────────────────

/**
 * behaviorId → draw 함수 매핑
 * @type {Map<string, (ctx: CanvasRenderingContext2D, proj: object, sx: number, sy: number) => void>}
 */
export const drawBehaviorRegistry = new Map([
  ['targetProjectile', drawDefault],
  ['orbit',            drawOrbit],
  ['areaBurst',        drawAreaBurst],
  ['boomerang',        drawBoomerang],
  ['chainLightning',   drawChainLightning],
]);

/**
 * behaviorId로 draw 함수를 조회한다.
 * 등록되지 않은 id는 기본 draw로 폴백.
 *
 * @param {string} behaviorId
 * @returns {Function}
 */
export function getDrawBehavior(behaviorId) {
  return drawBehaviorRegistry.get(behaviorId) ?? drawDefault;
}
