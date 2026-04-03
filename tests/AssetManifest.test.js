import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[AssetManifest]');

const { test, summary } = createRunner('AssetManifest');

test('asset manifest exposes stable keys and GameDataLoader includes it in default data', async () => {
  const { assetManifest } = await import('../src/data/assetManifest.js');
  const { stageData } = await import('../src/data/stageData.js');
  const { GameDataLoader } = await import('../src/data/GameDataLoader.js');
  const stageDataSource = readProjectSource('../src/data/stageData.js');

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
  assert.equal(
    assetManifest.some((entry) => entry.id === 'stage_bg_ash_plains' && typeof entry.files?.baseSrc === 'string'),
    true,
    'Ash Plains background asset entry가 image file metadata를 소유하지 않음',
  );
  assert.equal(
    assetManifest.some((entry) => entry.id === 'stage_bg_ash_plains' && entry.sourceType === 'image'),
    true,
    'Ash Plains background asset entry가 image sourceType으로 전환되지 않음',
  );
  assert.equal(
    assetManifest.some((entry) => entry.id === 'stage_bg_moon_crypt' && entry.sourceType === 'image'),
    true,
    'Moon Crypt background asset entry가 image sourceType으로 전환되지 않음',
  );
  assert.equal(
    assetManifest.some((entry) => entry.id === 'stage_bg_ember_hollow' && entry.sourceType === 'image'),
    true,
    'Ember Hollow background asset entry가 image sourceType으로 전환되지 않음',
  );
  assert.equal(assetManifest.some((entry) => entry.id === 'vfx_projectiles_atlas' && entry.sourceType === 'image'), true, 'projectile atlas asset entry가 누락됨');
  assert.equal(assetManifest.some((entry) => entry.id === 'vfx_effects_atlas' && entry.sourceType === 'image'), true, 'effect atlas asset entry가 누락됨');

  const data = GameDataLoader.loadDefault();
  assert.equal(stageDataSource.includes('baseSrc:'), false, 'stageData source가 background file path를 직접 소유하면 안 됨');
  assert.equal(stageData.some((stage) => stage.background?.images), false, 'raw stageData는 hydrated background.images를 직접 들고 있으면 안 됨');
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
  const ashPlains = data.stageData.find((stage) => stage.id === 'ash_plains');
  assert.equal(typeof ashPlains?.background?.images?.baseSrc, 'string', 'Ash Plains background가 base image tile을 노출하지 않음');
  assert.equal(typeof ashPlains?.background?.images?.overlaySrc, 'string', 'Ash Plains background가 overlay image tile을 노출하지 않음');
  assert.equal(
    ashPlains?.background?.images?.baseSrc,
    '/assets/backgrounds/ash-plains-base-tile.png',
    'Ash Plains base tile 경로가 기대값과 다름',
  );
  assert.equal(
    ashPlains?.background?.images?.overlaySrc,
    '/assets/backgrounds/ash-plains-overlay-tile.png',
    'Ash Plains overlay tile 경로가 기대값과 다름',
  );
  const emberHollow = data.stageData.find((stage) => stage.id === 'ember_hollow');
  assert.equal(typeof emberHollow?.background?.images?.baseSrc, 'string', 'Ember Hollow background가 base image tile을 노출하지 않음');
  assert.equal(typeof emberHollow?.background?.images?.overlaySrc, 'string', 'Ember Hollow background가 overlay image tile을 노출하지 않음');
  assert.equal(
    emberHollow?.background?.images?.baseSrc,
    '/assets/backgrounds/ember-hollow-base-tile.png',
    'Ember Hollow base tile 경로가 기대값과 다름',
  );
  assert.equal(
    emberHollow?.background?.images?.overlaySrc,
    '/assets/backgrounds/ember-hollow-overlay-tile.png',
    'Ember Hollow overlay tile 경로가 기대값과 다름',
  );
  const moonCrypt = data.stageData.find((stage) => stage.id === 'moon_crypt');
  assert.equal(typeof moonCrypt?.background?.images?.baseSrc, 'string', 'Moon Crypt background가 base image tile을 노출하지 않음');
  assert.equal(typeof moonCrypt?.background?.images?.overlaySrc, 'string', 'Moon Crypt background가 overlay image tile을 노출하지 않음');
  assert.equal(
    moonCrypt?.background?.images?.baseSrc,
    '/assets/backgrounds/moon-crypt-base-tile.png',
    'Moon Crypt base tile 경로가 기대값과 다름',
  );
  assert.equal(
    moonCrypt?.background?.images?.overlaySrc,
    '/assets/backgrounds/moon-crypt-overlay-tile.png',
    'Moon Crypt overlay tile 경로가 기대값과 다름',
  );
});

summary();
