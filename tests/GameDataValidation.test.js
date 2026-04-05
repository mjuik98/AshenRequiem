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
      { id: 'stage_bg_ash_plains', category: 'stage_background', kind: 'procedural_palette', preloadGroup: 'stage', budgetTier: 'critical', estimatedBytes: 1200, qualityPolicy: 'scalable', sourceType: 'procedural' },
      { id: 'stage_bg_ash_plains', category: 'stage_background', kind: 'procedural_palette', preloadGroup: '', budgetTier: '', estimatedBytes: -1, qualityPolicy: '', sourceType: '' },
    ],
  });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((message) => message.includes('중복 id')), true);
  assert.equal(report.errors.some((message) => message.includes('존재하지 않는 weaponId')), true);
  assert.equal(report.errors.some((message) => message.includes('spawnPerSecond')), true);
  assert.equal(report.errors.some((message) => message.includes('backgroundKey')), true);
  assert.equal(report.errors.some((message) => message.includes('bossCueKey')), true);
  assert.equal(report.errors.some((message) => message.includes('preloadGroup')), true);
  assert.equal(report.errors.some((message) => message.includes('estimatedBytes')), true);
  assert.equal(report.errors.some((message) => message.includes('qualityPolicy')), true);
});

await test('asset validation accepts raster image sourceType for VFX atlases', async () => {
  const validation = await import('../src/data/gameDataValidation.js');

  const report = validation.validateCoreGameData({
    assetManifest: [
      {
        id: 'vfx_projectiles_atlas',
        category: 'fx_surface',
        kind: 'sprite_atlas',
        preloadGroup: 'combat_vfx',
        budgetTier: 'standard',
        estimatedBytes: 4096,
        qualityPolicy: 'scalable',
        sourceType: 'image',
      },
    ],
  });

  assert.equal(report.errors.some((message) => message.includes('sourceType')), false, 'image sourceType이 허용되어야 함');
});

await test('asset validation accepts standalone VFX sprite sheet entries with public src metadata', async () => {
  const validation = await import('../src/data/gameDataValidation.js');

  const report = validation.validateCoreGameData({
    assetManifest: [
      {
        id: 'vfx_holy_bolt_sheet',
        category: 'fx_surface',
        kind: 'sprite_sheet',
        preloadGroup: 'combat_vfx',
        budgetTier: 'standard',
        estimatedBytes: 779804,
        qualityPolicy: 'scalable',
        sourceType: 'image',
        files: {
          src: '/assets/vfx/holy_bolt.png',
        },
      },
    ],
  });

  assert.equal(report.ok, true, 'standalone sprite sheet asset entry가 검증을 통과해야 함');
});

await test('shared validation module rejects malformed seamless tile background contracts', async () => {
  const validation = await import('../src/data/gameDataValidation.js');

  const report = validation.validateCoreGameData({
    stageData: [
      {
        id: 'ash_plains',
        background: {
          mode: 'seamless_tile',
          tileSize: 0,
          palette: {
            base: '#0d1117',
            ember: 'rgba(0,0,0,0)',
          },
        },
        assets: {
          backgroundKey: 'stage_bg_ash_plains',
          bossCueKey: 'boss_cue_ash_plains',
        },
      },
      {
        id: 'moon_crypt',
        background: {
          mode: 'unknown_mode',
        },
        assets: {
          backgroundKey: 'stage_bg_moon_crypt',
          bossCueKey: 'boss_cue_moon_crypt',
        },
      },
    ],
    assetManifest: [
      {
        id: 'stage_bg_ash_plains',
        category: 'stage_background',
        kind: 'image_tile_set',
        preloadGroup: 'stage_ash_plains',
        budgetTier: 'critical',
        estimatedBytes: 1200,
        qualityPolicy: 'fixed',
        sourceType: 'image',
        files: {
          overlayAlpha: 2,
        },
      },
      { id: 'boss_cue_ash_plains', category: 'audio_cue', kind: 'procedural_sfx', preloadGroup: 'stage_ash_plains', budgetTier: 'standard', estimatedBytes: 600, qualityPolicy: 'fallback', sourceType: 'audio' },
      { id: 'stage_bg_moon_crypt', category: 'stage_background', kind: 'procedural_palette', preloadGroup: 'stage_moon_crypt', budgetTier: 'critical', estimatedBytes: 1200, qualityPolicy: 'fixed', sourceType: 'procedural' },
      { id: 'boss_cue_moon_crypt', category: 'audio_cue', kind: 'procedural_sfx', preloadGroup: 'stage_moon_crypt', budgetTier: 'standard', estimatedBytes: 600, qualityPolicy: 'fallback', sourceType: 'audio' },
    ],
  });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((message) => message.includes('tileSize')), true);
  assert.equal(report.errors.some((message) => message.includes('background.mode')), true);
  assert.equal(report.errors.some((message) => message.includes('files.baseSrc')), true);
  assert.equal(report.errors.some((message) => message.includes('files.overlayAlpha')), true);
});

await test('shared validation module rejects invalid weapon aiming contracts', async () => {
  const validation = await import('../src/data/gameDataValidation.js');

  const report = validation.validateCoreGameData({
    weaponData: [
      { id: 'bad_pattern', maxLevel: 7, behaviorId: 'targetProjectile', aimPattern: 'fan', aimSpread: 0.1 },
      { id: 'bad_spread', maxLevel: 7, behaviorId: 'targetProjectile', aimPattern: 'wide-spread', aimSpread: -0.1 },
    ],
  });

  assert.equal(report.ok, false);
  assert.equal(report.errors.some((message) => message.includes('aimPattern')), true);
  assert.equal(report.errors.some((message) => message.includes('aimSpread')), true);
});

await test('runtime validation helper also validates shipped stage and asset contracts', async () => {
  const { validateGameData } = await import('../src/utils/validateGameData.js');

  const result = validateGameData({
    stageData: [
      {
        id: 'ash_plains',
        assets: {
          backgroundKey: 'missing_background',
          bossCueKey: 'missing_boss_cue',
        },
      },
    ],
    assetManifest: [],
  });

  assert.equal(result, false, 'runtime validation helper가 stage/asset 계약 위반을 놓치면 안 됨');
});

console.log(`\nGameDataValidation: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
