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
 */

/** 투사체 수 기준: 초과 시 glow 비활성화 */
const GLOW_THRESHOLD = 30;

export const RenderSystem = {
  update({ world, camera, renderer }) {
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
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType !== 'damageText') {
        drawEffect(ctx, world.effects[i], camera);
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
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType === 'damageText') {
        drawEffect(ctx, world.effects[i], camera);
      }
    }

    // lowQuality 해제 — 다음 프레임을 위해 초기화
    if (lowQuality) {
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    }
  },
};
