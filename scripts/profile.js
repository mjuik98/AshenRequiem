#!/usr/bin/env node
/**
 * scripts/profile.js — 파이프라인 시스템별 성능 프로파일링
 *
 * CHANGE(P2-③): PipelineProfiler를 npm run profile로 연결
 *   Before: PipelineProfiler 구현은 있으나 실행 경로 없음
 *   After:  헤드리스 시뮬레이션 N프레임 실행 후 시스템별 ms 출력
 *           임계값 초과 시 경고 표시
 *
 * 사용:
 *   npm run profile            — 기본 300프레임 측정
 *   npm run profile -- 600     — 600프레임 측정
 *   npm run profile -- 300 40  — 300프레임, 임계값 40%
 *
 * package.json에 추가:
 *   "scripts": {
 *     "profile": "node scripts/profile.js"
 *   }
 */

// ─── 설정 ─────────────────────────────────────────────────────────────

const FRAME_COUNT     = parseInt(process.argv[2] ?? '300', 10);
const WARN_THRESHOLD  = parseFloat(process.argv[3] ?? '35') / 100; // 기본 35%
const TARGET_FPS      = 60;
const SIM_DT          = 1 / TARGET_FPS;

// ─── 경량 헤드리스 시뮬레이터 ────────────────────────────────────────
// 브라우저 DOM, Canvas 없이 순수 로직 시스템만 측정.
// Renderer/UI 시스템은 헤드리스 환경에서 제외됨.

const SYSTEMS_TO_PROFILE = [
  'SpawnSystem',
  'PlayerMovementSystem',
  'EnemyMovementSystem',
  'EliteBehaviorSystem',
  'WeaponSystem',
  'ProjectileSystem',
  'CollisionSystem',
  'StatusEffectSystem',
  'DamageSystem',
  'BossPhaseSystem',
  'DeathSystem',
  'ExperienceSystem',
  'LevelSystem',
  'FlushSystem',
];

// 시스템 import (없으면 스킵)
async function loadSystems() {
  const loaded = [];
  for (const name of SYSTEMS_TO_PROFILE) {
    try {
      // 실제 경로 규칙에 맞게 탐색
      const candidates = [
        `../src/systems/combat/${name}.js`,
        `../src/systems/movement/${name}.js`,
        `../src/systems/progression/${name}.js`,
        `../src/systems/spawn/${name}.js`,
        `../src/systems/render/${name}.js`,
      ];
      let mod = null;
      for (const path of candidates) {
        try { mod = await import(path); break; } catch {}
      }
      if (mod) {
        const system = mod[name] ?? mod.default;
        if (system?.update) {
          loaded.push({ name, system });
        }
      }
    } catch {}
  }
  return loaded;
}

// ─── 최소 월드 상태 ───────────────────────────────────────────────────

function createMinimalWorld() {
  return {
    player: {
      id: 'player', x: 640, y: 360, radius: 16,
      hp: 100, maxHp: 100, moveSpeed: 200,
      magnetRadius: 60, lifesteal: 0, level: 1, xp: 0,
      isAlive: true, pendingDestroy: false,
      weapons: [{ id: 'w1', damage: 10, cooldown: 1, currentCooldown: 0, behaviorId: 'targetProjectile', range: 400, speed: 300, radius: 8, pierce: 1 }],
      statusEffects: [], upgradeCounts: {},
    },
    enemies:     Array.from({ length: 80 }, (_, i) => ({
      id: `e${i}`, enemyId: 'basic', x: Math.random()*1280, y: Math.random()*720,
      radius: 12, hp: 30, maxHp: 30, damage: 5, moveSpeed: 80,
      xpValue: 1, isAlive: true, pendingDestroy: false,
      isElite: false, isBoss: false, hitFlashTimer: 0, statusEffects: [],
      behaviorId: 'chase',
    })),
    projectiles: [],
    pickups:     [],
    effects:     [],
    spawnQueue:  [],
    killCount:   0,
    elapsedTime: 0,
    deltaTime:   SIM_DT,
    playMode:    'playing',
    camera:      { x: 0, y: 0, width: 1280, height: 720 },
    events: {
      hits: [], deaths: [], pickupCollected: [],
      levelUpRequested: [], statusApplied: [],
      bossPhaseChanged: [], spawnRequested: [],
    },
  };
}

// ─── 프로파일 실행 ────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Pipeline Profiler ===`);
  console.log(`프레임: ${FRAME_COUNT}  타겟 FPS: ${TARGET_FPS}  경고 임계값: ${(WARN_THRESHOLD*100).toFixed(0)}%\n`);

  const systems = await loadSystems();
  if (systems.length === 0) {
    console.warn('로드된 시스템이 없습니다. src/ 경로를 확인하세요.');
    process.exit(0);
  }

  console.log(`로드된 시스템 (${systems.length}개): ${systems.map(s => s.name).join(', ')}\n`);

  const world   = createMinimalWorld();
  const timings = Object.fromEntries(systems.map(s => [s.name, 0]));

  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    world.elapsedTime += SIM_DT;
    world.deltaTime    = SIM_DT;

    for (const { name, system } of systems) {
      const ctx = { world, data: {}, services: {}, input: {} };
      const t0  = performance.now();
      try { system.update(ctx); } catch {}
      timings[name] += performance.now() - t0;
    }

    // 이벤트 클리어 (프레임 간 리셋)
    for (const key of Object.keys(world.events)) {
      world.events[key].length = 0;
    }
    world.spawnQueue.length = 0;
  }

  // ─── 결과 출력 ──────────────────────────────────────────────────

  const totalMs     = Object.values(timings).reduce((a, b) => a + b, 0);
  const avgFrameMs  = totalMs / FRAME_COUNT;
  const budgetMs    = 1000 / TARGET_FPS;
  const utilization = (avgFrameMs / budgetMs * 100).toFixed(1);

  const rows = systems.map(({ name }) => {
    const totalSys = timings[name];
    const avgMs    = (totalSys / FRAME_COUNT).toFixed(3);
    const pct      = totalSys / totalMs;
    const bar      = '█'.repeat(Math.round(pct * 30)).padEnd(30);
    const warn     = pct > WARN_THRESHOLD ? ' ⚠ 임계값 초과' : '';
    return { name, avgMs, pct, bar, warn };
  }).sort((a, b) => b.pct - a.pct);

  console.log('시스템별 평균 소요 시간 (프레임당):');
  console.log('─'.repeat(72));

  for (const r of rows) {
    const pctStr = `${(r.pct * 100).toFixed(1)}%`.padStart(6);
    const msStr  = `${r.avgMs}ms`.padStart(9);
    console.log(`  ${r.name.padEnd(28)} ${pctStr} ${msStr}  ${r.bar}${r.warn}`);
  }

  console.log('─'.repeat(72));
  console.log(`  ${'TOTAL'.padEnd(28)} ${utilization.padStart(5)}% ${avgFrameMs.toFixed(3).padStart(8)}ms  (예산: ${budgetMs.toFixed(1)}ms/frame)`);

  if (avgFrameMs > budgetMs * 0.8) {
    console.warn(`\n⚠ 평균 프레임 처리 시간이 예산의 80%를 초과합니다 (${avgFrameMs.toFixed(2)}ms / ${budgetMs}ms)`);
  } else {
    console.log(`\n✓ 프레임 예산 여유: ${(budgetMs - avgFrameMs).toFixed(2)}ms`);
  }

  const warnings = rows.filter(r => r.warn);
  if (warnings.length > 0) {
    console.warn(`\n임계값(${(WARN_THRESHOLD*100).toFixed(0)}%) 초과 시스템:`);
    warnings.forEach(r => console.warn(`  - ${r.name}: ${(r.pct*100).toFixed(1)}%`));
  }
}

main().catch(e => {
  console.error('프로파일 실패:', e.message);
  process.exit(1);
});
