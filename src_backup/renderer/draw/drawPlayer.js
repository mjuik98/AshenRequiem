/** drawPlayer — 플레이어 렌더링 */
export function drawPlayer(ctx, player, camera) {
  const sx = player.x - camera.x;
  const sy = player.y - camera.y;

  // 무적 깜빡임
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) return;

  ctx.save();
  ctx.shadowColor = player.color;
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = player.color;
  ctx.beginPath();
  ctx.arc(sx, sy, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // 눈 (방향 표시)
  const eyeOffset = player.radius * 0.4;
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#0d1117';
  ctx.beginPath();
  ctx.arc(
    sx + player.facingX * eyeOffset,
    sy + player.facingY * eyeOffset,
    3, 0, Math.PI * 2,
  );
  ctx.fill();

  // 슬로우 상태 표시 (파란 링)
  const slow = player.statusEffects?.find(e => e.type === 'slow');
  if (slow) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── HP 바 (최대체력 미만일 때만 표시) ──────────────────────────────
  if (player.hp < player.maxHp && player.maxHp > 0) {
    const pct  = Math.max(0, player.hp / player.maxHp);
    const barW = player.radius * 2.2;
    const barH = 4;
    const barX = sx - barW / 2;
    const barY = sy + player.radius + 5;

    // 체력 비율에 따른 색상 (적과 동일한 스타일)
    const hpColor = pct > 0.6 ? '#4fc3f7' : pct > 0.3 ? '#ff7043' : '#ff1744';

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.9;

    // 배경
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    // 체력 채움
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * pct, barH);

    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
