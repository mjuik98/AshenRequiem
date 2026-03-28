import assert from 'node:assert/strict';
import { readProjectSource } from './helpers/sourceInspection.js';

const resultViewSource = readProjectSource('../src/ui/result/ResultView.js');
const codexViewSource = readProjectSource('../src/ui/codex/CodexView.js');
const metaShopViewSource = readProjectSource('../src/ui/metashop/MetaShopView.js');
const soundSystemSource = readProjectSource('../src/systems/sound/SoundSystem.js');
const codexStylesSource = readProjectSource('../src/ui/codex/codexStyles.js');
const codexAccessoryTabSource = readProjectSource('../src/ui/codex/codexAccessoryTab.js');
const pauseViewSource = readProjectSource('../src/ui/pause/PauseView.js');
const pauseStylesSource = readProjectSource('../src/ui/pause/pauseStyles.js');
const accessoryDataSource = readProjectSource('../src/data/accessoryData.js');
const weaponDataSource = readProjectSource('../src/data/weaponData.js');
const levelUpViewSource = readProjectSource('../src/ui/levelup/LevelUpView.js');
const resultViewMarkupSource = readProjectSource('../src/ui/result/resultViewMarkup.js');
const resultViewStylesSource = readProjectSource('../src/ui/result/resultViewStyles.js');
const pauseViewShellSource = readProjectSource('../src/ui/pause/pauseViewShell.js');
const settingsViewSource = readProjectSource('../src/ui/settings/SettingsView.js');
const startLoadoutMarkupSource = readProjectSource('../src/ui/title/startLoadoutMarkup.js');
const startLoadoutStylesSource = readProjectSource('../src/ui/title/startLoadoutStyles.js');
const startLoadoutViewSource = readProjectSource('../src/ui/title/StartLoadoutView.js');
const levelUpContentSource = readProjectSource('../src/ui/levelup/levelUpContent.js');
const levelUpStylesSource = readProjectSource('../src/ui/levelup/levelUpViewStyles.js');

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
  let pauseView;
  let pauseSections;
  let pauseTooltipContent;
  let pauseTooltipController;
  let pauseViewModel;
  let pauseViewLifecycle;
  let pauseAudioController;
  let pauseTooltipBindings;

  try {
    pauseView = await import('../src/ui/pause/PauseView.js');
    pauseSections = await import('../src/ui/pause/pauseViewSections.js');
    pauseTooltipContent = await import('../src/ui/pause/pauseTooltipContent.js');
    pauseTooltipController = await import('../src/ui/pause/pauseTooltipController.js');
    pauseViewModel = await import('../src/ui/pause/pauseViewModel.js');
    pauseViewLifecycle = await import('../src/ui/pause/pauseViewLifecycle.js');
    pauseAudioController = await import('../src/ui/pause/pauseAudioController.js');
    pauseTooltipBindings = await import('../src/ui/pause/pauseTooltipBindings.js');
  } catch (error) {
    throw new Error(`PauseView 분리 모듈 import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseView.PauseView, 'function', 'PauseView class가 없음');
  assert.equal(typeof pauseSections.renderPauseTabPanels, 'function', 'pauseViewSections.renderPauseTabPanels가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseWeaponTooltipContent, 'function', '무기 tooltip builder가 없음');
  assert.equal(typeof pauseTooltipContent.buildPauseAccessoryTooltipContent, 'function', '장신구 tooltip builder가 없음');
  assert.equal(typeof pauseTooltipController.buildPauseTooltipBindingEntries, 'function', 'tooltip binding helper가 없음');
  assert.equal(typeof pauseTooltipController.computePauseTooltipPosition, 'function', 'tooltip position helper가 없음');
  assert.equal(typeof pauseViewModel.buildPauseViewIndexes, 'function', 'pause view index helper가 없음');
  assert.equal(typeof pauseViewModel.resolvePauseSelectedLoadoutKey, 'function', 'pause view selection helper가 없음');
  assert.equal(typeof pauseViewLifecycle.applyPauseViewShowState, 'function', 'pause lifecycle show helper가 없음');
  assert.equal(typeof pauseViewLifecycle.resetPauseViewRuntime, 'function', 'pause lifecycle reset helper가 없음');
  assert.equal(typeof pauseAudioController.bindPauseAudioControls, 'function', 'pause audio controller helper가 없음');
  assert.equal(typeof pauseTooltipBindings.bindPauseTooltipEntries, 'function', 'pause tooltip binding helper가 없음');
});

await test('PauseView는 shell과 interaction controller로 렌더 조립을 추가 분리한다', async () => {
  let pauseView;
  let pauseViewShell;
  let pauseViewInteractions;
  let pauseViewRuntime;

  try {
    pauseView = await import('../src/ui/pause/PauseView.js');
    pauseViewShell = await import('../src/ui/pause/pauseViewShell.js');
    pauseViewInteractions = await import('../src/ui/pause/pauseViewInteractions.js');
    pauseViewRuntime = await import('../src/ui/pause/pauseViewRuntime.js');
  } catch (error) {
    throw new Error(`PauseView shell/controller import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseView.PauseView, 'function', 'PauseView class가 없음');
  assert.equal(typeof pauseViewShell.renderPauseViewShell, 'function', 'pauseViewShell.renderPauseViewShell이 없음');
  assert.equal(typeof pauseViewInteractions.bindPauseFooterActions, 'function', 'pauseViewInteractions.bindPauseFooterActions가 없음');
  assert.equal(typeof pauseViewInteractions.bindPauseInteractionHandlers, 'function', 'pauseViewInteractions.bindPauseInteractionHandlers가 없음');
  assert.equal(typeof pauseViewRuntime.renderPauseViewRuntime, 'function', 'pauseViewRuntime.renderPauseViewRuntime이 없음');
  assert.equal(typeof pauseViewRuntime.refreshPauseLoadoutPanelRuntime, 'function', 'pauseViewRuntime.refreshPauseLoadoutPanelRuntime이 없음');
});

await test('pauseLoadoutContent는 모델/섹션 helper 모듈로 위임한다', async () => {
  let pauseLoadoutContent;
  let pauseLoadoutModel;
  let pauseLoadoutSections;

  try {
    pauseLoadoutContent = await import('../src/ui/pause/pauseLoadoutContent.js');
    pauseLoadoutModel = await import('../src/ui/pause/pauseLoadoutModel.js');
    pauseLoadoutSections = await import('../src/ui/pause/pauseLoadoutSections.js');
  } catch (error) {
    throw new Error(`pause loadout helper import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseLoadoutModel.buildPauseLoadoutItems, 'function', 'pauseLoadoutModel.buildPauseLoadoutItems가 없음');
  assert.equal(typeof pauseLoadoutModel.normalizePauseSynergyRequirementId, 'function', 'pauseLoadoutModel.normalizePauseSynergyRequirementId가 없음');
  assert.equal(typeof pauseLoadoutSections.renderPauseLoadoutPanel, 'function', 'pauseLoadoutSections.renderPauseLoadoutPanel이 없음');
  assert.equal(typeof pauseLoadoutSections.renderPauseLoadoutDetail, 'function', 'pauseLoadoutSections.renderPauseLoadoutDetail이 없음');
  assert.equal(pauseLoadoutContent.buildPauseLoadoutItems, pauseLoadoutModel.buildPauseLoadoutItems, 'pauseLoadoutContent가 모델 facade를 재-export하지 않음');
  assert.equal(pauseLoadoutContent.renderPauseLoadoutPanel, pauseLoadoutSections.renderPauseLoadoutPanel, 'pauseLoadoutContent가 섹션 facade를 재-export하지 않음');
});

await test('pause loadout detail는 meta/stats helper로 세부 섹션을 위임한다', async () => {
  let pauseLoadoutDetailSections;
  let pauseLoadoutMetaSections;
  let pauseLoadoutStatsSections;

  try {
    pauseLoadoutDetailSections = await import('../src/ui/pause/pauseLoadoutDetailSections.js');
    pauseLoadoutMetaSections = await import('../src/ui/pause/pauseLoadoutMetaSections.js');
    pauseLoadoutStatsSections = await import('../src/ui/pause/pauseLoadoutStatsSections.js');
  } catch (error) {
    throw new Error(`pause loadout detail helper import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseLoadoutMetaSections.renderPauseLinkedItemsSection, 'function', 'meta helper가 linked items를 export하지 않음');
  assert.equal(typeof pauseLoadoutMetaSections.renderPauseSynergySection, 'function', 'meta helper가 synergy section을 export하지 않음');
  assert.equal(typeof pauseLoadoutMetaSections.renderPauseEvolutionSection, 'function', 'meta helper가 evolution section을 export하지 않음');
  assert.equal(typeof pauseLoadoutStatsSections.renderPauseStatusBlock, 'function', 'stats helper가 status block을 export하지 않음');
  assert.equal(typeof pauseLoadoutStatsSections.renderPauseLoadoutDetailHeader, 'function', 'stats helper가 detail header를 export하지 않음');
  assert.equal(typeof pauseLoadoutDetailSections.renderPauseLoadoutDetail, 'function', 'detail section facade가 없음');
});

await test('pause loadout meta는 linked/synergy/evolution helper로 추가 분리된다', async () => {
  let pauseLoadoutMetaSections;
  let linkedItemsSection;
  let synergySection;
  let evolutionSection;

  try {
    pauseLoadoutMetaSections = await import('../src/ui/pause/pauseLoadoutMetaSections.js');
    linkedItemsSection = await import('../src/ui/pause/pauseLinkedItemsSection.js');
    synergySection = await import('../src/ui/pause/pauseSynergySection.js');
    evolutionSection = await import('../src/ui/pause/pauseEvolutionSection.js');
  } catch (error) {
    throw new Error(`pause loadout meta helper import 실패: ${error.message}`);
  }

  assert.equal(typeof linkedItemsSection.renderPauseLinkedItemsSection, 'function', 'linked items helper가 없음');
  assert.equal(typeof synergySection.renderPauseSynergySection, 'function', 'synergy helper가 없음');
  assert.equal(typeof evolutionSection.renderPauseEvolutionSection, 'function', 'evolution helper가 없음');
  assert.equal(pauseLoadoutMetaSections.renderPauseLinkedItemsSection, linkedItemsSection.renderPauseLinkedItemsSection, 'meta facade가 linked items helper를 재-export하지 않음');
  assert.equal(pauseLoadoutMetaSections.renderPauseSynergySection, synergySection.renderPauseSynergySection, 'meta facade가 synergy helper를 재-export하지 않음');
  assert.equal(pauseLoadoutMetaSections.renderPauseEvolutionSection, evolutionSection.renderPauseEvolutionSection, 'meta facade가 evolution helper를 재-export하지 않음');
});

await test('PlayScene은 level-up 액션을 전용 controller 모듈에 위임한다', async () => {
  let levelUpController;
  let playSceneRuntime;
  let playSceneOverlays;
  let levelUpInteractions;
  let levelUpStyles;

  try {
    levelUpController = await import('../src/scenes/play/levelUpController.js');
    playSceneRuntime = await import('../src/scenes/play/playSceneRuntime.js');
    playSceneOverlays = await import('../src/scenes/play/playSceneOverlays.js');
    levelUpInteractions = await import('../src/ui/levelup/levelUpViewInteractions.js');
    levelUpStyles = await import('../src/ui/levelup/levelUpViewStyles.js');
  } catch (error) {
    throw new Error(`playScene helper import 실패: ${error.message}`);
  }

  assert.equal(typeof levelUpController.createLevelUpController, 'function', 'createLevelUpController가 export되지 않음');
  assert.equal(typeof playSceneRuntime.applyRunSessionState, 'function', 'run state helper가 export되지 않음');
  assert.equal(typeof playSceneOverlays.createPauseOverlayConfig, 'function', 'pause overlay helper가 export되지 않음');
  assert.equal(typeof playSceneOverlays.createResultSceneActions, 'function', 'result overlay helper가 export되지 않음');
  assert.equal(typeof levelUpInteractions.bindLevelUpCardInteractions, 'function', 'LevelUpView interaction helper가 없음');
  assert.equal(typeof levelUpStyles.ensureLevelUpViewStyles, 'function', 'LevelUpView style helper가 없음');
  assert.match(levelUpViewSource, /from '\.\/levelUpViewInteractions\.js'/, 'LevelUpView가 interaction helper를 사용하지 않음');
  assert.match(levelUpViewSource, /from '\.\/levelUpViewStyles\.js'/, 'LevelUpView가 style helper를 사용하지 않음');
});

await test('Pause/Result 액션 버튼은 공통 토큰 모듈을 사용한다', async () => {
  let actionButtonTheme;
  let pauseView;
  let resultView;
  let resultMarkup;
  let resultStyles;

  try {
    actionButtonTheme = await import('../src/ui/shared/actionButtonTheme.js');
    pauseView = await import('../src/ui/pause/PauseView.js');
    resultView = await import('../src/ui/result/ResultView.js');
    resultMarkup = await import('../src/ui/result/resultViewMarkup.js');
    resultStyles = await import('../src/ui/result/resultViewStyles.js');
  } catch (error) {
    throw new Error(`actionButtonTheme import 실패: ${error.message}`);
  }

  assert.equal(typeof actionButtonTheme.renderActionButton, 'function', 'renderActionButton helper가 없음');
  assert.equal(typeof actionButtonTheme.ACTION_BUTTON_THEME, 'object', 'ACTION_BUTTON_THEME 토큰이 없음');
  assert.equal(typeof pauseView.PauseView, 'function', 'PauseView class가 없음');
  assert.equal(typeof resultView.ResultView, 'function', 'ResultView class가 없음');
  assert.equal(typeof resultMarkup.renderResultViewMarkup, 'function', 'ResultView markup helper가 없음');
  assert.equal(typeof resultStyles.ensureResultViewStyles, 'function', 'ResultView style helper가 없음');
  assert.match(resultViewSource, /from '\.\/resultViewMarkup\.js'/, 'ResultView가 markup helper를 사용하지 않음');
  assert.match(resultViewSource, /from '\.\/resultViewStyles\.js'/, 'ResultView가 style helper를 사용하지 않음');
  assert.equal(
    /from '\.\.\/shared\/actionButtonTheme\.js'/.test(resultViewMarkupSource)
      || /from '\.\.\/shared\/actionButtonTheme\.js'/.test(resultViewStylesSource),
    true,
    'ResultView 분해 helper가 공통 action button theme를 사용하지 않음',
  );
});

await test('모달 계열 UI는 공통 modal theme와 action button 토큰을 공유한다', async () => {
  let modalTheme;
  let modalShell;
  let dialogRuntime;
  let levelUpContent;
  let pauseStyles;
  let startLoadoutMarkup;
  let startLoadoutStyles;

  try {
    modalTheme = await import('../src/ui/shared/modalTheme.js');
    modalShell = await import('../src/ui/shared/modalShell.js');
    dialogRuntime = await import('../src/ui/shared/dialogRuntime.js');
    levelUpContent = await import('../src/ui/levelup/levelUpContent.js');
    pauseStyles = await import('../src/ui/pause/pauseStyles.js');
    startLoadoutMarkup = await import('../src/ui/title/startLoadoutMarkup.js');
    startLoadoutStyles = await import('../src/ui/title/startLoadoutStyles.js');
  } catch (error) {
    throw new Error(`modal theme import 실패: ${error.message}`);
  }

  assert.equal(typeof modalTheme.MODAL_THEME, 'object', 'MODAL_THEME 토큰이 없음');
  assert.equal(typeof modalTheme.MODAL_SHARED_CSS, 'string', 'MODAL_SHARED_CSS가 없음');
  assert.equal(typeof modalShell.renderModalShell, 'function', 'renderModalShell helper가 없음');
  assert.equal(typeof modalShell.renderModalHeader, 'function', 'renderModalHeader helper가 없음');
  assert.equal(typeof dialogRuntime.bindDialogRuntime, 'function', 'bindDialogRuntime helper가 없음');
  assert.equal(typeof levelUpContent.buildLevelUpHeaderMarkup, 'function', 'LevelUp markup helper가 없음');
  assert.equal(typeof pauseStyles.PAUSE_VIEW_CSS, 'string', 'PauseView style helper가 없음');
  assert.equal(typeof startLoadoutMarkup.renderStartLoadoutMarkup, 'function', 'StartLoadout markup helper가 없음');
  assert.equal(typeof startLoadoutStyles.ensureStartLoadoutStyles, 'function', 'StartLoadout style helper가 없음');
  assert.equal(
    /from '\.\.\/shared\/modalTheme\.js'/.test(startLoadoutStylesSource)
      || /from '\.\.\/shared\/modalTheme\.js'/.test(resultViewStylesSource)
      || /from '\.\.\/shared\/modalTheme\.js'/.test(pauseStylesSource)
      || /from '\.\.\/shared\/modalTheme\.js'/.test(levelUpStylesSource),
    true,
    '모달 스타일이 공통 modal theme를 사용하지 않음',
  );
  assert.equal(
    /from '\.\.\/shared\/actionButtonTheme\.js'/.test(startLoadoutMarkupSource)
      || /from '\.\.\/shared\/actionButtonTheme\.js'/.test(levelUpContentSource),
    true,
    'StartLoadout/LevelUp가 공통 action button theme를 사용하지 않음',
  );
  assert.equal(
    /from '\.\.\/shared\/modalShell\.js'/.test(startLoadoutMarkupSource)
      && /from '\.\.\/shared\/modalShell\.js'/.test(levelUpContentSource)
      && /from '\.\.\/shared\/modalShell\.js'/.test(resultViewMarkupSource)
      && /from '\.\.\/shared\/modalShell\.js'/.test(pauseViewShellSource),
    true,
    '모달 markup helper들이 공통 modal shell을 사용하지 않음',
  );
  assert.equal(
    /from '\.\.\/shared\/dialogRuntime\.js'/.test(startLoadoutViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(levelUpViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(pauseViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(resultViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(metaShopViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(settingsViewSource)
      && /from '\.\.\/shared\/dialogRuntime\.js'/.test(codexViewSource),
    true,
    '오버레이/서브스크린 view들이 공통 dialog runtime을 사용하지 않음',
  );
});

await test('StartLoadoutView는 markup/style/interaction helper로 분리된다', async () => {
  let startLoadoutView;
  let startLoadoutMarkup;
  let startLoadoutStyles;
  let startLoadoutInteractions;

  try {
    startLoadoutView = await import('../src/ui/title/StartLoadoutView.js');
    startLoadoutMarkup = await import('../src/ui/title/startLoadoutMarkup.js');
    startLoadoutStyles = await import('../src/ui/title/startLoadoutStyles.js');
    startLoadoutInteractions = await import('../src/ui/title/startLoadoutInteractions.js');
  } catch (error) {
    throw new Error(`StartLoadoutView helper import 실패: ${error.message}`);
  }

  assert.equal(typeof startLoadoutView.StartLoadoutView, 'function', 'StartLoadoutView class가 없음');
  assert.equal(typeof startLoadoutMarkup.renderStartLoadoutMarkup, 'function', 'StartLoadout markup helper가 없음');
  assert.equal(typeof startLoadoutMarkup.getStartLoadoutWeaponEmoji, 'function', 'StartLoadout emoji helper가 없음');
  assert.equal(typeof startLoadoutStyles.ensureStartLoadoutStyles, 'function', 'StartLoadout style helper가 없음');
  assert.equal(typeof startLoadoutInteractions.bindStartLoadoutInteractions, 'function', 'StartLoadout interaction helper가 없음');
});

await test('pause loadout model은 format/relationship helper로 추가 분리된다', async () => {
  let pauseLoadoutFormatting;
  let pauseLoadoutRelationships;
  let pauseLoadoutModel;

  try {
    pauseLoadoutFormatting = await import('../src/ui/pause/pauseLoadoutFormatting.js');
    pauseLoadoutRelationships = await import('../src/ui/pause/pauseLoadoutRelationships.js');
    pauseLoadoutModel = await import('../src/ui/pause/pauseLoadoutModel.js');
  } catch (error) {
    throw new Error(`pause loadout sub-helper import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseLoadoutFormatting.escapeHtml, 'function', 'pauseLoadoutFormatting.escapeHtml가 없음');
  assert.equal(typeof pauseLoadoutFormatting.getKindLabel, 'function', 'pauseLoadoutFormatting.getKindLabel가 없음');
  assert.equal(typeof pauseLoadoutRelationships.getRelatedItems, 'function', 'pauseLoadoutRelationships.getRelatedItems가 없음');
  assert.equal(typeof pauseLoadoutRelationships.isEvolutionReady, 'function', 'pauseLoadoutRelationships.isEvolutionReady가 없음');
  assert.equal(typeof pauseLoadoutRelationships.hasSynergyActive, 'function', 'pauseLoadoutRelationships.hasSynergyActive가 없음');
  assert.equal(pauseLoadoutModel.escapeHtml, pauseLoadoutFormatting.escapeHtml, 'pauseLoadoutModel이 formatting helper를 재-export하지 않음');
  assert.equal(pauseLoadoutModel.getRelatedItems, pauseLoadoutRelationships.getRelatedItems, 'pauseLoadoutModel이 relationship helper를 재-export하지 않음');
});

await test('CodexView는 codex helper modules로 탭 렌더링과 스타일을 위임한다', async () => {
  let enemyTab;
  let weaponTab;
  let recordsTab;
  let accessoryModel;
  let accessoryRender;
  let accessoryStyles;
  let codexStyles;
  let codexViewState;
  let codexViewBindings;
  let codexViewShell;
  let codexViewControllers;
  let codexViewRuntime;

  try {
    enemyTab = await import('../src/ui/codex/codexEnemyTab.js');
    weaponTab = await import('../src/ui/codex/codexWeaponTab.js');
    recordsTab = await import('../src/ui/codex/codexRecordsTab.js');
    accessoryModel = await import('../src/ui/codex/codexAccessoryModel.js');
    accessoryRender = await import('../src/ui/codex/codexAccessoryRender.js');
    accessoryStyles = await import('../src/ui/codex/codexAccessoryStyles.js');
    codexStyles = await import('../src/ui/codex/codexStyles.js');
    codexViewState = await import('../src/ui/codex/codexViewState.js');
    codexViewBindings = await import('../src/ui/codex/codexViewBindings.js');
    codexViewShell = await import('../src/ui/codex/codexViewShell.js');
    codexViewControllers = await import('../src/ui/codex/codexViewControllers.js');
    codexViewRuntime = await import('../src/ui/codex/codexViewRuntime.js');
  } catch (error) {
    throw new Error(`codex helper import 실패: ${error.message}`);
  }

  assert.equal(typeof enemyTab.buildCodexEnemyGridModel, 'function', 'enemy tab helper가 없음');
  assert.equal(typeof weaponTab.partitionCodexWeapons, 'function', 'weapon tab helper가 없음');
  assert.equal(typeof recordsTab.buildCodexRecordsModel, 'function', 'records tab helper가 없음');
  assert.equal(typeof accessoryModel.buildCodexAccessoryGridModel, 'function', 'accessory model helper가 없음');
  assert.equal(typeof accessoryRender.renderCodexAccessoryTab, 'function', 'accessory render helper가 없음');
  assert.equal(typeof accessoryStyles.CODEX_ACCESSORY_TAB_CSS, 'string', 'accessory style helper가 없음');
  assert.equal(typeof codexStyles.CODEX_VIEW_CSS, 'string', 'codex styles helper가 없음');
  assert.equal(typeof codexViewState.createCodexViewState, 'function', 'codex state helper가 없음');
  assert.equal(typeof codexViewBindings.bindCodexTabButtons, 'function', 'codex binding helper가 없음');
  assert.equal(typeof codexViewShell.renderCodexViewShell, 'function', 'codex shell helper가 없음');
  assert.equal(typeof codexViewControllers.renderCodexAccessoryPanel, 'function', 'codex panel controller helper가 없음');
  assert.equal(typeof codexViewRuntime.renderCodexViewRuntime, 'function', 'codex runtime helper가 없음');
  assert.match(codexViewSource, /from '\.\/codexStyles\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewState\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewRuntime\.js'/);
  assert.match(codexAccessoryTabSource, /from '\.\/codexAccessoryModel\.js'/);
  assert.match(codexAccessoryTabSource, /from '\.\/codexAccessoryRender\.js'/);
  assert.equal(codexViewSource.includes('Object.defineProperties(this'), false, 'CodexView에 state mirroring descriptor가 남아 있음');
});

await test('SoundSystem은 runtime helper modules로 실행과 버스 제어를 위임한다', async () => {
  let soundBusRuntime;
  let soundPlaybackRuntime;
  let soundSystemState;
  let soundSystemLifecycle;
  let soundPlaybackController;
  let soundBgmController;
  let soundSfxController;

  try {
    soundBusRuntime = await import('../src/systems/sound/soundBusRuntime.js');
    soundPlaybackRuntime = await import('../src/systems/sound/soundPlaybackRuntime.js');
    soundSystemState = await import('../src/systems/sound/soundSystemState.js');
    soundSystemLifecycle = await import('../src/systems/sound/soundSystemLifecycle.js');
    soundPlaybackController = await import('../src/systems/sound/soundPlaybackController.js');
    soundBgmController = await import('../src/systems/sound/soundBgmController.js');
    soundSfxController = await import('../src/systems/sound/soundSfxController.js');
  } catch (error) {
    throw new Error(`sound runtime helper import 실패: ${error.message}`);
  }

  assert.equal(typeof soundBusRuntime.syncSoundBusVolumes, 'function', 'sound bus runtime helper가 없음');
  assert.equal(typeof soundBusRuntime.duckBgmBus, 'function', 'bgm duck helper가 없음');
  assert.equal(typeof soundPlaybackRuntime.playBgmVoice, 'function', 'bgm playback helper가 없음');
  assert.equal(typeof soundPlaybackRuntime.stopBgmVoice, 'function', 'bgm stop helper가 없음');
  assert.equal(typeof soundSystemState.createSoundSystemState, 'function', 'sound system state helper가 없음');
  assert.equal(typeof soundSystemLifecycle.initSoundSystemContext, 'function', 'sound lifecycle helper가 없음');
  assert.equal(typeof soundPlaybackController.playSoundEffect, 'function', 'sound playback controller helper가 없음');
  assert.equal(typeof soundBgmController.playSoundBgm, 'function', 'sound bgm controller helper가 없음');
  assert.equal(typeof soundSfxController.playSoundEffect, 'function', 'sound sfx controller helper가 없음');
  assert.match(soundSystemSource, /from '\.\/soundBusRuntime\.js'/);
  assert.match(soundSystemSource, /from '\.\/soundSystemState\.js'/);
  assert.match(soundSystemSource, /from '\.\/soundSystemLifecycle\.js'/);
  assert.match(soundSystemSource, /from '\.\/soundPlaybackController\.js'/);
  assert.match(soundSystemSource, /from '\.\/soundBgmController\.js'/);
  assert.match(soundSystemSource, /from '\.\/soundSfxController\.js'/);
});

await test('UpgradeSystem은 choice/fallback/apply helper 모듈로 분리된다', async () => {
  let upgradeChoicePool;
  let upgradeFallbackChoices;
  let upgradeApplyRuntime;
  let upgradeSystem;

  try {
    upgradeChoicePool = await import('../src/systems/progression/upgradeChoicePool.js');
    upgradeFallbackChoices = await import('../src/systems/progression/upgradeFallbackChoices.js');
    upgradeApplyRuntime = await import('../src/systems/progression/upgradeApplyRuntime.js');
    upgradeSystem = await import('../src/systems/progression/UpgradeSystem.js');
  } catch (error) {
    throw new Error(`upgrade helper import 실패: ${error.message}`);
  }

  assert.equal(typeof upgradeChoicePool.buildUpgradeChoicePool, 'function', 'upgrade choice pool helper가 없음');
  assert.equal(typeof upgradeFallbackChoices.fillWithFallbackChoices, 'function', 'upgrade fallback helper가 없음');
  assert.equal(typeof upgradeApplyRuntime.applyUpgradeRuntime, 'function', 'upgrade apply helper가 없음');
  assert.equal(typeof upgradeSystem.UpgradeSystem.generateChoices, 'function', 'UpgradeSystem.generateChoices가 없음');
  assert.equal(typeof upgradeSystem.UpgradeSystem.replaceChoiceAtIndex, 'function', 'UpgradeSystem.replaceChoiceAtIndex가 없음');
});

await test('codex styles는 세부 style fragment 모듈로 조합된다', async () => {
  let codexLayoutStyles;
  let codexTabStyles;
  let codexResponsiveStyles;
  let codexAccessoryStyles;

  try {
    codexLayoutStyles = await import('../src/ui/codex/codexLayoutStyles.js');
    codexTabStyles = await import('../src/ui/codex/codexTabStyles.js');
    codexResponsiveStyles = await import('../src/ui/codex/codexResponsiveStyles.js');
    codexAccessoryStyles = await import('../src/ui/codex/codexAccessoryStyles.js');
  } catch (error) {
    throw new Error(`codex styles fragment import 실패: ${error.message}`);
  }

  assert.equal(typeof codexLayoutStyles.CODEX_LAYOUT_CSS, 'string', 'codex layout styles가 없음');
  assert.equal(typeof codexTabStyles.CODEX_TAB_CSS, 'string', 'codex tab styles가 없음');
  assert.equal(typeof codexResponsiveStyles.CODEX_RESPONSIVE_CSS, 'string', 'codex responsive styles가 없음');
  assert.equal(typeof codexAccessoryStyles.CODEX_ACCESSORY_TAB_CSS, 'string', 'codex accessory styles가 없음');
  assert.match(codexStylesSource, /from '\.\/codexLayoutStyles\.js'/);
  assert.match(codexStylesSource, /from '\.\/codexTabStyles\.js'/);
  assert.match(codexStylesSource, /from '\.\/codexResponsiveStyles\.js'/);
  assert.match(codexStylesSource, /from '\.\/codexAccessoryStyles\.js'/);
  assert.match(codexStylesSource, /CODEX_ACCESSORY_TAB_CSS/);
});

await test('pause styles는 layout\/loadout\/audio\/responsive fragment로 조합된다', async () => {
  let pauseLayoutStyles;
  let pauseLoadoutStyles;
  let pauseAudioStyles;
  let pauseResponsiveStyles;

  try {
    pauseLayoutStyles = await import('../src/ui/pause/pauseLayoutStyles.js');
    pauseLoadoutStyles = await import('../src/ui/pause/pauseLoadoutStyles.js');
    pauseAudioStyles = await import('../src/ui/pause/pauseAudioStyles.js');
    pauseResponsiveStyles = await import('../src/ui/pause/pauseResponsiveStyles.js');
  } catch (error) {
    throw new Error(`pause styles fragment import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseLayoutStyles.PAUSE_LAYOUT_CSS, 'string', 'pause layout styles가 없음');
  assert.equal(typeof pauseLoadoutStyles.PAUSE_LOADOUT_CSS, 'string', 'pause loadout styles가 없음');
  assert.equal(typeof pauseAudioStyles.PAUSE_AUDIO_CSS, 'string', 'pause audio styles가 없음');
  assert.equal(typeof pauseResponsiveStyles.PAUSE_RESPONSIVE_CSS, 'string', 'pause responsive styles가 없음');
  assert.match(pauseStylesSource, /from '\.\/pauseLayoutStyles\.js'/);
  assert.match(pauseStylesSource, /from '\.\/pauseLoadoutStyles\.js'/);
  assert.match(pauseStylesSource, /from '\.\/pauseAudioStyles\.js'/);
  assert.match(pauseStylesSource, /from '\.\/pauseResponsiveStyles\.js'/);
});

await test('browser smoke transport는 resolver\/runner\/parser\/session facade 모듈로 추가 분리된다', async () => {
  let smokeCliPaths;
  let smokeCliRunner;
  let smokeCliParsers;
  let smokeSessionTransport;
  let smokeCliTransport;

  try {
    smokeCliPaths = await import('../scripts/browser-smoke/smokeCliPaths.mjs');
    smokeCliRunner = await import('../scripts/browser-smoke/smokeCliRunner.mjs');
    smokeCliParsers = await import('../scripts/browser-smoke/smokeCliParsers.mjs');
    smokeSessionTransport = await import('../scripts/browser-smoke/smokeSessionTransport.mjs');
    smokeCliTransport = await import('../scripts/browser-smoke/smokeCliTransport.mjs');
  } catch (error) {
    throw new Error(`smoke transport helper import 실패: ${error.message}`);
  }

  assert.equal(typeof smokeCliPaths.resolveWindowsPlaywrightCliPath, 'function', 'smoke cli path helper가 없음');
  assert.equal(typeof smokeCliPaths.buildPlaywrightInvocation, 'function', 'smoke cli invocation helper가 없음');
  assert.equal(typeof smokeCliRunner.runPlaywrightCliCommand, 'function', 'smoke cli runner helper가 없음');
  assert.equal(typeof smokeCliParsers.parseEvalResult, 'function', 'smoke cli parser helper가 없음');
  assert.equal(typeof smokeCliParsers.parseSnapshotPath, 'function', 'smoke cli snapshot parser가 없음');
  assert.equal(typeof smokeSessionTransport.createPlaywrightSessionTransport, 'function', 'smoke session transport helper가 없음');
  assert.equal(typeof smokeCliTransport.buildPlaywrightInvocation, 'function', 'smoke transport facade가 build helper를 재노출하지 않음');
  assert.equal(typeof smokeCliTransport.runPlaywrightCliCommand, 'function', 'smoke transport facade가 runner helper를 재노출하지 않음');
  assert.equal(typeof smokeCliTransport.parseEvalResult, 'function', 'smoke transport facade가 parser helper를 재노출하지 않음');
  assert.equal(typeof smokeCliTransport.createPlaywrightSessionTransport, 'function', 'smoke transport facade가 session helper를 재노출하지 않음');
});

await test('Game는 deterministic runtime hook 모듈을 등록한다', async () => {
  let runtimeHooks;
  let Game;

  try {
    runtimeHooks = await import('../src/core/runtimeHooks.js');
    ({ Game } = await import('../src/core/Game.js'));
  } catch (error) {
    throw new Error(`runtimeHooks import 실패: ${error.message}`);
  }

  assert.equal(typeof runtimeHooks.registerRuntimeHooks, 'function', 'registerRuntimeHooks가 export되지 않음');
  assert.equal(typeof runtimeHooks.unregisterRuntimeHooks, 'function', 'unregisterRuntimeHooks가 export되지 않음');
  assert.equal(typeof Game, 'function', 'Game 클래스가 export되지 않음');
});

await test('TitleScene는 상태/종료 처리 helper를 별도 모듈로 위임한다', async () => {
  let titleSceneStatus;
  let titleSceneRuntime;
  let TitleScene;

  try {
    titleSceneStatus = await import('../src/scenes/title/titleSceneStatus.js');
    titleSceneRuntime = await import('../src/scenes/title/titleSceneRuntime.js');
    ({ TitleScene } = await import('../src/scenes/TitleScene.js'));
  } catch (error) {
    throw new Error(`titleSceneStatus import 실패: ${error.message}`);
  }

  assert.equal(typeof titleSceneStatus.createTitleStatusController, 'function', 'createTitleStatusController가 없음');
  assert.equal(typeof titleSceneStatus.attemptWindowClose, 'function', 'attemptWindowClose가 없음');
  assert.equal(typeof titleSceneRuntime.buildTitleSceneDom, 'function', 'title scene runtime DOM helper가 없음');
  assert.equal(typeof titleSceneRuntime.bindTitleSceneEvents, 'function', 'title scene runtime event helper가 없음');
  assert.equal(typeof TitleScene, 'function', 'TitleScene가 export되지 않음');
});

await test('TitleBackgroundRenderer는 state builder와 draw pass helper로 분리된다', async () => {
  let titleBackgroundState;
  let titleBackgroundDraw;
  let titleBackgroundRenderer;

  try {
    titleBackgroundState = await import('../src/scenes/title/titleBackgroundState.js');
    titleBackgroundDraw = await import('../src/scenes/title/titleBackgroundDraw.js');
    titleBackgroundRenderer = await import('../src/scenes/title/TitleBackgroundRenderer.js');
  } catch (error) {
    throw new Error(`title background helper import 실패: ${error.message}`);
  }

  assert.equal(typeof titleBackgroundState.createTitleBackgroundState, 'function', 'title background state helper가 없음');
  assert.equal(typeof titleBackgroundState.resizeTitleBackgroundState, 'function', 'title background resize helper가 없음');
  assert.equal(typeof titleBackgroundDraw.drawTitleBackgroundFrame, 'function', 'title background frame draw helper가 없음');
  assert.equal(typeof titleBackgroundRenderer.TitleBackgroundRenderer, 'function', 'TitleBackgroundRenderer가 export되지 않음');
});

await test('콘텐츠 데이터 파일은 설명 helper를 별도 모듈로 분리한다', async () => {
  let accessoryDataHelpers;
  let weaponDataHelpers;

  try {
    accessoryDataHelpers = await import('../src/data/accessoryDataHelpers.js');
    weaponDataHelpers = await import('../src/data/weaponDataHelpers.js');
  } catch (error) {
    throw new Error(`data helper import 실패: ${error.message}`);
  }

  assert.equal(typeof accessoryDataHelpers.buildAccessoryLevelDesc, 'function', 'accessory helper가 없음');
  assert.equal(typeof accessoryDataHelpers.buildAccessoryCurrentDesc, 'function', 'accessory current helper가 없음');
  assert.equal(typeof weaponDataHelpers.getWeaponDataById, 'function', 'weapon helper가 없음');
  assert.equal(accessoryDataSource.includes('export function buildAccessoryLevelDesc'), false, 'accessoryData가 여전히 description helper를 직접 export함');
  assert.equal(weaponDataSource.includes('export function getWeaponDataById'), false, 'weaponData가 여전히 lookup helper를 직접 export함');
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
