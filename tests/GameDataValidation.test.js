import assert from 'node:assert/strict';

console.log('\n[GameDataValidation]');

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

await test('shared validation module reports core duplicate/reference errors for runtime and CLI callers', async () => {
  const validation = await import('../src/data/gameDataValidation.js');

  const report = validation.validateCoreGameData({
    upgradeData: [
      { id: 'weapon_magic_bolt', weaponId: 'magic_bolt' },
      { id: 'weapon_missing', weaponId: 'missing_weapon' },
    ],
    weaponData: [
      { id: 'magic_bolt', maxLevel: 7, behaviorId: 'targetProjectile' },
      { id: 'magic_bolt', maxLevel: 0, behaviorId: 123 },
    ],
    waveData: [
      { from: 10, to: 5, spawnPerSecond: -1 },
    ],
    stageData: [
      {
        id: 'ash_plains',
        assets: {
          backgroundKey: 'missing_bg',
          bossCueKey: 'missing_boss',
        },
      },
    ],
    assetManifest: [
      { id: 'stage_bg_ash_plains', category: 'stage_background', kind: 'procedural_palette' },
      { id: 'stage_bg_ash_plains', category: 'stage_background', kind: 'procedural_palette' },
    ],
  });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((message) => message.includes('중복 id')), true);
  assert.equal(report.errors.some((message) => message.includes('존재하지 않는 weaponId')), true);
  assert.equal(report.errors.some((message) => message.includes('spawnPerSecond')), true);
  assert.equal(report.errors.some((message) => message.includes('backgroundKey')), true);
  assert.equal(report.errors.some((message) => message.includes('bossCueKey')), true);
});

console.log(`\nGameDataValidation: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
