export function drawPlayer(ctx, player, camera) {
  const sx = player.x - camera.x, sy = player.y - camera.y;
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) return;
  ctx.save();
  ctx.shadowColor = player.color; ctx.shadowBlur = 18;
  ctx.fillStyle = player.color;
  ctx.beginPath(); ctx.arc(sx, sy, player.radius, 0, Math.PI * 2); ctx.fill();
  const eyeOffset = player.radius * 0.4;
  ctx.fillStyle = '#0d1117';
  ctx.beginPath(); ctx.arc(sx + player.facingX * eyeOffset, sy + player.facingY * eyeOffset, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
