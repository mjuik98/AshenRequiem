import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[GameDataLoader]');

const { test, summary } = createRunner('GameDataLoader');

test('GameDataLoader.loadDefault()는 stageData를 포함한다', async () => {
  const { GameDataLoader } = await import('../src/data/GameDataLoader.js');

  const gameData = GameDataLoader.loadDefault();

  assert.ok(Array.isArray(gameData.stageData), 'stageData가 기본 gameData에 포함되어야 함');
  assert.ok(gameData.stageData.some((stage) => stage.id === 'ash_plains'), '기본 스테이지가 누락됨');
});

test('GameDataLoader.loadDefault()는 확장 stage/weapon/accessory 데이터를 함께 포함한다', async () => {
  const { GameDataLoader } = await import('../src/data/GameDataLoader.js');

  const gameData = GameDataLoader.loadDefault();

  assert.ok(gameData.stageData.some((stage) => stage.id === 'frost_harbor'), '신규 stage frost_harbor가 누락됨');
  assert.ok(gameData.weaponData.some((weapon) => weapon.id === 'ember_spines'), '신규 weapon ember_spines가 누락됨');
  assert.ok(gameData.accessoryData.some((accessory) => accessory.id === 'glacier_band'), '신규 accessory glacier_band가 누락됨');
  assert.ok(gameData.unlockData == null || gameData.unlockData.some?.((entry) => entry.targetId === 'ember_spines'), '신규 weapon unlock entry가 누락됨');
  assert.ok(gameData.upgradeData.some((entry) => entry.weaponId === 'ember_spines'), '신규 weapon upgrade entry가 누락됨');
});

test('GameDataLoader.loadDefault()는 loadout/meta catalog도 함께 포함한다', async () => {
  const { GameDataLoader } = await import('../src/data/GameDataLoader.js');

  const gameData = GameDataLoader.loadDefault();

  assert.ok(Array.isArray(gameData.ascensionData), 'ascensionData가 기본 gameData에 포함되어야 함');
  assert.ok(gameData.ascensionData.some((entry) => entry.level === 0), '기본 ascension entry가 누락됨');
  assert.ok(Array.isArray(gameData.permanentUpgradeData), 'permanentUpgradeData가 기본 gameData에 포함되어야 함');
  assert.ok(gameData.permanentUpgradeData.some((entry) => entry.id === 'perm_hp'), '기본 permanent upgrade entry가 누락됨');
});

summary();
