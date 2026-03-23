import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const pauseLoadoutContentSource = readFileSync(new URL('../src/ui/pause/pauseLoadoutContent.js', import.meta.url), 'utf8');
const resultViewSource = readFileSync(new URL('../src/ui/result/ResultView.js', import.meta.url), 'utf8');
const codexViewSource = readFileSync(new URL('../src/ui/codex/CodexView.js', import.meta.url), 'utf8');
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
  let pauseTooltipController;

  try {
    pauseSections = await import('../src/ui/pause/pauseViewSections.js');
    pauseTooltipContent = await import('../src/ui/pause/pauseTooltipContent.js');
    pauseTooltipController = await import('../src/ui/pause/pauseTooltipController.js');
  } catch (error) {
    throw new Error(`PauseView 분리 모듈 import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseSections.renderPauseTabPanels, 'function', 'pauseViewSections.renderPauseTabPanels가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseWeaponTooltipContent, 'function', '무기 tooltip builder가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseAccessoryTooltipContent, 'function', '장신구 tooltip builder가 없음');
  assert.equal(typeof pauseTooltipController.buildPauseTooltipBindingEntries, 'function', 'tooltip binding helper가 없음');
  assert.equal(typeof pauseTooltipController.computePauseTooltipPosition, 'function', 'tooltip position helper가 없음');
  assert.match(pauseViewSource, /from '\.\/pauseViewSections\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseTooltipController\.js'/);
});

await test('pauseLoadoutContent는 모델/섹션 helper 모듈로 위임한다', async () => {
  let pauseLoadoutModel;
  let pauseLoadoutSections;

  try {
    pauseLoadoutModel = await import('../src/ui/pause/pauseLoadoutModel.js');
    pauseLoadoutSections = await import('../src/ui/pause/pauseLoadoutSections.js');
  } catch (error) {
    throw new Error(`pause loadout helper import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseLoadoutModel.buildPauseLoadoutItems, 'function', 'pauseLoadoutModel.buildPauseLoadoutItems가 없음');
  assert.equal(typeof pauseLoadoutModel.normalizePauseSynergyRequirementId, 'function', 'pauseLoadoutModel.normalizePauseSynergyRequirementId가 없음');
  assert.equal(typeof pauseLoadoutSections.renderPauseLoadoutPanel, 'function', 'pauseLoadoutSections.renderPauseLoadoutPanel이 없음');
  assert.equal(typeof pauseLoadoutSections.renderPauseLoadoutDetail, 'function', 'pauseLoadoutSections.renderPauseLoadoutDetail이 없음');
  assert.match(pauseLoadoutContentSource, /from '\.\/pauseLoadoutModel\.js'/);
  assert.match(pauseLoadoutContentSource, /from '\.\/pauseLoadoutSections\.js'/);
});

await test('PlayScene은 level-up 액션을 전용 controller 모듈에 위임한다', async () => {
  let levelUpController;
  let playSceneRuntime;
  let playSceneOverlays;

  try {
    levelUpController = await import('../src/scenes/play/levelUpController.js');
    playSceneRuntime = await import('../src/scenes/play/playSceneRuntime.js');
    playSceneOverlays = await import('../src/scenes/play/playSceneOverlays.js');
  } catch (error) {
    throw new Error(`playScene helper import 실패: ${error.message}`);
  }

  assert.equal(typeof levelUpController.createLevelUpController, 'function', 'createLevelUpController가 export되지 않음');
  assert.equal(typeof playSceneRuntime.applyRunSessionState, 'function', 'run state helper가 export되지 않음');
  assert.equal(typeof playSceneOverlays.createPauseOverlayConfig, 'function', 'pause overlay helper가 export되지 않음');
  assert.equal(typeof playSceneOverlays.createResultSceneActions, 'function', 'result overlay helper가 export되지 않음');
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

await test('CodexView는 codex helper modules로 탭 렌더링과 스타일을 위임한다', async () => {
  let enemyTab;
  let weaponTab;
  let recordsTab;
  let codexStyles;

  try {
    enemyTab = await import('../src/ui/codex/codexEnemyTab.js');
    weaponTab = await import('../src/ui/codex/codexWeaponTab.js');
    recordsTab = await import('../src/ui/codex/codexRecordsTab.js');
    codexStyles = await import('../src/ui/codex/codexStyles.js');
  } catch (error) {
    throw new Error(`codex helper import 실패: ${error.message}`);
  }

  assert.equal(typeof enemyTab.buildCodexEnemyGridModel, 'function', 'enemy tab helper가 없음');
  assert.equal(typeof weaponTab.partitionCodexWeapons, 'function', 'weapon tab helper가 없음');
  assert.equal(typeof recordsTab.buildCodexRecordsModel, 'function', 'records tab helper가 없음');
  assert.equal(typeof codexStyles.CODEX_VIEW_CSS, 'string', 'codex styles helper가 없음');
  assert.match(codexViewSource, /from '\.\/codexEnemyTab\.js'/);
  assert.match(codexViewSource, /from '\.\/codexWeaponTab\.js'/);
  assert.match(codexViewSource, /from '\.\/codexRecordsTab\.js'/);
  assert.match(codexViewSource, /from '\.\/codexStyles\.js'/);
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
