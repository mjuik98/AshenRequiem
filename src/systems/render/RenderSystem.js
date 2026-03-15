import { drawPlayer } from '../../renderer/draw/drawPlayer.js';
import { drawEnemy } from '../../renderer/draw/drawEnemy.js';
import { drawProjectile } from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

export const RenderSystem = {
  update({ world, camera, renderer }) {
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground(camera);
    for (let i = 0; i < world.pickups.length; i++) drawPickup(ctx, world.pickups[i], camera);
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType !== 'damageText') drawEffect(ctx, world.effects[i], camera);
    }
    for (let i = 0; i < world.enemies.length; i++) drawEnemy(ctx, world.enemies[i], camera);
    for (let i = 0; i < world.projectiles.length; i++) drawProjectile(ctx, world.projectiles[i], camera);
    if (world.player && world.player.isAlive) drawPlayer(ctx, world.player, camera);
    for (let i = 0; i < world.effects.length; i++) {
      if (world.effects[i].effectType === 'damageText') drawEffect(ctx, world.effects[i], camera);
    }
  },
};
