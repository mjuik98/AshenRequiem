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
  getProfilePresetIds,
  loadProfileSystems,
} from './profileRuntime.js';

const argv = process.argv.slice(2);
const JSON_OUTPUT = argv.includes('--json');
const presetIndex = argv.indexOf('--preset');
const PROFILE_PRESET = presetIndex !== -1 ? argv[presetIndex + 1] : 'baseline';
const frameArg = argv.find((value) => /^\d+$/.test(value));
const FRAME_COUNT = parseInt(frameArg ?? '300', 10);

if (!getProfilePresetIds().includes(PROFILE_PRESET)) {
  console.error(`알 수 없는 profile preset: ${PROFILE_PRESET}`);
  process.exit(1);
}

function buildProfileSummary({ systems, totals, totalAll, perFrame, budget }) {
  const sorted = Object.entries(totals).sort((left, right) => right[1] - left[1]);
  const withinBudget = budget?.maxPerFrameMs != null
    ? perFrame <= budget.maxPerFrameMs
    : true;
  return {
    preset: PROFILE_PRESET,
    budget,
    withinBudget,
    frameCount: FRAME_COUNT,
    targetFps: PROFILE_TARGET_FPS,
    warnThreshold: PROFILE_WARN_THRESHOLD,
    systemCount: systems.length,
    totalMs: totalAll,
    perFrameMs: perFrame,
    systems: sorted.map(([name, ms]) => {
      const ratio = totalAll > 0 ? ms / totalAll : 0;
      return {
        name,
        totalMs: ms,
        perFrameMs: ms / FRAME_COUNT,
        ratio,
        overThreshold: ratio > PROFILE_WARN_THRESHOLD,
      };
    }),
  };
}

async function runProfile() {
  const systems = await loadProfileSystems();
  const totals = Object.fromEntries(systems.map(({ name }) => [name, 0]));
  const ctx = buildProfileContext(PROFILE_PRESET);

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
  const summary = buildProfileSummary({
    systems,
    totals,
    totalAll,
    perFrame,
    budget: ctx.budget,
  });

  if (JSON_OUTPUT) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }

  console.log('\n=== Pipeline Profiler ===');
  console.log(
    `프레임: ${FRAME_COUNT}  |  프리셋: ${PROFILE_PRESET}  |  FPS 목표: ${PROFILE_TARGET_FPS}  |  경고 임계값: ${(PROFILE_WARN_THRESHOLD * 100).toFixed(0)}%\n`,
  );
  console.log(`로드된 시스템: ${systems.length}개\n`);
  if (summary.budget?.maxPerFrameMs != null) {
    console.log(`프리셋 예산: ${summary.budget.maxPerFrameMs.toFixed(2)}ms / 프레임\n`);
  }

  console.log(`${'시스템'.padEnd(28)} ${'합계(ms)'.padStart(10)} ${'프레임당'.padStart(10)} ${'비율'.padStart(8)}`);
  console.log('─'.repeat(60));

  for (const system of summary.systems) {
    const pct = `${(system.ratio * 100).toFixed(1).padStart(7)}%`;
    const flag = system.overThreshold ? ' ⚠' : '';
    console.log(
      `${system.name.padEnd(28)} ${system.totalMs.toFixed(2).padStart(10)} ${system.perFrameMs.toFixed(3).padStart(10)} ${pct}${flag}`,
    );
  }

  console.log('─'.repeat(60));
  console.log(`${'합계'.padEnd(28)} ${totalAll.toFixed(2).padStart(10)} ${perFrame.toFixed(3).padStart(10)}`);
  console.log(`\n목표 프레임 예산: ${(1000 / PROFILE_TARGET_FPS).toFixed(2)}ms / 프레임`);

  if (!summary.withinBudget) {
    console.warn(`\n⚠  프리셋 예산(${summary.budget.maxPerFrameMs.toFixed(2)}ms)을 초과했습니다.`);
  } else if (perFrame > 1000 / PROFILE_TARGET_FPS) {
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
