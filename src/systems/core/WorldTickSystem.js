import { GameConfig } from '../../core/GameConfig.js';

/**
 * WorldTickSystem — 프레임 시작 시 world 타임/카메라 메타 동기화
 * 파이프라인 priority 0 (최우선 실행).
 */
export const WorldTickSystem = {
  update({ world, dt }) {
    world.deltaTime    = dt ?? 0;
    world.elapsedTime += world.deltaTime;
    world.camera.width  = GameConfig.canvasWidth;
    world.camera.height = GameConfig.canvasHeight;
  },
};
