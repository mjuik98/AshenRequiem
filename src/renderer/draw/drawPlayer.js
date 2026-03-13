/**
 * drawPlayer — 플레이어 렌더링
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} player
 * @param {object} camera — { x, y }
 */
export function drawPlayer(ctx, player, camera) {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;

  // 무적 시 점멸
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
    return;
  }

  // 글로우 효과
  ctx.save();
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 18;

  // 몸체 (원)
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // 눈 (방향 표시)
  const eyeOffset = player.radius * 0.4;
  const eyeR = 3;
  ctx.fillStyle = '#0d1117';
  ctx.beginPath();
  ctx.arc(sx + player.facingX * eyeOffset, sy + player.facingY * eyeOffset, eyeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
