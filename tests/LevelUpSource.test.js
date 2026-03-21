import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';

const levelUpViewSource = readFileSync(new URL('../src/ui/levelup/LevelUpView.js', import.meta.url), 'utf8');
const playUiSource = readFileSync(new URL('../src/scenes/play/PlayUI.js', import.meta.url), 'utf8');
const playSceneSource = readFileSync(new URL('../src/scenes/PlayScene.js', import.meta.url), 'utf8');

console.log('\n[LevelUp Source]');

test('LevelUpView는 카드별 리롤 버튼과 봉인 모드 UI를 렌더링한다', () => {
  assert.equal(levelUpViewSource.includes('리롤'), true, 'LevelUpView에 리롤 버튼 문구가 없음');
  assert.equal(levelUpViewSource.includes('봉인 모드'), true, 'LevelUpView에 봉인 모드 문구가 없음');
  assert.equal(levelUpViewSource.includes('남은 리롤'), true, 'LevelUpView에 리롤 잔여 횟수 문구가 없음');
  assert.equal(levelUpViewSource.includes('남은 봉인'), true, 'LevelUpView에 봉인 잔여 횟수 문구가 없음');
});

test('LevelUpView는 선택과 카드별 리롤/봉인 토글 콜백을 구분해서 받는다', () => {
  assert.equal(levelUpViewSource.includes('onSelect'), true, 'LevelUpView가 선택 콜백을 받지 않음');
  assert.equal(levelUpViewSource.includes('onReroll'), true, 'LevelUpView가 카드별 리롤 콜백을 받지 않음');
  assert.equal(levelUpViewSource.includes('onToggleBanishMode'), true, 'LevelUpView가 봉인 모드 토글 콜백을 받지 않음');
});

test('PlayUI는 레벨업 설정 객체를 LevelUpView로 그대로 전달한다', () => {
  assert.match(
    playUiSource,
    /showLevelUp\(config\)\s*\{\s*this\._levelUp\.show\(config\);/s,
    'PlayUI가 LevelUpView 설정 객체를 직접 전달하지 않음',
  );
});

test('PlayScene는 카드별 리롤과 봉인 모드 상태를 처리한다', () => {
  assert.equal(playSceneSource.includes('_rerollLevelUpChoice'), true, 'PlayScene에 카드별 리롤 핸들러가 없음');
  assert.equal(playSceneSource.includes('_toggleLevelUpBanishMode'), true, 'PlayScene에 봉인 모드 토글 핸들러가 없음');
  assert.equal(playSceneSource.includes('_selectLevelUpChoice'), true, 'PlayScene에 레벨업 카드 선택 핸들러가 없음');
  assert.equal(playSceneSource.includes('UpgradeSystem.replaceChoiceAtIndex'), true, 'PlayScene이 카드별 리롤 헬퍼를 사용하지 않음');
  assert.equal(playSceneSource.includes('banishedUpgradeIds'), true, 'PlayScene이 런 봉인 목록을 다루지 않음');
});

summary();
