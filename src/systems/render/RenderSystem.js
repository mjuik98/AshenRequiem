import { drawPlayer }            from '../../renderer/draw/drawPlayer.js';
import { drawEnemy }             from '../../renderer/draw/drawEnemy.js';
import { drawProjectile }        from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * FIX(perf): timestamp 를 프레임당 1회만 계산하여 drawEnemy 에 전달.
 *   이전: drawEnemy 내부에서 Date.now() 를 적마다 호출 (100마리 = 100회)
 *   이후: performance.now() / 1000 을 여기서 1회 계산 후 인수로 전달
 */
export const RenderSystem = {
  update({ world, camera, renderer }) {
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground(camera);

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
  },
};
