/**
 * src/renderer/draw/drawEffect.js
 *
 * ─── 개선 P0-B ────────────────────────────────────────────────────────
 * Before:
 *   effectType === 'damageText' / 'levelFlash' / else(burst) 분기가
 *   이 파일에 인라인으로 존재. 새 이펙트 추가마다 이 파일 수정 필요.
 *
 * After:
 *   drawEffectRegistry에서 draw 함수를 조회해 위임.
 *   새 이펙트 타입 추가 = drawEffectRegistry.js에 registerEffectDraw() 1줄.
 *   이 파일은 수정하지 않는다.
 * ──────────────────────────────────────────────────────────────────────
 */

import { getEffectDraw } from './drawEffectRegistry.js';
import { drawPickup }    from './drawPickup.js';  // 픽업은 별도 파일 유지

/**
 * 단일 effect를 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} effect
 * @param {{ x: number, y: number }} camera
 * @param {number} dpr
 */
export function drawEffect(ctx, effect, camera, dpr) {
  if (!effect.isAlive) return;

  const _dpr = dpr || window.devicePixelRatio || 1;

  ctx.save();

  const drawFn = getEffectDraw(effect.effectType);
  drawFn(ctx, effect, camera, _dpr);

  ctx.restore();
}

export { drawPickup };
