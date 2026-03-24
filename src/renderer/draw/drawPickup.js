/**
 * src/renderer/draw/drawPickup.js
 *
 * FIX(3): Date.now() → timestamp 파라미터로 교체
 *   Before: Date.now() 기반 펄스 → 게임 일시정지 중에도 상자가 계속 반짝임
 *   After:  CanvasRenderer에서 넘기는 timestamp(performance.now() / 1000)를
 *           drawPickup(ctx, pickup, camera, timestamp) 4번째 인수로 받아 사용.
 *           timestamp가 없으면 0으로 fallback (하위 호환).
 *
 * CHANGE: 상자는 자석에 반응하지 않음을 강조하는 시각 힌트 추가
 *   - 상자 하단에 "TOUCH" 라벨 표시 (작게)
 */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {object}                  pickup
 * @param {{ x: number, y: number }} camera
 * @param {number}                  [timestamp=0]  performance.now() / 1000
 */
export function drawPickup(ctx, pickup, camera, timestamp = 0) {
  if (pickup.pickupType === 'chest') {
    _drawChest(ctx, pickup, camera, timestamp);
    return;
  }

  if (pickup.pickupType !== 'xp') {
    _drawSpecialPickup(ctx, pickup, camera);
    return;
  }

  // ── 기존 XP 젬 렌더링 ───────────────────────────────────────────────
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;
  const r  = pickup.radius || 6;
  const glowColor = pickup.color || '#66bb6a';

  ctx.save();

  if (pickup.vacuumPulled) {
    const pulse = 0.5 + 0.5 * Math.sin(timestamp * 18);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.42 + pulse * 0.18;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(sx, sy, r * (1.45 + pulse * 0.2), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.translate(sx, sy);
    ctx.rotate(timestamp * 10);
    ctx.scale(0.82, 1.18);
    ctx.shadowColor = '#b9f6ca';
    ctx.shadowBlur = 16;
    ctx.fillStyle = glowColor;
    _drawXpDiamond(ctx, 0, 0, r);
    ctx.restore();
    ctx.save();
  }

  ctx.shadowColor = glowColor;
  ctx.shadowBlur  = pickup.vacuumPulled ? 12 : 8;
  ctx.fillStyle   = glowColor;

  _drawXpDiamond(ctx, sx, sy, r);

  ctx.fillStyle   = '#ffffff';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(sx - r * 0.2, sy - r * 0.5);
  ctx.lineTo(sx + r * 0.2, sy - r * 0.5);
  ctx.lineTo(sx + r * 0.2, sy - r * 0.2);
  ctx.lineTo(sx - r * 0.2, sy - r * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function _drawXpDiamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

function _drawSpecialPickup(ctx, pickup, camera) {
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;
  const r = pickup.radius || 9;
  const color = pickup.color || '#ffd54f';

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fffde7';
  ctx.lineWidth = 2;

  switch (pickup.pickupType) {
    case 'gold':
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'heal':
      ctx.fillRect(sx - r * 0.35, sy - r, r * 0.7, r * 2);
      ctx.fillRect(sx - r, sy - r * 0.35, r * 2, r * 0.7);
      break;
    case 'ward':
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 1.1);
      ctx.lineTo(sx + r * 0.9, sy - r * 0.2);
      ctx.lineTo(sx + r * 0.55, sy + r);
      ctx.lineTo(sx - r * 0.55, sy + r);
      ctx.lineTo(sx - r * 0.9, sy - r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'vacuum':
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

/**
 * 보물 상자 렌더링
 *
 * FIX(3): timestamp 기반 펄스 (일시정지 시 정지됨)
 */
function _drawChest(ctx, pickup, camera, timestamp) {
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;
  const r  = (pickup.radius || 18) * 0.9;

  const w   = r * 2.2;
  const h   = r * 1.6;
  const lx  = sx - w / 2;
  const ty  = sy - h / 2;
  const bh  = h * 0.55;
  const ldh = h * 0.45;
  const by  = ty + ldh;

  // FIX(3): timestamp 기반 펄스 (period 2s)
  const pulse = 0.5 + 0.5 * Math.sin(timestamp * Math.PI);

  ctx.save();

  // ── 황금 글로우 ──────────────────────────────────────────────────────
  ctx.shadowColor = `rgba(255, 215, 0, ${0.5 + pulse * 0.4})`;
  ctx.shadowBlur  = 18 + pulse * 10;

  // ── 뚜껑 ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#5d4037';
  _roundRect(ctx, lx, ty, w, ldh, 3);
  ctx.fill();

  // ── 본체 ─────────────────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.fillStyle  = '#6d4c41';
  _roundRect(ctx, lx, by, w, bh, 3);
  ctx.fill();

  // ── 금색 테두리 ───────────────────────────────────────────────────────
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth   = 2;
  ctx.shadowColor = '#ffd54f';
  ctx.shadowBlur  = 6;
  _roundRect(ctx, lx, ty, w, h, 3);
  ctx.stroke();

  // ── 뚜껑 구분선 ───────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(lx, by);
  ctx.lineTo(lx + w, by);
  ctx.stroke();

  // ── 잠금장치 ──────────────────────────────────────────────────────────
  ctx.shadowBlur  = 0;
  const lockX     = sx;
  const lockCY    = by;

  ctx.lineWidth   = 2.5;
  ctx.strokeStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(lockX, lockCY - r * 0.2, r * 0.22, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = '#ffd54f';
  const lkW = r * 0.42;
  const lkH = r * 0.3;
  _roundRect(ctx, lockX - lkW / 2, lockCY - r * 0.12, lkW, lkH, 2);
  ctx.fill();

  // ── 반짝임 파티클 ─────────────────────────────────────────────────────
  if (pulse > 0.7) {
    const sparkAlpha = (pulse - 0.7) / 0.3;
    ctx.globalAlpha  = sparkAlpha * 0.85;
    ctx.fillStyle    = '#fff9c4';
    ctx.shadowColor  = '#ffd54f';
    ctx.shadowBlur   = 8;

    const sparks = [
      { dx: -w * 0.6, dy: -h * 0.55 },
      { dx:  w * 0.6, dy: -h * 0.55 },
      { dx:  0,       dy: -h * 0.85 },
    ];
    for (const sp of sparks) {
      ctx.beginPath();
      ctx.arc(sx + sp.dx, sy + sp.dy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── "TOUCH" 힌트 라벨 ─────────────────────────────────────────────────
  // 상자는 자석에 반응하지 않으므로 직접 밟아야 함을 알려주는 시각 단서
  const labelAlpha = 0.45 + pulse * 0.35;
  ctx.globalAlpha  = labelAlpha;
  ctx.shadowBlur   = 0;
  ctx.fillStyle    = '#ffd54f';
  ctx.font         = `bold ${Math.round(r * 0.55)}px sans-serif`;
  ctx.textAlign    = 'center';
  ctx.fillText('TOUCH', sx, sy + h / 2 + r * 0.9);

  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
