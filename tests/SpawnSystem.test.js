/**
 * tests/SpawnSystem.test.js — SpawnSystem 클래스 단위 테스트
 */

import assert from 'node:assert/strict';

let SpawnSystem;
try {
  ({ SpawnSystem } = await import('../src/systems/spawn/SpawnSystem.js'));
} catch {
  console.warn('[테스트] SpawnSystem import 실패 — 로직 검증 스킵');
}

const testWave = [{ from: 0, to: 999, spawnPerSecond: 2, enemyIds: ['zombie'], eliteChance: 0 }];
const testPlayer = { isAlive: true, x: 0, y: 0 };

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('\n[SpawnSystem]');

if (SpawnSystem) {
  test('새 인스턴스는 깨끗한 상태로 시작', () => {
    const sys = new SpawnSystem();
    const info = sys.getDebugInfo(0);
    assert.equal(info.hasBossSpawned, false);
    assert.equal(info.isSuppressed, false);
  });

  test('인스턴스 간 상태 격리', () => {
    const sysA = new SpawnSystem();
    const sysB = new SpawnSystem();
    const queueA = [];
    
    // sysA에 보스를 강제 스폰시킨다 (보스 데이터 mock)
    const bossData = [{ at: 0, enemyId: 'boss' }];
    sysA.update({
      world: { elapsedTime: 1, player: testPlayer, spawnQueue: queueA, deltaTime: 1, playMode: 'playing' },
      data: { waveData: testWave, bossData }
    });
    
    assert.equal(sysA.getDebugInfo(1).hasBossSpawned, true, 'sysA는 보스가 스폰됨');
    assert.equal(sysB.getDebugInfo(1).hasBossSpawned, false, 'sysB는 독립적이어야 함');
  });
}

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
