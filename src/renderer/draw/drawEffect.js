/**
 * drawEffect — 시각 이펙트 렌더링
 *
 * effectType:
 *   'damageText'  — 데미지 숫자 부유
 *   'levelFlash'  — 레벨업 전체 화면 플래시
 *   'burst'       — 파티클 링 + 중심 플래시
 *
 * FIX(bug): levelFlash — setTransform(1,0,0,1,0,0) 으로 카메라 transform 초기화해
 *   전체 화면을 정확히 커버
 */
export function drawEffect(ctx, effect, camera, dpr) {
  if (!effect.isAlive) return;
  const progress = Math.min(1, effect.lifetime / effect.maxLifetime);
  const _dpr = dpr || window.devicePixelRatio || 1;

  ctx.save();

  if (effect.effectType === 'damageText') {
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
    const alpha = progress < 0.3
      ? progress / 0.3
      : 1 - (progress - 0.3) / 0.7;

    ctx.globalAlpha = Math.max(0, alpha) * 0.35;
    ctx.fillStyle   = effect.color || '#ffd54f';

    const w = ctx.canvas.width  / _dpr;
    const h = ctx.canvas.height / _dpr;
    // FIX(bug): 카메라 transform 초기화 후 전체 화면 커버
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, w, h);

  } else {
    // burst
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
      ctx.shadowBlur  = 0;
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
      const r      = maxR * (0.6 + (i % 3) * 0.15);
      ctx.beginPath();
      ctx.arc(sx + Math.cos(jAngle) * r, sy + Math.sin(jAngle) * r, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** drawPickup — XP 픽업 렌더링 */
export function drawPickup(ctx, pickup, camera) {
  if (!pickup.isAlive || pickup.pendingDestroy) return;
  const sx = pickup.x - camera.x;
  const sy = pickup.y - camera.y;

  ctx.save();
  ctx.shadowColor = pickup.color;
  ctx.shadowBlur  = pickup.magnetized ? 10 : 4;
  ctx.fillStyle   = pickup.color;
  ctx.beginPath();
  ctx.arc(sx, sy, pickup.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
