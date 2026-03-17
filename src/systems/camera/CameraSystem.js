import { GameConfig } from '../../core/GameConfig.js';

/** CameraSystem — 플레이어 중심 카메라 */
export const CameraSystem = {
  update({ world: { player, camera } }) {
    if (!player) return;
    camera.x = player.x - GameConfig.canvasWidth  / 2;
    camera.y = player.y - GameConfig.canvasHeight / 2;
  },
};
