/**
 * src/renderer/draw/drawEffectRegistry.js
 *
 * ─── 개선 P0-B ────────────────────────────────────────────────────────
 * Before:
 *   drawEffect.js 내부에 effectType별 if/else 분기가 하드코딩되어 있음.
 *   새 이펙트 타입(보스 특수 연출, 스킬 플래시 등) 추가 시마다
 *   drawEffect.js를 직접 수정해야 하는 구조.
 *
 * After:
 *   drawBehaviorRegistry / weaponBehaviorRegistry와 동일한 위임 패턴.
 *   새 이펙트 draw 함수 = 이 파일에 registerEffectDraw() 1줄만 추가.
 *   drawEffect.js 수정 불필요.
 *
 * 사용법:
 *   // 신규 이펙트 타입 등록
 *   import { registerEffectDraw } from './drawEffectRegistry.js';
 *   registerEffectDraw('myEffect', (ctx, effect, camera, dpr) => { ... });
 * ──────────────────────────────────────────────────────────────────────
 */

import { sharedVfxSpriteRuntime } from '../sprites/vfxSpriteRuntime.js';

// ── draw 구현체들 ─────────────────────────────────────────────────────

/**
 * damageText — 데미지 숫자 부유 텍스트
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} effect
 * @param {{ x: number, y: number }} camera
 * @param {number} _dpr  (미사용, 인터페이스 통일용)
 */
function drawDamageText(ctx, effect, camera, _dpr) {
  const progress = Math.min(1, effect.lifetime / effect.maxLifetime);
  const sx   = effect.x - camera.x;
  const sy   = effect.y - camera.y;
  const rise = progress * 28;

  ctx.globalAlpha = Math.max(0, 1 - progress * 1.2);
  ctx.shadowColor = effect.color;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = effect.color;
  ctx.font        = `bold ${13 + Math.round(progress * 3)}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.fillText(effect.text, sx, sy - rise);
}

/**
 * levelFlash — 레벨업 전체 화면 플래시
 *
 * FIX(bug): setTransform(1,0,0,1,0,0) 으로 카메라 transform 초기화해
 *   전체 화면을 정확히 커버.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} effect
 * @param {object} _camera  (미사용, 전체 화면이므로)
 * @param {number} dpr
 */
function drawLevelFlash(ctx, effect, _camera, dpr) {
  const progress = Math.min(1, effect.lifetime / effect.maxLifetime);
  const alpha = progress < 0.3
    ? progress / 0.3
    : 1 - (progress - 0.3) / 0.7;

  ctx.globalAlpha = Math.max(0, alpha) * 0.35;
  ctx.fillStyle   = effect.color || '#ffd54f';

  const w = ctx.canvas.width  / dpr;
  const h = ctx.canvas.height / dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillRect(0, 0, w, h);
}

/**
 * burst — 파티클 링 + 중심 플래시
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} effect
 * @param {{ x: number, y: number }} camera
 * @param {number} _dpr
 */
function drawBurst(ctx, effect, camera, _dpr, spriteRuntime = sharedVfxSpriteRuntime) {
  if (spriteRuntime?.drawEffectSprite?.(ctx, effect, camera)) return;
  const progress      = Math.min(1, effect.lifetime / effect.maxLifetime);
  const sx            = effect.x - camera.x;
  const sy            = effect.y - camera.y;
  const PARTICLE_COUNT = 8;
  const maxR          = effect.radius * (1 + progress * 1.8);
  const fade          = Math.max(0, 1 - progress);

  // 중심 플래시
  if (progress < 0.4) {
    const flashAlpha = (1 - progress / 0.4) * 0.55;
    ctx.globalAlpha = flashAlpha;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, effect.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  // 파티클 링
  ctx.globalAlpha = fade * 0.75;
  ctx.fillStyle   = effect.color;
  ctx.shadowColor = effect.color;
  ctx.shadowBlur  = 6;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle  = (i / PARTICLE_COUNT) * Math.PI * 2;
    const spread = progress * 0.6;
    const jAngle = angle + spread * (i % 2 === 0 ? 1 : -1);
    const r      = maxR * (0.6 + (i % 3) * 0.15);
    ctx.beginPath();
    ctx.arc(sx + Math.cos(jAngle) * r, sy + Math.sin(jAngle) * r, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChainLightning(ctx, effect, camera, _dpr) {
  const points = Array.isArray(effect.chainPoints) ? effect.chainPoints : null;
  if (!points || points.length < 2) return;

  const progress = Math.min(1, effect.lifetime / Math.max(0.001, effect.maxLifetime || 0.16));
  const alpha = Math.max(0, 1 - progress * 1.15);
  const outerWidth = Math.max(2, (effect.radius ?? 10) * (1.15 - progress * 0.45));
  const innerWidth = Math.max(1, outerWidth * 0.42);
  const color = effect.color ?? '#b388ff';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const startX = from.x - camera.x;
    const startY = from.y - camera.y;
    const endX = to.x - camera.x;
    const endY = to.y - camera.y;
    const midX = (startX + endX) * 0.5;
    const midY = (startY + endY) * 0.5;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const bend = Math.min(18, length * 0.12) * (index % 2 === 0 ? 1 : -1) * (1 - progress * 0.4);

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.lineWidth = outerWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX + normalX * bend, midY + normalY * bend, endX, endY);
    ctx.stroke();

    ctx.strokeStyle = '#f7fbff';
    ctx.shadowColor = '#f7fbff';
    ctx.shadowBlur = 8;
    ctx.lineWidth = innerWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX + normalX * bend * 0.65, midY + normalY * bend * 0.65, endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

// ── 레지스트리 ────────────────────────────────────────────────────────

/**
 * effectType → draw 함수 매핑.
 * @type {Map<string, (ctx: CanvasRenderingContext2D, effect: object, camera: object, dpr: number) => void>}
 */
const _registry = new Map([
  ['damageText', drawDamageText],
  ['levelFlash', drawLevelFlash],
  ['burst',      drawBurst],
  ['chainLightning', drawChainLightning],
]);

/**
 * effectType에 대응하는 draw 함수를 반환한다.
 * 등록되지 않은 타입은 burst로 폴백.
 *
 * @param {string} effectType
 * @returns {Function}
 */
export function getEffectDraw(effectType) {
  return _registry.get(effectType) ?? drawBurst;
}

/**
 * 새 이펙트 draw 함수를 등록한다.
 * 보스 특수 연출, 스킬 플래시 등 추가 시 이 함수만 호출.
 *
 * @param {string}   effectType
 * @param {Function} drawFn  (ctx, effect, camera, dpr) => void
 */
export function registerEffectDraw(effectType, drawFn) {
  _registry.set(effectType, drawFn);
}

/** 등록된 effectType 목록 반환 (validateData, 디버그용) */
export function getRegisteredEffectTypes() {
  return new Set(_registry.keys());
}
