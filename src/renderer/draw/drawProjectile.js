/**
 * drawProjectile — 투사체 렌더링
 *
 * behaviorId:
 *   'orbit'           — 전기 구체 (강한 글로우 + 외곽 링)
 *   'areaBurst'       — 범위 공격 (반투명 원 + 테두리)
 *   'targetProjectile'— 일반 빛나는 원
 */
export function drawProjectile(ctx, proj, camera) {
  if (!proj.isAlive) return;
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;

  ctx.save();

  if (proj.behaviorId === 'orbit') {
    // 전기 구체 — 강한 글로우 + 외곽 링
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

  } else if (proj.behaviorId === 'areaBurst') {
    // 범위 공격 — 수명에 따라 페이드 아웃
    const alpha = 1 - (proj.lifetime / proj.maxLifetime);
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

  } else {
    // 일반 투사체 — 빛나는 원
    ctx.shadowColor = proj.color;
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = proj.color;
    ctx.beginPath();
    ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
