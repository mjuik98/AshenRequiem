/** drawEnemy — 적 렌더링 */
export function drawEnemy(ctx, enemy, camera, timestamp) {
  if (!enemy.isAlive || enemy.pendingDestroy) return;

  if (enemy.isProp) {
    drawProp(ctx, enemy, camera, timestamp);
    return;
  }

  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;

  ctx.save();

  // ── 돌진 예고 연출 (chargeEffect) ──────────────────────────
  if (enemy.chargeEffect) {
    const pulse = 0.5 + 0.5 * Math.sin(timestamp * 12);
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur  = 20 + pulse * 14;
  } else if (enemy.hitFlashTimer > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 16;
  } else if (enemy.isElite || enemy.isBoss) {
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur  = 12;
  }

  // 피격 플래시
  ctx.fillStyle = enemy.hitFlashTimer > 0 ? '#ffffff' : enemy.color;

  ctx.beginPath();
  ctx.arc(sx, sy, enemy.radius, 0, Math.PI * 2);
  ctx.fill();

  // ── 보스 / 엘리트 외곽 링 ──────────────────────────────────
  if (enemy.isBoss || enemy.isElite) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = enemy.isBoss ? '#ff4081' : '#ffd740';
    ctx.lineWidth   = enemy.isBoss ? 3 : 2;
    ctx.shadowBlur  = 0;
    ctx.beginPath();
    ctx.arc(sx, sy, enemy.radius + (enemy.isBoss ? 5 : 3), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── HP 바 (엘리트 / 보스) ───────────────────────────────────
  if (enemy.isElite || enemy.isBoss) {
    const barW = enemy.radius * 2.2;
    const barH = enemy.isBoss ? 5 : 3;
    const barX = sx - barW / 2;
    const barY = sy - enemy.radius - (enemy.isBoss ? 14 : 10);
    const pct  = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = enemy.isBoss ? '#ff4081' : '#ffd740';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.globalAlpha = 1;
  }

  // ── 상태이상 아이콘 (작은 점) ──────────────────────────────
  if (enemy.statusEffects?.length > 0) {
    const se = enemy.statusEffects[0];
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle   = se.color || '#ffffff';
    ctx.beginPath();
    ctx.arc(sx + enemy.radius * 0.6, sy - enemy.radius * 0.6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawProp(ctx, enemy, camera, timestamp = 0) {
  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;
  const r = enemy.radius;
  const pulse = 0.5 + 0.5 * Math.sin(timestamp * 2.5);

  ctx.save();
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 6 + pulse * 3;

  ctx.fillStyle = '#6d4c41';
  ctx.beginPath();
  ctx.ellipse(sx, sy + r * 0.15, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy.hitFlashTimer > 0 ? '#ffffff' : enemy.color;
  ctx.beginPath();
  ctx.ellipse(sx, sy, r * 0.9, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#4e342e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - r * 0.5, sy - r * 0.15);
  ctx.lineTo(sx + r * 0.5, sy - r * 0.15);
  ctx.moveTo(sx - r * 0.55, sy + r * 0.35);
  ctx.lineTo(sx + r * 0.55, sy + r * 0.35);
  ctx.stroke();

  ctx.restore();
}
