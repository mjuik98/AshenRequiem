/**
 * src/renderer/draw/drawBehaviorRegistry.js
 *
 * P1-② 개선: drawProjectile.js if/else 분기 → 레지스트리 위임 패턴
 *
 * Before:
 *   drawProjectile.js 내부에 behaviorId별 if/else 분기 하드코딩.
 *   새 투사체 비주얼 추가 시마다 drawProjectile.js 직접 수정 필요.
 *   weaponBehaviorRegistry / drawEffectRegistry와 패턴 불일치.
 *
 * After:
 *   이 레지스트리에 register() 2줄만 추가하면 새 투사체 draw 함수 등록 완료.
 *   drawProjectile.js는 수정하지 않는다.
 *
 * 사용법:
 *   // 신규 투사체 비주얼 등록
 *   import { registerProjectileDraw } from './drawBehaviorRegistry.js';
 *   registerProjectileDraw('myBehaviorId', (ctx, proj, camera, lowQuality) => { ... });
 */

// ── draw 구현체 ───────────────────────────────────────────────────────────

/**
 * 기본 원형 투사체
 */
function drawDefault(ctx, proj, camera) {
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;
  ctx.beginPath();
  ctx.arc(sx, sy, proj.radius ?? 5, 0, Math.PI * 2);
  ctx.fillStyle = proj.color ?? '#fff';
  ctx.fill();
}

/**
 * targetProjectile — 조준 투사체 (기본과 동일, 색상 차별화)
 */
function drawTargetProjectile(ctx, proj, camera, lowQuality) {
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;
  const r  = proj.radius ?? 5;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fillStyle = proj.color ?? '#ffdd44';
  ctx.fill();
  if (!lowQuality) {
    ctx.shadowColor = proj.color ?? '#ffdd44';
    ctx.shadowBlur  = 6;
  }
}

/**
 * orbit — 궤도 투사체
 */
function drawOrbit(ctx, proj, camera, lowQuality) {
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;
  const r  = proj.radius ?? 7;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fillStyle = proj.color ?? '#44aaff';
  ctx.fill();
  if (!lowQuality) {
    ctx.shadowColor = '#44aaff';
    ctx.shadowBlur  = 10;
  }
}

/**
 * areaBurst — 범위 폭발 투사체
 */
function drawAreaBurst(ctx, proj, camera, lowQuality) {
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;
  const progress = proj.lifetime ? Math.min(1, proj.age / proj.lifetime) : 0;
  const r  = (proj.radius ?? 20) * (1 + progress * 0.5);
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fillStyle = proj.color ?? '#ff6600';
  if (!lowQuality) {
    ctx.shadowColor = proj.color ?? '#ff6600';
    ctx.shadowBlur  = 20;
  }
  ctx.fill();
  ctx.restore();
}

/**
 * boomerang — 부메랑 투사체 (타원형 + 회전)
 */
function drawBoomerang(ctx, proj, camera, lowQuality) {
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(proj.angle ?? 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, (proj.radius ?? 8) * 1.6, (proj.radius ?? 8) * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = proj.color ?? '#ffaa00';
  if (!lowQuality) {
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur  = 8;
  }
  ctx.fill();
  ctx.restore();
}

/**
 * chainLightning — 즉발 번개 (라인 이펙트)
 * 투사체 없이 events.hits에 직접 밀어넣는 방식이므로 draw는 효과음/이펙트 전담.
 */
function drawChainLightning(ctx, proj, camera) {
  if (!proj.chainPoints || proj.chainPoints.length < 2) return;
  ctx.save();
  ctx.strokeStyle = proj.color ?? '#aaddff';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#aaddff';
  ctx.shadowBlur  = 12;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i < proj.chainPoints.length; i++) {
    const p = proj.chainPoints[i];
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (i === 0) ctx.moveTo(sx, sy);
    else         ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

// ── 레지스트리 ────────────────────────────────────────────────────────────

/** @type {Map<string, Function>} behaviorId → draw 함수 */
const _registry = new Map([
  ['default',         drawDefault],
  ['targetProjectile', drawTargetProjectile],
  ['orbit',           drawOrbit],
  ['areaBurst',       drawAreaBurst],
  ['boomerang',       drawBoomerang],
  ['chainLightning',  drawChainLightning],
]);

/**
 * 새 투사체 draw 함수를 등록한다.
 * @param {string}   behaviorId  weaponBehaviorRegistry와 동일한 ID 사용
 * @param {Function} drawFn      (ctx, proj, camera, lowQuality) => void
 */
export function registerProjectileDraw(behaviorId, drawFn) {
  _registry.set(behaviorId, drawFn);
}

/**
 * behaviorId에 해당하는 draw 함수를 반환한다.
 * 등록되지 않은 ID면 'default' draw 함수를 반환한다.
 * @param {string} behaviorId
 * @returns {Function}
 */
export function getProjectileDraw(behaviorId) {
  return _registry.get(behaviorId) ?? _registry.get('default');
}

/**
 * 등록된 모든 behaviorId 목록 반환 (validate 스크립트용).
 * @returns {string[]}
 */
export function getRegisteredProjectileBehaviorIds() {
  return [..._registry.keys()];
}
