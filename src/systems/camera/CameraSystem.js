import { GameConfig } from '../../core/GameConfig.js';
export const CameraSystem = {
  update({ player, camera }) {
    if (!player) return;
    camera.x = player.x - GameConfig.canvasWidth  / 2;
    camera.y = player.y - GameConfig.canvasHeight / 2;
  },
};
