/**
 * drawEffect — 시각 이펙트 렌더링
 * drawPickup도 이 파일에서 처리 (분리 시점까지)
 */

/** 이펙트 렌더링 */
export function drawEffect(ctx, effect, camera) {
  if (!effect.isAlive) return;
  const sx = effect.x - camera.x;
  const sy = effect.y - camera.y;
  const progress = effect.lifetime / effect.maxLifetime;

  ctx.save();

  if (effect.effectType === 'damageText') {
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = effect.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(effect.text, sx, sy - progress * 20);
  } else {
    // burst 이펙트
    const r = effect.radius * (0.5 + progress * 0.5);
    ctx.globalAlpha = (1 - progress) * 0.6;
    ctx.fillStyle = effect.color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** 픽업 렌더링 */
export function drawPickup(ctx, pickup, camera) {
  if (!pickup.isAlive) return;
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;

  ctx.save();
  ctx.shadowColor = pickup.color;
  ctx.shadowBlur = 6;
  ctx.fillStyle = pickup.color;

  // 작은 다이아몬드 형태
  const r = pickup.radius;
  ctx.beginPath();
  ctx.moveTo(sx, sy - r);
  ctx.lineTo(sx + r, sy);
  ctx.lineTo(sx, sy + r);
  ctx.lineTo(sx - r, sy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
