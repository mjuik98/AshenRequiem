import { GameConfig } from '../../core/GameConfig.js';

/**
 * CameraSystem — 플레이어 중심 카메라
 *
 * REFACTOR: camera.width / height 관리 책임 이전
 */
export const CameraSystem = {
  update({ world: { player, camera } }) {
    if (!player) return;

    camera.width  = GameConfig.canvasWidth;
    camera.height = GameConfig.canvasHeight;

    camera.x = player.x - camera.width  / 2;
    camera.y = player.y - camera.height / 2;
  },
};
