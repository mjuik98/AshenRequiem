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
});

summary();
