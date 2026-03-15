/**
 * drawEnemy — 적 렌더링
 *
 * 일반 적  : 피격 플래시 + 상태이상 링 + HP 바
 * 엘리트   : 주황 펄스 링 + 더 큰 HP 바
 * 보스     : 빨간 삼중 펄스 링 + 이름 레이블 + DOM 전용 HP 바
 *
 * PATCH:
 *   [refactor] windup 예고 연출 판정을 behaviorState.phase === 'windup' 에서
 *              enemy.chargeEffect 전용 플래그로 교체.
 *              hitFlashTimer 는 '피격 플래시' 원래 용도만 유지.
 *   [perf]    shadowBlur 를 필요한 경우에만 적용.
 *              일반 적 몸체는 shadowBlur 없이 fillStyle 만 사용.
 *              엘리트/보스 펄스 링, 피격 플래시, 충전 연출에만 glow 적용.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} enemy
 * @param {{ x: number, y: number }} camera
 * @param {number} timestamp  — RenderSystem 이 계산한 현재 시각 (초)
 */
export function drawEnemy(ctx, enemy, camera, timestamp) {
  if (!enemy.isAlive) return;
  const sx = enemy.x - camera.x;
  const sy = enemy.y - camera.y;
  const r  = enemy.radius;

  ctx.save();

  // ─── 보스 장식 링 (삼중 펄스) ──────────────────────────────
  if (enemy.isBoss) {
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
    // 피격 플래시 — shadowBlur 허용 (빈도 낮음)
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '#ffffff';
  } else {
    // PATCH(perf): 일반 적 몸체는 shadowBlur 0 — 매 프레임 비용 절감
    ctx.shadowBlur = 0;
    ctx.fillStyle  = enemy.color;
  }
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // ─── 돌진 충전 예고 (중심 흰 점) ───────────────────────────
  // PATCH(refactor): behaviorState.phase 직접 읽기 → chargeEffect 플래그 사용
  if (enemy.chargeEffect) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur  = 0;
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

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle   = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = enemy.isElite ? '#ff9800' : '#ef5350';
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
