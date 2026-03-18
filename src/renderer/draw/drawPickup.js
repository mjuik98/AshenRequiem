/**
 * src/renderer/draw/drawPickup.js
 *
 * 픽업(경험치 젬 등)을 그린다.
 * drawEffect.js에서 픽업 파트를 분리하여 유지하는 파일.
 */

/**
 * 단일 pickup 엔티티를 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} pickup
 * @param {{ x: number, y: number }} camera
 */
export function drawPickup(ctx, pickup, camera) {
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;
  const r  = pickup.radius || 6;

  ctx.save();

  // 글로우 효과 (경험치 젬의 신비로운 느낌)
  ctx.shadowColor = pickup.color || '#66bb6a';
  ctx.shadowBlur  = 8;
  ctx.fillStyle   = pickup.color || '#66bb6a';

  // 다이아몬드/젬 형태 그리기
  ctx.beginPath();
  ctx.moveTo(sx, sy - r);         // 위
  ctx.lineTo(sx + r, sy);         // 오른쪽
  ctx.lineTo(sx, sy + r);         // 아래
  ctx.lineTo(sx - r, sy);         // 왼쪽
  ctx.closePath();
  ctx.fill();

  // 하이라이트 (반짝임 포인트)
  ctx.fillStyle   = '#ffffff';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(sx - r * 0.2, sy - r * 0.5);
  ctx.lineTo(sx + r * 0.2, sy - r * 0.5);
  ctx.lineTo(sx + r * 0.2, sy - r * 0.2);
  ctx.lineTo(sx - r * 0.2, sy - r * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
