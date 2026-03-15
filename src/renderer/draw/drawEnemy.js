/**
 * drawEnemy — 적 렌더링
 *
 * 일반 적  : 피격 플래시 + 상태이상 링 + HP 바
 * 엘리트   : 주황 펄스 링 + 더 큰 HP 바
 * 보스     : 빨간 삼중 펄스 링 + windup 예고점 + 이름 레이블 + DOM 전용 HP 바
 */
export function drawEnemy(ctx, enemy, camera) {
  if (!enemy.isAlive) return;
  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;
  const r  = enemy.radius;

  ctx.save();

  // ─── 보스 장식 링 (삼중 펄스) ──────────────────────────────
  if (enemy.isBoss) {
    const t = Date.now() * 0.004;
    for (let ring = 0; ring < 3; ring++) {
      const pulse = 0.5 + 0.5 * Math.sin(t + ring * 1.2);
      ctx.globalAlpha = (0.25 + pulse * 0.45) * (1 - ring * 0.18);
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth   = 2.5;
      ctx.shadowColor = '#f44336';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 8 + ring * 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  // ─── 엘리트 장식 링 ─────────────────────────────────────────
  if (enemy.isElite && !enemy.isBoss) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
    ctx.globalAlpha = 0.55 + pulse * 0.4;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth   = 3;
    ctx.shadowColor = '#ff9800';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(sx, sy, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
  }

  // ─── 몸체 ───────────────────────────────────────────────────
  if (enemy.hitFlashTimer > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '#ffffff';
  } else {
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur  = enemy.isBoss ? 20 : enemy.isElite ? 14 : 8;
    ctx.fillStyle   = enemy.color;
  }
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();

  // ─── windup 예고 (중심 흰 점) ──────────────────────────────
  const phase = enemy.behaviorState?.phase;
  if (phase === 'windup') {
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ─── 상태이상 링 ────────────────────────────────────────────
  if (enemy.statusEffects?.length > 0) {
    ctx.shadowBlur = 0;
    for (let i = 0; i < enemy.statusEffects.length; i++) {
      const eff = enemy.statusEffects[i];
      ctx.strokeStyle = eff.color;
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 3 + i * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ─── HP 바 (보스는 DOM의 BossHudView에서 처리) ──────────────
  if (enemy.hp < enemy.maxHp && !enemy.isBoss) {
    const pct  = Math.max(0, enemy.hp / enemy.maxHp);
    const barW = r * (enemy.isElite ? 2.8 : 2.4);
    const barH = enemy.isElite ? 5 : 4;
    const barX = sx - barW / 2;
    const barY = sy - r - (enemy.isElite ? 13 : 10);

    ctx.shadowBlur = 0;
    _roundRect(ctx, barX, barY, barW, barH, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fill();

    if (pct > 0) {
      ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';
      _roundRect(ctx, barX + 1, barY + 1, Math.max(2, (barW - 2) * pct), barH - 2, 1.5);
      ctx.fill();
    }
  }

  // ─── 보스 이름 레이블 ────────────────────────────────────────
  if (enemy.isBoss) {
    ctx.shadowBlur  = 8;
    ctx.shadowColor = '#f44336';
    ctx.fillStyle   = '#ff8a80';
    ctx.font        = 'bold 11px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(enemy.name || 'BOSS', sx, sy - r - 16);
  }

  ctx.restore();
}

/** 내부 헬퍼 — 모서리 둥근 사각형 path */
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x, y,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x,     y,     x + w, y, r);
  ctx.closePath();
}
