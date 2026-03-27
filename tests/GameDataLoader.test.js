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

summary();
