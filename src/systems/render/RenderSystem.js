import { drawPlayer }            from '../../renderer/draw/drawPlayer.js';
import { drawEnemy }             from '../../renderer/draw/drawEnemy.js';
import { drawProjectile }        from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * PATCH(perf): lowQuality 모드 추가.
 *   투사체 수가 GLOW_THRESHOLD 초과 시 ctx.shadowBlur 를 전역으로 비활성화.
 *   RenderSystem.update() 시작 시 ctx.shadowBlur = 0 을 강제 설정하면
 *   draw* 함수들이 shadowBlur 를 설정해도 GPU 계산이 스킵됨.
 *   → 후반 대규모 전투에서 FPS 안정화.
 *
 * FIX(balance): GLOW_THRESHOLD 30 → 50.
 *   orbit(lightning_ring) 3개 + targetProjectile 연사로도 30 을 쉽게 초과해
 *   초반부터 glow 가 꺼지는 문제 수정. 50 이면 중반 이후에만 비활성화.
 *
 * FIX(bug): dpr 파라미터를 drawEffect 에 전달.
 *   drawEffect 내 levelFlash 가 화면 전체를 fill 할 때 dpr 로 올바른 크기를 계산.
 *   이전: dpr 없이 호출 → window.devicePixelRatio 폴백으로 동작했지만 명시적 전달이 안전.
 */

/** 투사체 수 기준: 초과 시 glow 비활성화 — FIX(balance): 30 → 50 */
const GLOW_THRESHOLD = 50;

export const RenderSystem = {
  update({ world, camera, renderer, dpr }) {
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground(camera);

    // PATCH(perf): 투사체 다수 시 shadowBlur 전역 비활성화
    const lowQuality = world.projectiles.length > GLOW_THRESHOLD;
    if (lowQuality) {
      ctx.shadowBlur = 0;
    }

    // FIX: 프레임당 1회만 계산
    const timestamp = performance.now() / 1000;

    for (let i = 0; i < world.pickups.length; i++) {
      drawPickup(ctx, world.pickups[i], camera);
    }

    // 월드 이펙트 (damageText 제외) — FIX(bug): dpr 전달
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType !== 'damageText') {
        drawEffect(ctx, world.effects[i], camera, dpr);
      }
    }

    for (let i = 0; i < world.enemies.length; i++) {
      // FIX: timestamp 전달
      drawEnemy(ctx, world.enemies[i], camera, timestamp);
    }

    for (let i = 0; i < world.projectiles.length; i++) {
      drawProjectile(ctx, world.projectiles[i], camera);
    }

    if (world.player && world.player.isAlive) {
      drawPlayer(ctx, world.player, camera);
    }

    // 데미지 텍스트 (최상단 레이어) — FIX(bug): dpr 전달
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType === 'damageText') {
        drawEffect(ctx, world.effects[i], camera, dpr);
      }
    }

    // lowQuality 해제 — 다음 프레임을 위해 초기화
    if (lowQuality) {
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    }
  },
};
