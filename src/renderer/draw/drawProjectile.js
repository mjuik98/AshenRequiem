/**
 * drawProjectile — 투사체 렌더링
 *
 * PERF: targetProjectile 은 shadowBlur 제거 → 중심 하이라이트로 대체
 *   (투사체가 가장 많아 shadowBlur 비용이 집중되는 타입)
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

  } else {
    // 일반 투사체 — shadowBlur 없이 하이라이트로 대체
    ctx.fillStyle = proj.color;
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

  ctx.restore();
}
