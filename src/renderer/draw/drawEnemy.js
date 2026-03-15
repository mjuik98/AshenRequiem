/**
 * drawEnemy — 적 렌더링
 *
 * 일반 적  : 피격 플래시 + 상태이상 링 + HP 바
 * 엘리트   : 주황 펄스 링 + 더 큰 HP 바
 * 보스     : 빨간 삼중 펄스 링 + windup 예고점 + 이름 레이블 + DOM 전용 HP 바
 *
 * FIX(perf): Date.now() 를 매 적마다 개별 호출하던 방식 제거.
 *   이전: drawEnemy 내부에서 Date.now() * 0.004 등을 매 호출마다 계산
 *   이후: RenderSystem 이 프레임당 1회만 계산한 timestamp(초) 를 인수로 전달
 *   적이 100마리이면 이전엔 100회 호출 → 이후엔 1회로 감소
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} enemy
 * @param {{ x: number, y: number }} camera
 * @param {number} timestamp  — RenderSystem 이 계산한 현재 시각 (초, performance.now()/1000)
 */
export function drawEnemy(ctx, enemy, camera, timestamp) {
  if (!enemy.isAlive) return;
  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;
  const r  = enemy.radius;

  ctx.save();

  // ─── 보스 장식 링 (삼중 펄스) ──────────────────────────────
  if (enemy.isBoss) {
    // FIX: Date.now() * 0.004 → timestamp * 4 (동일 결과, 외부 계산)
    const t = timestamp * 4;
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
    // FIX: Date.now() * 0.006 → timestamp * 6
    const pulse = 0.5 + 0.5 * Math.sin(timestamp * 6);
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
    const barY = sy - r - (enemy.isElite ? 10 : 8);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = enemy.isElite ? '#ff9800' : '#ef5350';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
