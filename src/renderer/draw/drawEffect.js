/**
 * drawEffect — 시각 이펙트 렌더링
 *
 * effectType:
 *   'damageText'  — 데미지 숫자 부유
 *   'levelFlash'  — 레벨업 전체 화면 플래시
 *   'burst'       — 파티클 링 + 중심 플래시 (기본)
 *
 * FIX(bug): levelFlash 이중 오프셋 수정.
 *   이후: ctx.setTransform(1,0,0,1,0,0) 으로 카메라 transform 초기화 →
 *         fillRect(0, 0, w, h) 로 정확히 전체 화면 커버.
 *
 * FIX(bug): burst 파티클 jAngle 삼항 연산자 완성.
 */
export function drawEffect(ctx, effect, camera, dpr) {
  if (!effect.isAlive) return;
  const progress = Math.min(1, effect.lifetime / effect.maxLifetime); // 0 → 1 (clamp)

  // dpr 폴백: 파라미터가 없으면 window 에서 읽기 (하위 호환)
  const _dpr = dpr || window.devicePixelRatio || 1;

  ctx.save();

  if (effect.effectType === 'damageText') {
    // ─── 데미지 텍스트 ──────────────────────────────────────
    const sx   = effect.x - camera.x;
    const sy   = effect.y - camera.y;
    const rise = progress * 28;

    ctx.globalAlpha = Math.max(0, 1 - progress * 1.2);
    ctx.shadowColor = effect.color;
    ctx.shadowBlur  = 6;
    ctx.fillStyle   = effect.color;
    ctx.font        = `bold ${13 + Math.round(progress * 3)}px sans-serif`;
    ctx.textAlign   = 'center';
    ctx.fillText(effect.text, sx, sy - rise);

  } else if (effect.effectType === 'levelFlash') {
    // ─── 레벨업 전체 화면 플래시 ────────────────────────────
    const alpha = progress < 0.3
      ? progress / 0.3
      : 1 - (progress - 0.3) / 0.7;

    ctx.globalAlpha = Math.max(0, alpha) * 0.35;
    ctx.fillStyle   = effect.color || '#ffd54f';

    const w = ctx.canvas.width  / _dpr;
    const h = ctx.canvas.height / _dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, w, h);

  } else {
    // ─── burst 파티클 링 ────────────────────────────────────
    const sx = effect.x - camera.x;
    const sy = effect.y - camera.y;

    const PARTICLE_COUNT = 8;
    const maxR = effect.radius * (1 + progress * 1.8);
    const fade = Math.max(0, 1 - progress);

    // 중심 플래시
    if (progress < 0.4) {
      const flashAlpha = (1 - progress / 0.4) * 0.55;
      ctx.globalAlpha = flashAlpha;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur  = 20;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, effect.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 파티클 링
    ctx.globalAlpha = fade * 0.75;
    ctx.fillStyle   = effect.color;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur  = 6;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle  = (i / PARTICLE_COUNT) * Math.PI * 2;
      const spread = progress * 0.6;
      const jAngle = angle + spread * (i % 2 === 0 ? 1 : -1);

      const r  = maxR * (0.7 + 0.3 * ((i % 3) / 3));
      const px = sx + Math.cos(jAngle) * r;
      const py = sy + Math.sin(jAngle) * r;
      const pr = Math.max(1, effect.radius * 0.22 * (1 - progress * 0.5));

      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** 픽업 렌더링 (Manually Merged) */
export function drawPickup(ctx, pickup, camera) {
  if (!pickup.isAlive) return;
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;

  ctx.save();
  ctx.shadowColor = pickup.color;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = pickup.color;

  const r = pickup.radius;
  ctx.beginPath();
  ctx.moveTo(sx,     sy - r);
  ctx.lineTo(sx + r, sy);
  ctx.lineTo(sx,     sy + r);
  ctx.lineTo(sx - r, sy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
