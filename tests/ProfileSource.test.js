import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { shouldEnablePipelineProfiling } from '../src/scenes/play/playSceneRuntime.js';
import {
  PROFILE_TARGET_FPS,
  PROFILE_WARN_THRESHOLD,
  buildProfileContext,
  getProfileBudget,
  loadProfileSystems,
} from '../scripts/profileRuntime.js';
import { readProjectSource } from './helpers/sourceInspection.js';

const { test, summary } = createRunner('ProfileSource');

console.log('\n[ProfileSource]');

test('profile runtime은 팩토리 시스템을 실제 update 가능한 인스턴스로 로드한다', async () => {
  const systems = await loadProfileSystems();
  const names = systems.map(({ name }) => name);

  assert.equal(names.includes('SpawnSystem'), true);
  assert.equal(names.includes('EnemyMovementSystem'), true);
  assert.equal(names.includes('CollisionSystem'), true);
  assert.equal(names.includes('BossPhaseSystem'), true);
  assert.equal(systems.every(({ system }) => typeof system.update === 'function'), true);
});

test('profile runtime은 headless context 기본값을 제공하고 PlayScene profiler는 opt-in이다', () => {
  const ctx = buildProfileContext();
  const budget = getProfileBudget('baseline');

  assert.equal(PROFILE_TARGET_FPS, 60);
  assert.equal(PROFILE_WARN_THRESHOLD > 0, true);
  assert.equal(ctx.world.run.playMode, 'playing');
  assert.equal(ctx.preset, 'baseline');
  assert.equal(ctx.dt, 1 / PROFILE_TARGET_FPS);
  assert.equal(typeof budget?.maxPerFrameMs, 'number');
  assert.equal(shouldEnablePipelineProfiling({ location: { search: '' } }), false);
  assert.equal(shouldEnablePipelineProfiling({ __ASHEN_PROFILE_PIPELINE__: true }), true);
});

test('profile runtime은 createWorld shim 대신 domain play world 생성기를 직접 사용한다', () => {
  const source = readProjectSource('../scripts/profileRuntime.js');

  assert.equal(source.includes("from '../src/state/createWorld.js'"), false, 'profileRuntime이 createWorld shim을 직접 import하면 안 됨');
  assert.equal(source.includes("from '../src/domain/play/state/createPlayWorld.js'"), true, 'profileRuntime이 domain play world 생성기를 직접 import해야 함');
});

summary();
