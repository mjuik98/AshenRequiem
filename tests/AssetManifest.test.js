import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[AssetManifest]');

const { test, summary } = createRunner('AssetManifest');

test('asset manifest exposes stable keys and GameDataLoader includes it in default data', async () => {
  const { assetManifest } = await import('../src/data/assetManifest.js');
  const { GameDataLoader } = await import('../src/data/GameDataLoader.js');

  assert.equal(Array.isArray(assetManifest), true, 'assetManifest 배열이 없음');
  assert.equal(assetManifest.length > 0, true, 'assetManifest가 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.id === 'string' && entry.id.length > 0), true, 'assetManifest entry id가 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.category === 'string' && entry.category.length > 0), true, 'assetManifest entry category가 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.kind === 'string' && entry.kind.length > 0), true, 'assetManifest entry kind가 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.preloadGroup === 'string' && entry.preloadGroup.length > 0), true, 'assetManifest preloadGroup이 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.budgetTier === 'string' && entry.budgetTier.length > 0), true, 'assetManifest budgetTier가 비어 있음');
  assert.equal(assetManifest.every((entry) => Number.isFinite(entry.estimatedBytes) && entry.estimatedBytes > 0), true, 'assetManifest estimatedBytes가 유효하지 않음');
  assert.equal(assetManifest.every((entry) => typeof entry.qualityPolicy === 'string' && entry.qualityPolicy.length > 0), true, 'assetManifest qualityPolicy가 비어 있음');
  assert.equal(assetManifest.every((entry) => typeof entry.sourceType === 'string' && entry.sourceType.length > 0), true, 'assetManifest sourceType이 비어 있음');
  assert.equal(assetManifest.some((entry) => entry.id === 'vfx_projectiles_atlas' && entry.sourceType === 'image'), true, 'projectile atlas asset entry가 누락됨');
  assert.equal(assetManifest.some((entry) => entry.id === 'vfx_effects_atlas' && entry.sourceType === 'image'), true, 'effect atlas asset entry가 누락됨');

  const data = GameDataLoader.loadDefault();
  assert.deepEqual(data.assetManifest, assetManifest, 'GameDataLoader가 assetManifest를 기본 데이터에 포함하지 않음');
  assert.equal(Array.isArray(data.stageData), true, 'stageData가 기본 데이터에 없음');
  assert.equal(
    data.stageData.every((stage) => typeof stage.assets?.backgroundKey === 'string'),
    true,
    'stageData가 background asset key를 노출하지 않음',
  );
  assert.equal(
    data.stageData.every((stage) => typeof stage.assets?.bossCueKey === 'string'),
    true,
    'stageData가 boss cue asset key를 노출하지 않음',
  );
  assert.equal(
    data.stageData.every((stage) => typeof stage.background?.mode === 'string'),
    true,
    'stageData가 background mode를 노출하지 않음',
  );
  assert.equal(
    data.stageData.every((stage) => stage.background?.mode !== 'seamless_tile' || (
      Number.isFinite(stage.background?.tileSize)
      && stage.background.tileSize > 0
      && typeof stage.background.palette?.base === 'string'
      && Array.isArray(stage.background.layers)
    )),
    true,
    'seamless stage background contract가 stageData에 반영되지 않음',
  );
});

summary();
