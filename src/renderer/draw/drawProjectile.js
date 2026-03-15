/**
 * drawProjectile — 투사체 렌더링
 *
 * behaviorId:
 *   'orbit'           — 전기 구체 (강한 글로우 + 외곽 링)
 *   'areaBurst'       — 범위 공격 (반투명 원 + 테두리)
 *   'targetProjectile'— 일반 빛나는 원
 */
/**
 * drawProjectile — 투사체 렌더링
 *
 * behaviorId:
 *   'orbit'            — 전기 구체 (강한 글로우 + 외곽 링)
 *   'areaBurst'        — 범위 공격 (반투명 원 + 테두리)
 *   'targetProjectile' — 일반 빛나는 원
 *
 * PATCH(perf): targetProjectile 에서 shadowBlur 제거.
 *   orbit/areaBurst 는 개수가 적으므로 glow 유지.
 *   targetProjectile 은 투사체 수가 가장 많아 shadowBlur 비용 집중.
 *   → shadowBlur 없이 fillStyle + 작은 백색 하이라이트로 시각 퀄리티 유지.
 */
export function drawProjectile(ctx, proj, camera) {
  if (!proj.isAlive) return;
  const sx = proj.x - camera.x;
  const sy = proj.y - camera.y;

  ctx.save();

  if (proj.behaviorId === 'orbit') {
    // 전기 구체 — 강한 글로우 + 외곽 링 (개수 적으므로 glow 유지)
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
    // 일반 투사체 — PATCH(perf): shadowBlur 제거
    // 작은 하이라이트(반투명 백색 원)로 glow 느낌 대체
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    // 중심 하이라이트
    ctx.globalAlpha = 0.5;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - proj.radius * 0.25, sy - proj.radius * 0.25, proj.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
