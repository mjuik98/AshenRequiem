import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

const { test, summary } = createRunner('ProfileSource');

const playScenePath = new URL('../src/scenes/PlayScene.js', import.meta.url);
const playSceneSource = readFileSync(playScenePath, 'utf8');
const profileScriptPath = new URL('../scripts/profile.js', import.meta.url);
const profileScriptSource = readFileSync(profileScriptPath, 'utf8');

console.log('\n[ProfileSource]');

test('profile 스크립트는 팩토리 시스템과 올바른 보스 경로를 사용한다', () => {
  assert.equal(
    profileScriptSource.includes('createSpawnSystem'),
    true,
    'profile 스크립트가 SpawnSystem 팩토리를 사용하지 않음',
  );
  assert.equal(
    profileScriptSource.includes('createEnemyMovementSystem'),
    true,
    'profile 스크립트가 EnemyMovementSystem 팩토리를 사용하지 않음',
  );
  assert.equal(
    profileScriptSource.includes('createCollisionSystem'),
    true,
    'profile 스크립트가 CollisionSystem 팩토리를 사용하지 않음',
  );
  assert.equal(
    profileScriptSource.includes("../src/systems/combat/BossPhaseSystem.js"),
    true,
    'profile 스크립트가 BossPhaseSystem의 현재 경로를 사용하지 않음',
  );
  assert.equal(
    profileScriptSource.includes("../src/systems/spawn/BossPhaseSystem.js"),
    false,
    'profile 스크립트가 제거된 구버전 BossPhaseSystem 경로를 참조함',
  );
});

test('PlayScene은 파이프라인 프로파일러를 상시 활성화하지 않는다', () => {
  assert.equal(
    playSceneSource.includes('profilingEnabled: true'),
    false,
    'PlayScene이 프로파일러를 항상 활성화하고 있음',
  );
});

summary();
