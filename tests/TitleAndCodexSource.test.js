import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';

const titleScenePath = new URL('../src/scenes/TitleScene.js', import.meta.url);
const codexViewPath = new URL('../src/ui/codex/CodexView.js', import.meta.url);
const startLoadoutViewPath = new URL('../src/ui/title/StartLoadoutView.js', import.meta.url);
const metaShopViewPath = new URL('../src/ui/metashop/MetaShopView.js', import.meta.url);
const settingsViewPath = new URL('../src/ui/settings/SettingsView.js', import.meta.url);

const titleSceneSource = readFileSync(titleScenePath, 'utf8');
const codexViewSource = readFileSync(codexViewPath, 'utf8');
const metaShopViewSource = readFileSync(metaShopViewPath, 'utf8');
const settingsViewSource = readFileSync(settingsViewPath, 'utf8');
const startLoadoutViewExists = existsSync(startLoadoutViewPath);
const startLoadoutViewSource = startLoadoutViewExists
  ? readFileSync(startLoadoutViewPath, 'utf8')
  : '';

console.log('\n[TitleAndCodexSource]');

test('시작 무기 선택 뷰 파일이 존재한다', () => {
  assert.equal(startLoadoutViewExists, true, 'StartLoadoutView.js 파일이 아직 없음');
});

test('TitleScene가 시작 무기 선택 뷰를 통해 게임 시작을 중계한다', () => {
  assert.equal(titleSceneSource.includes('StartLoadoutView'), true, 'TitleScene에 StartLoadoutView 연결이 없음');
  assert.equal(titleSceneSource.includes('selectedStartWeaponId'), true, 'TitleScene이 시작 무기 선택 저장을 다루지 않음');
});

test('StartLoadoutView가 시작 무기 선택 UI 문구를 가진다', () => {
  assert.equal(startLoadoutViewSource.includes('시작 무기 선택'), true, '시작 무기 선택 헤더가 없음');
  assert.equal(startLoadoutViewSource.includes('시작하기'), true, '시작하기 버튼이 없음');
});

test('CodexView가 해금 보상 섹션을 렌더링한다', () => {
  assert.equal(codexViewSource.includes('unlockData'), true, 'CodexView가 unlockData를 사용하지 않음');
  assert.equal(codexViewSource.includes('해금 보상'), true, 'CodexView에 해금 보상 섹션이 없음');
  assert.equal(codexViewSource.includes('completedUnlocks'), true, 'CodexView가 해금 완료 상태를 읽지 않음');
});

test('CodexView 무기 도감은 진화 무기 발견 여부를 evolvedWeapons로도 판정한다', () => {
  assert.equal(codexViewSource.includes('evolvedWeapons'), true, 'CodexView가 evolvedWeapons를 읽지 않음');
  assert.match(
    codexViewSource,
    /w\.isEvolved\s*\?\s*evolvedOwned\.has\(w\.id\)\s*:\s*owned\.has\(w\.id\)/,
    'CodexView가 진화 무기 잠금 판정을 분기하지 않음',
  );
});

test('CodexView 루트는 포인터 이벤트를 활성화해 스크롤을 받을 수 있다', () => {
  assert.match(
    codexViewSource,
    /\.cx-root\s*\{[\s\S]*pointer-events:\s*auto;/,
    'CodexView 루트에 pointer-events:auto가 없어 스크롤 입력이 차단될 수 있음',
  );
});

test('타이틀 하위 화면의 닫기 버튼 문구는 메인 화면으로로 통일된다', () => {
  assert.equal(codexViewSource.includes('메인 화면으로'), true, 'Codex 닫기 문구가 통일되지 않음');
  assert.equal(metaShopViewSource.includes('메인 화면으로'), true, 'MetaShop 닫기 문구가 통일되지 않음');
  assert.equal(settingsViewSource.includes('메인 화면으로'), true, 'Settings 닫기 문구가 통일되지 않음');
  assert.equal(codexViewSource.includes('돌아가기'), false, 'Codex에 이전 닫기 문구가 남아 있음');
  assert.equal(metaShopViewSource.includes('메인화면으로'), false, 'MetaShop에 이전 닫기 문구가 남아 있음');
  assert.equal(settingsViewSource.includes('← 뒤로'), false, 'Settings에 이전 닫기 문구가 남아 있음');
});

test('타이틀 하위 화면은 동일한 배경 그라데이션 토큰을 사용한다', () => {
  const sharedGradient = 'radial-gradient(circle at 50% 18%, #110d1a 0%, #060810 55%, #020104 100%)';
  assert.equal(codexViewSource.includes(sharedGradient), true, 'Codex 공통 배경 토큰이 없음');
  assert.equal(metaShopViewSource.includes(sharedGradient), true, 'MetaShop 공통 배경 토큰이 없음');
  assert.equal(settingsViewSource.includes(sharedGradient), true, 'Settings 공통 배경 토큰이 없음');
});

summary();
