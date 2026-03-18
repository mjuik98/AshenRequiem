/**
 * src/renderer/draw/drawProjectile.js
 *
 * P1-② 개선: if/else 분기 제거 → drawBehaviorRegistry 위임
 *
 * Before:
 *   if (proj.behaviorId === 'targetProjectile') { ... }
 *   else if (proj.behaviorId === 'orbit') { ... }
 *   // 새 투사체 추가 시 이 파일 직접 수정 필요
 *
 * After:
 *   drawBehaviorRegistry에서 draw 함수를 조회해 위임.
 *   새 투사체 draw = drawBehaviorRegistry.js에 registerProjectileDraw() 1줄.
 *   이 파일은 수정하지 않는다.
 */

import { getProjectileDraw } from './drawBehaviorRegistry.js';

/**
 * 단일 투사체를 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}                  proj         투사체 엔티티
 * @param {{ x: number, y: number }} camera
 * @param {boolean}                 [lowQuality] 글로우 등 효과 생략 여부
 */
export function drawProjectile(ctx, proj, camera, lowQuality = false) {
  if (!proj.isAlive) return;

  ctx.save();
  ctx.shadowBlur = 0; // 이전 프레임 shadowBlur 초기화

  const drawFn = getProjectileDraw(proj.behaviorId ?? 'default');
  drawFn(ctx, proj, camera, lowQuality);

  ctx.restore();
}
