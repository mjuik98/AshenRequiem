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
 *   npm run profile              — 기본 300프레임
 *   npm run profile -- 600       — 600프레임
 *   npm run profile -- 300 40    — 300프레임, 경고 임계값 40%
 *
 * package.json scripts에 추가:
 *   "profile": "node scripts/profile.js"
 */

const FRAME_COUNT    = parseInt(process.argv[2] ?? '300', 10);
const WARN_THRESHOLD = parseFloat(process.argv[3] ?? '35') / 100;  // 기본 35%
const TARGET_FPS     = 60;
const SIM_DT         = 1 / TARGET_FPS;

// ─── 측정 대상 시스템 목록 ────────────────────────────────────────────
// 각 시스템의 실제 파일 경로 후보를 순서대로 탐색
const SYSTEM_CANDIDATES = {
  SpawnSystem:          ['../src/systems/spawn/SpawnSystem.js'],
  PlayerMovementSystem: ['../src/systems/movement/PlayerMovementSystem.js'],
  EnemyMovementSystem:  ['../src/systems/movement/EnemyMovementSystem.js'],
  EliteBehaviorSystem:  ['../src/systems/combat/EliteBehaviorSystem.js'],
  WeaponSystem:         ['../src/systems/combat/WeaponSystem.js'],
  ProjectileSystem:     ['../src/systems/combat/ProjectileSystem.js'],
  CollisionSystem:      ['../src/systems/combat/CollisionSystem.js'],
  StatusEffectSystem:   ['../src/systems/combat/StatusEffectSystem.js'],
  DamageSystem:         ['../src/systems/combat/DamageSystem.js'],
  BossPhaseSystem:      ['../src/systems/spawn/BossPhaseSystem.js'],
  DeathSystem:          ['../src/systems/combat/DeathSystem.js'],
  ExperienceSystem:     ['../src/systems/progression/ExperienceSystem.js'],
  LevelSystem:          ['../src/systems/progression/LevelSystem.js'],
  FlushSystem:          ['../src/systems/spawn/FlushSystem.js'],
};

// ─── 최소 헤드리스 월드 생성 ─────────────────────────────────────────
function makeHeadlessWorld() {
  return {
    player: {
      id: 'player', type: 'player',
      x: 0, y: 0, radius: 16,
      hp: 100, maxHp: 100, moveSpeed: 200,
      magnetRadius: 60, lifesteal: 0,
      level: 1, xp: 0,
      isAlive: true, pendingDestroy: false,
      weapons: [], upgradeCounts: {}, acquiredUpgrades: new Set(),
      activeSynergies: [], statusEffects: [],
      invincibleTimer: 0,
    },
    enemies:     [],
    projectiles: [],
    pickups:     [],
    effects:     [],
    spawnQueue:  [],
    events: {
      hits: [], deaths: [], pickupCollected: [],
      levelUpRequested: [], statusApplied: [],
      bossPhaseChanged: [], spawnRequested: [],
    },
    camera:      { x: 0, y: 0 },
    elapsedTime: 0,
    deltaTime:   SIM_DT,
    killCount:   0,
    playMode:    'playing',
  };
}

// ─── 시스템 로드 ──────────────────────────────────────────────────────
async function loadSystems() {
  const loaded = [];
  for (const [name, paths] of Object.entries(SYSTEM_CANDIDATES)) {
    let mod = null;
    for (const path of paths) {
      try { mod = await import(path); break; } catch { /* try next */ }
    }
    if (mod && mod[name]) {
      loaded.push({ name, system: mod[name] });
    } else {
      console.warn(`  ⚠ ${name}: import 실패 또는 export 없음 — 스킵`);
    }
  }
  return loaded;
}

// ─── 프로파일 실행 ────────────────────────────────────────────────────
async function runProfile() {
  console.log(`\n=== Pipeline Profiler ===`);
  console.log(`프레임: ${FRAME_COUNT}  |  FPS 목표: ${TARGET_FPS}  |  경고 임계값: ${(WARN_THRESHOLD * 100).toFixed(0)}%\n`);

  const systems = await loadSystems();
  if (systems.length === 0) {
    console.error('로드된 시스템이 없습니다. 경로를 확인하세요.');
    process.exit(1);
  }
  console.log(`로드된 시스템: ${systems.length}개\n`);

  // 시스템별 누적 시간 (ms)
  const totals = Object.fromEntries(systems.map(s => [s.name, 0]));
  const world  = makeHeadlessWorld();
  const ctx    = { world, input: {}, data: {}, services: {} };

  // ─── 메인 루프 ──────────────────────────────────────────────────
  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    world.deltaTime    = SIM_DT;
    world.elapsedTime += SIM_DT;
    world.events.hits.length              = 0;
    world.events.deaths.length            = 0;
    world.events.pickupCollected.length   = 0;
    world.events.levelUpRequested.length  = 0;
    world.events.statusApplied.length     = 0;
    world.events.bossPhaseChanged.length  = 0;
    world.events.spawnRequested.length    = 0;
    world.spawnQueue.length               = 0;

    for (const { name, system } of systems) {
      if (typeof system.update !== 'function') continue;
      const t0 = performance.now();
      try { system.update(ctx); } catch { /* 헤드리스 실행 오류 무시 */ }
      totals[name] += performance.now() - t0;
    }
  }

  // ─── 결과 출력 ──────────────────────────────────────────────────
  const totalAll  = Object.values(totals).reduce((a, b) => a + b, 0);
  const perFrame  = totalAll / FRAME_COUNT;

  console.log(`${'시스템'.padEnd(28)} ${'합계(ms)'.padStart(10)} ${'프레임당'.padStart(10)} ${'비율'.padStart(8)}`);
  console.log('─'.repeat(60));

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  for (const [name, ms] of sorted) {
    const ratio  = totalAll > 0 ? ms / totalAll : 0;
    const pct    = (ratio * 100).toFixed(1).padStart(7) + '%';
    const flag   = ratio > WARN_THRESHOLD ? ' ⚠' : '';
    console.log(
      `${name.padEnd(28)} ${ms.toFixed(2).padStart(10)} ${(ms / FRAME_COUNT).toFixed(3).padStart(10)} ${pct}${flag}`
    );
  }

  console.log('─'.repeat(60));
  console.log(
    `${'합계'.padEnd(28)} ${totalAll.toFixed(2).padStart(10)} ${perFrame.toFixed(3).padStart(10)}`
  );
  console.log(`\n목표 프레임 예산: ${(1000 / TARGET_FPS).toFixed(2)}ms / 프레임`);

  const overBudget = perFrame > (1000 / TARGET_FPS);
  if (overBudget) {
    console.warn(`\n⚠  평균 프레임 소요 시간(${perFrame.toFixed(3)}ms)이 목표(${(1000 / TARGET_FPS).toFixed(2)}ms)를 초과합니다!`);
  } else {
    console.log(`\n✓  프레임 예산 내에서 실행 중입니다.`);
  }
}

runProfile().catch(e => {
  console.error('프로파일링 중 오류:', e);
  process.exit(1);
});
