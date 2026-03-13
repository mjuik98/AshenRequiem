/**
 * drawEnemy — 적 렌더링
 */
export function drawEnemy(ctx, enemy, camera) {
  if (!enemy.isAlive) return;
  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;

  ctx.save();

  // 피격 플래시
  if (enemy.hitFlashTimer > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = enemy.color;
  }

  // 몸체 (원)
  ctx.beginPath();
  ctx.arc(sx, sy, enemy.radius, 0, Math.PI * 2);
  ctx.fill();

  // HP바 (풀 HP가 아닐 때만)
  if (enemy.hp < enemy.maxHp) {
    const barW = enemy.radius * 2;
    const barH = 3;
    const barX = sx - barW / 2;
    const barY = sy - enemy.radius - 8;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ef5350';
    ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), barH);
  }

  ctx.restore();
}
