import { GameConfig } from '../../core/GameConfig.js';

/**
 * CameraSystem — 플레이어 따라가는 카메라
 *
 * camera = { x, y } — 월드 좌표에서 화면 좌상단 좌표
 */
export const CameraSystem = {
  update({ player, camera }) {
    if (!player) return;

    camera.x = player.x - GameConfig.canvasWidth / 2;
    camera.y = player.y - GameConfig.canvasHeight / 2;
  },
};
