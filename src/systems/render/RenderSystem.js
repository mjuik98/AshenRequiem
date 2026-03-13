import { drawPlayer } from '../../renderer/draw/drawPlayer.js';
import { drawEnemy } from '../../renderer/draw/drawEnemy.js';
import { drawProjectile } from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

/**
 * RenderSystem — 렌더링 위임
 *
 * 입력: world 상태, camera 상태, renderer
 * 쓰기: 게임 규칙 상태 수정 금지
 * 출력: renderer 호출
 */
export const RenderSystem = {
  update({ world, camera, renderer }) {
    const ctx = renderer.ctx;

    // 1) 클리어
    renderer.clear();

    // 2) 배경
    renderer.drawBackground(camera);

    // 3) 픽업
    for (let i = 0; i < world.pickups.length; i++) {
      drawPickup(ctx, world.pickups[i], camera);
    }

    // 4) 이펙트 (아래)
    for (let i = 0; i < world.effects.length; i++) {
      const e = world.effects[i];
      if (e.effectType !== 'damageText') {
        drawEffect(ctx, e, camera);
      }
    }

    // 5) 적
    for (let i = 0; i < world.enemies.length; i++) {
      drawEnemy(ctx, world.enemies[i], camera);
    }

    // 6) 투사체
    for (let i = 0; i < world.projectiles.length; i++) {
      drawProjectile(ctx, world.projectiles[i], camera);
    }

    // 7) 플레이어
    if (world.player && world.player.isAlive) {
      drawPlayer(ctx, world.player, camera);
    }

    // 8) 이펙트 (위 — 데미지 텍스트)
    for (let i = 0; i < world.effects.length; i++) {
      const e = world.effects[i];
      if (e.effectType === 'damageText') {
        drawEffect(ctx, e, camera);
      }
    }
  },
};
