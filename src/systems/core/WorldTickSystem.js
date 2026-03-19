import { GameConfig } from '../../core/GameConfig.js';

/**
 * src/systems/core/WorldTickSystem.js — 프레임 시작 시 world 메타 동기화
 * 파이프라인 priority 0 (최우선 실행).
 *
 * 책임:
 *   1. world.deltaTime / elapsedTime 갱신
 *   2. camera.width / camera.height 갱신 (SSOT — CameraSystem은 이 값을 읽기만 함)
 *
 * CHANGE(P1-C): camera.width/height의 단일 진실의 원천
 *   CameraSystem에서 중복으로 설정하던 camera.width/height를
 *   이 시스템(priority 0)에서만 설정하도록 일원화.
 *
 * CHANGE(P2-B): dt는 pipelineCtx에 명시적으로 초기화된 필드
 *   PipelineBuilder.build()에서 ctx = { ..., dt: 0, dpr: 1 }로 초기화.
 *   PlayScene이 매 프레임 ctx.dt = actualDt로 덮어쓴 뒤 pipeline.run(ctx) 호출.
 *   이 시스템은 ctx.dt를 읽어 world.deltaTime에 반영한다.
 */
export const WorldTickSystem = {
  update({ world, dt }) {
    world.deltaTime    = dt ?? 0;
    world.elapsedTime += world.deltaTime;

    // camera 메타 — SSOT (P1-C)
    // CameraSystem은 이 값을 읽어 camera.x/y를 계산하기만 함
    world.camera.width  = GameConfig.canvasWidth;
    world.camera.height = GameConfig.canvasHeight;
  },
};
