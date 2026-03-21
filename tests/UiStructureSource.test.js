import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const playSceneSource = readFileSync(new URL('../src/scenes/PlayScene.js', import.meta.url), 'utf8');
const resultViewSource = readFileSync(new URL('../src/ui/result/ResultView.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../src/core/Game.js', import.meta.url), 'utf8');

console.log('\n[UiStructureSource]');

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

await test('PauseView는 섹션 렌더와 툴팁 builder를 별도 모듈로 위임한다', async () => {
  let pauseSections;
  let pauseTooltipContent;

  try {
    pauseSections = await import('../src/ui/pause/pauseViewSections.js');
    pauseTooltipContent = await import('../src/ui/pause/pauseTooltipContent.js');
  } catch (error) {
    throw new Error(`PauseView 분리 모듈 import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseSections.renderPauseTabPanels, 'function', 'pauseViewSections.renderPauseTabPanels가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseWeaponTooltipContent, 'function', '무기 tooltip builder가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseAccessoryTooltipContent, 'function', '장신구 tooltip builder가 없음');
  assert.match(pauseViewSource, /from '\.\/pauseViewSections\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseTooltipContent\.js'/);
});

await test('PlayScene은 level-up 액션을 전용 controller 모듈에 위임한다', async () => {
  let levelUpController;

  try {
    levelUpController = await import('../src/scenes/play/levelUpController.js');
  } catch (error) {
    throw new Error(`levelUpController import 실패: ${error.message}`);
  }

  assert.equal(typeof levelUpController.createLevelUpController, 'function', 'createLevelUpController가 export되지 않음');
  assert.match(playSceneSource, /from '\.\/play\/levelUpController\.js'/);
  assert.equal(playSceneSource.includes('_rerollLevelUpChoice('), false, 'PlayScene에 카드별 리롤 로직이 남아 있음');
  assert.equal(playSceneSource.includes('_banishLevelUpChoice('), false, 'PlayScene에 봉인 로직이 남아 있음');
});

await test('Pause/Result 액션 버튼은 공통 토큰 모듈을 사용한다', async () => {
  let actionButtonTheme;

  try {
    actionButtonTheme = await import('../src/ui/shared/actionButtonTheme.js');
  } catch (error) {
    throw new Error(`actionButtonTheme import 실패: ${error.message}`);
  }

  assert.equal(typeof actionButtonTheme.renderActionButton, 'function', 'renderActionButton helper가 없음');
  assert.equal(typeof actionButtonTheme.ACTION_BUTTON_THEME, 'object', 'ACTION_BUTTON_THEME 토큰이 없음');
  assert.match(resultViewSource, /from '\.\.\/shared\/actionButtonTheme\.js'/);
  assert.match(pauseViewSource, /from '\.\.\/shared\/actionButtonTheme\.js'/);
});

await test('Game는 deterministic runtime hook 모듈을 등록한다', async () => {
  let runtimeHooks;

  try {
    runtimeHooks = await import('../src/core/runtimeHooks.js');
  } catch (error) {
    throw new Error(`runtimeHooks import 실패: ${error.message}`);
  }

  assert.equal(typeof runtimeHooks.registerRuntimeHooks, 'function', 'registerRuntimeHooks가 export되지 않음');
  assert.equal(typeof runtimeHooks.unregisterRuntimeHooks, 'function', 'unregisterRuntimeHooks가 export되지 않음');
  assert.match(gameSource, /from '\.\/runtimeHooks\.js'/);
  assert.match(gameSource, /registerRuntimeHooks\(this\)/);
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
