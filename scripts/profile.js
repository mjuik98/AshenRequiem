#!/usr/bin/env node
/**
 * scripts/profile.js — 파이프라인 시스템별 성능 프로파일링
 *
 * 현재 파이프라인 구조에 맞춰 팩토리 시스템도 실제 인스턴스로 생성한다.
 * 기본 실행은 headless 최소 컨텍스트에서 이루어지며, 각 시스템의 상대 비용을 비교하는 용도다.
 */

import {
  PROFILE_SIM_DT,
  PROFILE_TARGET_FPS,
  PROFILE_WARN_THRESHOLD,
  buildProfileContext,
  loadProfileSystems,
} from './profileRuntime.js';

const FRAME_COUNT = parseInt(process.argv[2] ?? '300', 10);

async function runProfile() {
  console.log('\n=== Pipeline Profiler ===');
  console.log(
    `프레임: ${FRAME_COUNT}  |  FPS 목표: ${PROFILE_TARGET_FPS}  |  경고 임계값: ${(PROFILE_WARN_THRESHOLD * 100).toFixed(0)}%\n`,
  );

  const systems = await loadProfileSystems();
  console.log(`로드된 시스템: ${systems.length}개\n`);

  const totals = Object.fromEntries(systems.map(({ name }) => [name, 0]));
  const ctx = buildProfileContext();

  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    ctx.dt = PROFILE_SIM_DT;
    ctx.world.deltaTime = PROFILE_SIM_DT;
    ctx.world.elapsedTime += PROFILE_SIM_DT;

    for (const queue of Object.values(ctx.world.events)) {
      queue.length = 0;
    }
    ctx.world.spawnQueue.length = 0;

    for (const { name, system } of systems) {
      const startedAt = performance.now();
      try {
        system.update(ctx);
      } catch {
        // headless 측정에서는 일부 시스템이 실제 렌더/오디오 없이 동작하므로 예외는 무시한다.
      }
      totals[name] += performance.now() - startedAt;
    }
  }

  const totalAll = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const perFrame = totalAll / FRAME_COUNT;

  console.log(`${'시스템'.padEnd(28)} ${'합계(ms)'.padStart(10)} ${'프레임당'.padStart(10)} ${'비율'.padStart(8)}`);
  console.log('─'.repeat(60));

  const sorted = Object.entries(totals).sort((left, right) => right[1] - left[1]);
  for (const [name, ms] of sorted) {
    const ratio = totalAll > 0 ? ms / totalAll : 0;
    const pct = `${(ratio * 100).toFixed(1).padStart(7)}%`;
    const flag = ratio > PROFILE_WARN_THRESHOLD ? ' ⚠' : '';
    console.log(
      `${name.padEnd(28)} ${ms.toFixed(2).padStart(10)} ${(ms / FRAME_COUNT).toFixed(3).padStart(10)} ${pct}${flag}`,
    );
  }

  console.log('─'.repeat(60));
  console.log(`${'합계'.padEnd(28)} ${totalAll.toFixed(2).padStart(10)} ${perFrame.toFixed(3).padStart(10)}`);
  console.log(`\n목표 프레임 예산: ${(1000 / PROFILE_TARGET_FPS).toFixed(2)}ms / 프레임`);

  if (perFrame > 1000 / PROFILE_TARGET_FPS) {
    console.warn(
      `\n⚠  평균 프레임 소요 시간(${perFrame.toFixed(3)}ms)이 목표(${(1000 / PROFILE_TARGET_FPS).toFixed(2)}ms)를 초과합니다!`,
    );
  } else {
    console.log('\n✓  프레임 예산 내에서 실행 중입니다.');
  }
}

runProfile().catch((error) => {
  console.error('프로파일링 중 오류:', error);
  process.exit(1);
});
