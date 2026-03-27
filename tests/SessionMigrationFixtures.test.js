import assert from 'node:assert/strict';

console.log('\n[SessionMigrationFixtures]');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

const { _migrate } = await import('../src/state/createSessionState.js');

await test('v0 fixture는 최신 best/meta/options 구조로 마이그레이션된다', () => {
  const migrated = _migrate({
    version: 0,
    best: {
      killCount: 12,
      elapsedTime: 34,
      playerLevel: 5,
    },
    options: {
      soundOn: false,
      showFps: true,
    },
  });

  assert.equal(migrated._version, 8);
  assert.equal(migrated.best.kills, 12);
  assert.equal(migrated.best.survivalTime, 34);
  assert.equal(migrated.best.level, 5);
  assert.equal(migrated.options.soundEnabled, false);
  assert.equal(migrated.options.showFps, true);
});

await test('미래 버전 fixture는 안전하게 기본 세션으로 폴백한다', () => {
  const migrated = _migrate({
    _version: 999,
    best: { kills: 99, survivalTime: 99, level: 99 },
  });

  assert.equal(migrated._version, 8);
  assert.equal(migrated.best.kills, 0);
  assert.equal(migrated.meta.selectedStartWeaponId, 'magic_bolt');
  assert.equal(migrated.meta.selectedStageId, 'ash_plains');
});

await test('손상된 시작 무기 선택값은 해금된 기본 무기로 보정된다', () => {
  const migrated = _migrate({
    _version: 6,
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'not_a_real_weapon',
    },
    options: null,
  });

  assert.equal(migrated._version, 8);
  assert.equal(migrated.meta.selectedStartWeaponId, 'magic_bolt');
  assert.equal(migrated.options.soundEnabled, true);
  assert.equal(migrated.options.musicEnabled, true);
});

await test('v6 fixture는 런 설정 확장 필드와 activeRun 슬롯을 최신 구조로 보완한다', () => {
  const migrated = _migrate({
    _version: 6,
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'magic_bolt',
    },
    options: {},
  });

  assert.equal(migrated._version, 8);
  assert.equal(migrated.meta.selectedStartAccessoryId, null);
  assert.equal(migrated.meta.selectedArchetypeId, 'vanguard');
  assert.equal(migrated.meta.selectedRiskRelicId, null);
  assert.equal(migrated.meta.selectedStageId, 'ash_plains');
  assert.equal(migrated.meta.selectedSeedMode, 'none');
  assert.equal(migrated.meta.selectedSeedText, '');
  assert.deepEqual(migrated.meta.recentRuns, []);
  assert.equal(migrated.activeRun, null);
});

console.log(`\nSessionMigrationFixtures: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
