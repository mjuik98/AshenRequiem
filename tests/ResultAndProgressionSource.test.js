import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';
import { bossData } from '../src/data/bossData.js';
import { enemyData } from '../src/data/enemyData.js';
import { waveData } from '../src/data/waveData.js';
import { unlockData } from '../src/data/unlockData.js';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const resultViewSource = readFileSync(new URL('../src/ui/result/ResultView.js', import.meta.url), 'utf8');
const playSceneSource = readFileSync(new URL('../src/scenes/PlayScene.js', import.meta.url), 'utf8');

console.log('\n[Result/Progression Source]');

test('ESC 무기 카드는 요약 본문과 쿨다운 바 없이 이름/아이콘/태그/레벨만 유지한다', () => {
  assert.equal(pauseViewSource.includes('pv-wsummary'), false, 'PauseView 무기 카드 요약 본문이 아직 남아 있음');
  assert.equal(pauseViewSource.includes('pv-cd-row'), false, 'PauseView 무기 카드 쿨다운 바가 아직 남아 있음');
  assert.equal(pauseViewSource.includes('pv-evo-hint'), false, 'PauseView 무기 카드 진화 힌트 본문이 아직 남아 있음');
});

test('ESC 장신구 카드는 현재 레벨 설명만 표시한다', () => {
  assert.equal(pauseViewSource.includes('Lv2:'), false, 'PauseView 장신구 카드 본문에 다음 레벨 설명이 남아 있음');
});

test('결과 화면은 강화 상점 대신 메인 화면 버튼을 사용한다', () => {
  assert.equal(resultViewSource.includes('강화 상점'), false, 'ResultView에 강화 상점 버튼이 남아 있음');
  assert.equal(resultViewSource.includes('메인 화면으로'), true, 'ResultView에 메인 화면 버튼이 없음');
  assert.equal(playSceneSource.includes('new MetaShopScene(this.game)'), false, 'PlayScene 결과 화면이 여전히 MetaShopScene으로 이동함');
  assert.equal(playSceneSource.includes('new TitleScene(this.game)'), true, 'PlayScene 결과 화면이 TitleScene 복귀를 다루지 않음');
});

test('bossData는 5분 간격의 6종 서로 다른 보스를 사용한다', () => {
  assert.deepEqual(
    bossData.map((boss) => boss.at),
    [300, 600, 900, 1200, 1500, 1800],
    'bossData 스폰 시점이 5분 간격이 아님',
  );
  const enemyIds = bossData.map((boss) => boss.enemyId);
  assert.equal(new Set(enemyIds).size, 6, 'bossData가 6종 서로 다른 보스를 사용하지 않음');
});

test('enemyData에는 6종 보스가 정의되어 있다', () => {
  const bossIds = enemyData.filter((enemy) => enemy.isBoss).map((enemy) => enemy.id);
  assert.equal(new Set(bossIds).size, 6, 'enemyData의 보스 종류 수가 6이 아님');
});

test('waveData는 시간이 지날수록 후반 스폰 압력이 더 강해진다', () => {
  assert.ok(waveData.length >= 10, 'waveData가 충분히 세분화되지 않음');
  assert.ok(waveData.at(-1).spawnPerSecond > waveData[0].spawnPerSecond * 6, '후반 스폰 속도 상승폭이 부족함');
  assert.ok(waveData.at(-1).eliteChance > waveData[0].eliteChance, '후반 엘리트 출현률이 증가하지 않음');
});

test('unlockData는 추가 무기와 장신구 해금 보상을 포함한다', () => {
  assert.ok(unlockData.length >= 8, 'unlockData 확장 수가 부족함');
  const weaponRewards = unlockData.filter((item) => item.targetType === 'weapon').map((item) => item.targetId);
  const accessoryRewards = unlockData.filter((item) => item.targetType === 'accessory').map((item) => item.targetId);
  assert.ok(weaponRewards.includes('boomerang'), '기존 무기 해금이 누락됨');
  assert.ok(weaponRewards.includes('chain_lightning'), '신규 무기 해금 보상이 없음');
  assert.ok(accessoryRewards.includes('persistence_charm'), '기존 장신구 해금이 누락됨');
  assert.ok(accessoryRewards.includes('coin_pendant'), '신규 장신구 해금 보상이 없음');
});

summary();
