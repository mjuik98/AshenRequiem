/**
 * src/renderer/draw/drawProjectile.js
 *
 * CHANGE(P2-①): behaviorId 분기 제거 → drawBehaviorRegistry 위임
 *   Before: if (proj.behaviorId === 'orbit') ... else if ('areaBurst') ... else ...
 *   After:  const draw = getDrawBehavior(proj.behaviorId); draw(ctx, proj, sx, sy)
 *
 *   새 무기 렌더를 추가할 때 이 파일은 수정하지 않는다.
 *   drawBehaviorRegistry.js에 draw 함수 등록만 하면 됨.
 */

import { getDrawBehavior } from './drawBehaviorRegistry.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} proj
 * @param {{ x: number, y: number }} camera
 */
export function drawProjectile(ctx, proj, camera) {
  if (!proj.isAlive) return;

  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;

  ctx.save();

  const drawFn = getDrawBehavior(proj.behaviorId);
  drawFn(ctx, proj, sx, sy);

  ctx.restore();
}
