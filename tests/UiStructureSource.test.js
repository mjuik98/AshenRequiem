import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pauseViewSource = readFileSync(new URL('../src/ui/pause/PauseView.js', import.meta.url), 'utf8');
const pauseLoadoutContentSource = readFileSync(new URL('../src/ui/pause/pauseLoadoutContent.js', import.meta.url), 'utf8');
const resultViewSource = readFileSync(new URL('../src/ui/result/ResultView.js', import.meta.url), 'utf8');
const codexViewSource = readFileSync(new URL('../src/ui/codex/CodexView.js', import.meta.url), 'utf8');
const pauseLoadoutDetailSectionsSource = readFileSync(new URL('../src/ui/pause/pauseLoadoutDetailSections.js', import.meta.url), 'utf8');
const soundSystemSource = readFileSync(new URL('../src/systems/sound/SoundSystem.js', import.meta.url), 'utf8');
const upgradeSystemSource = readFileSync(new URL('../src/systems/progression/UpgradeSystem.js', import.meta.url), 'utf8');
const codexStylesSource = readFileSync(new URL('../src/ui/codex/codexStyles.js', import.meta.url), 'utf8');
const pauseLoadoutMetaSectionsSource = readFileSync(new URL('../src/ui/pause/pauseLoadoutMetaSections.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../src/core/Game.js', import.meta.url), 'utf8');
const titleSceneSource = readFileSync(new URL('../src/scenes/TitleScene.js', import.meta.url), 'utf8');
const smokeCliTransportSource = readFileSync(new URL('../scripts/browser-smoke/smokeCliTransport.mjs', import.meta.url), 'utf8');
const codexAccessoryTabSource = readFileSync(new URL('../src/ui/codex/codexAccessoryTab.js', import.meta.url), 'utf8');
const pauseStylesSource = readFileSync(new URL('../src/ui/pause/pauseStyles.js', import.meta.url), 'utf8');
const titleBackgroundRendererSource = readFileSync(new URL('../src/scenes/title/TitleBackgroundRenderer.js', import.meta.url), 'utf8');
const accessoryDataSource = readFileSync(new URL('../src/data/accessoryData.js', import.meta.url), 'utf8');
const weaponDataSource = readFileSync(new URL('../src/data/weaponData.js', import.meta.url), 'utf8');

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
  let pauseViewModel;
  let pauseViewLifecycle;
  let pauseAudioController;
  let pauseTooltipBindings;

  try {
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
  assert.match(pauseViewSource, /from '\.\/pauseViewSections\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseTooltipController\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseViewModel\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseViewLifecycle\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseAudioController\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseTooltipBindings\.js'/);
});

await test('PauseView는 shell과 interaction controller로 렌더 조립을 추가 분리한다', async () => {
  let pauseViewShell;
  let pauseViewInteractions;

  try {
    pauseViewShell = await import('../src/ui/pause/pauseViewShell.js');
    pauseViewInteractions = await import('../src/ui/pause/pauseViewInteractions.js');
  } catch (error) {
    throw new Error(`PauseView shell/controller import 실패: ${error.message}`);
  }

  assert.equal(typeof pauseViewShell.renderPauseViewShell, 'function', 'pauseViewShell.renderPauseViewShell이 없음');
  assert.equal(typeof pauseViewInteractions.bindPauseFooterActions, 'function', 'pauseViewInteractions.bindPauseFooterActions가 없음');
  assert.equal(typeof pauseViewInteractions.bindPauseInteractionHandlers, 'function', 'pauseViewInteractions.bindPauseInteractionHandlers가 없음');
  assert.match(pauseViewSource, /from '\.\/pauseViewShell\.js'/);
  assert.match(pauseViewSource, /from '\.\/pauseViewInteractions\.js'/);
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

await test('pause loadout detail는 meta/stats helper로 세부 섹션을 위임한다', async () => {
  let pauseLoadoutMetaSections;
  let pauseLoadoutStatsSections;

  try {
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
  assert.match(pauseLoadoutDetailSectionsSource, /from '\.\/pauseLoadoutMetaSections\.js'/);
  assert.match(pauseLoadoutDetailSectionsSource, /from '\.\/pauseLoadoutStatsSections\.js'/);
});

await test('pause loadout meta는 linked/synergy/evolution helper로 추가 분리된다', async () => {
  let linkedItemsSection;
  let synergySection;
  let evolutionSection;

  try {
    linkedItemsSection = await import('../src/ui/pause/pauseLinkedItemsSection.js');
    synergySection = await import('../src/ui/pause/pauseSynergySection.js');
    evolutionSection = await import('../src/ui/pause/pauseEvolutionSection.js');
  } catch (error) {
    throw new Error(`pause loadout meta helper import 실패: ${error.message}`);
  }

  assert.equal(typeof linkedItemsSection.renderPauseLinkedItemsSection, 'function', 'linked items helper가 없음');
  assert.equal(typeof synergySection.renderPauseSynergySection, 'function', 'synergy helper가 없음');
  assert.equal(typeof evolutionSection.renderPauseEvolutionSection, 'function', 'evolution helper가 없음');
  assert.match(pauseLoadoutMetaSectionsSource, /from '\.\/pauseLinkedItemsSection\.js'/);
  assert.match(pauseLoadoutMetaSectionsSource, /from '\.\/pauseSynergySection\.js'/);
  assert.match(pauseLoadoutMetaSectionsSource, /from '\.\/pauseEvolutionSection\.js'/);
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
  let accessoryModel;
  let accessoryRender;
  let accessoryStyles;
  let codexStyles;
  let codexViewState;
  let codexViewBindings;
  let codexViewShell;
  let codexViewControllers;

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
  assert.match(codexViewSource, /from '\.\/codexStyles\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewState\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewBindings\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewShell\.js'/);
  assert.match(codexViewSource, /from '\.\/codexViewControllers\.js'/);
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

  try {
    upgradeChoicePool = await import('../src/systems/progression/upgradeChoicePool.js');
    upgradeFallbackChoices = await import('../src/systems/progression/upgradeFallbackChoices.js');
    upgradeApplyRuntime = await import('../src/systems/progression/upgradeApplyRuntime.js');
  } catch (error) {
    throw new Error(`upgrade helper import 실패: ${error.message}`);
  }

  assert.equal(typeof upgradeChoicePool.buildUpgradeChoicePool, 'function', 'upgrade choice pool helper가 없음');
  assert.equal(typeof upgradeFallbackChoices.fillWithFallbackChoices, 'function', 'upgrade fallback helper가 없음');
  assert.equal(typeof upgradeApplyRuntime.applyUpgradeRuntime, 'function', 'upgrade apply helper가 없음');
  assert.match(upgradeSystemSource, /from '\.\/upgradeChoicePool\.js'/);
  assert.match(upgradeSystemSource, /from '\.\/upgradeFallbackChoices\.js'/);
  assert.match(upgradeSystemSource, /from '\.\/upgradeApplyRuntime\.js'/);
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

  try {
    smokeCliPaths = await import('../scripts/browser-smoke/smokeCliPaths.mjs');
    smokeCliRunner = await import('../scripts/browser-smoke/smokeCliRunner.mjs');
    smokeCliParsers = await import('../scripts/browser-smoke/smokeCliParsers.mjs');
    smokeSessionTransport = await import('../scripts/browser-smoke/smokeSessionTransport.mjs');
  } catch (error) {
    throw new Error(`smoke transport helper import 실패: ${error.message}`);
  }

  assert.equal(typeof smokeCliPaths.resolveWindowsPlaywrightCliPath, 'function', 'smoke cli path helper가 없음');
  assert.equal(typeof smokeCliPaths.buildPlaywrightInvocation, 'function', 'smoke cli invocation helper가 없음');
  assert.equal(typeof smokeCliRunner.runPlaywrightCliCommand, 'function', 'smoke cli runner helper가 없음');
  assert.equal(typeof smokeCliParsers.parseEvalResult, 'function', 'smoke cli parser helper가 없음');
  assert.equal(typeof smokeCliParsers.parseSnapshotPath, 'function', 'smoke cli snapshot parser가 없음');
  assert.equal(typeof smokeSessionTransport.createPlaywrightSessionTransport, 'function', 'smoke session transport helper가 없음');
  assert.match(smokeCliTransportSource, /from '\.\/smokeCliPaths\.mjs'/);
  assert.match(smokeCliTransportSource, /from '\.\/smokeCliRunner\.mjs'/);
  assert.match(smokeCliTransportSource, /from '\.\/smokeCliParsers\.mjs'/);
  assert.match(smokeCliTransportSource, /from '\.\/smokeSessionTransport\.mjs'/);
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

await test('TitleScene는 상태/종료 처리 helper를 별도 모듈로 위임한다', async () => {
  let titleSceneStatus;

  try {
    titleSceneStatus = await import('../src/scenes/title/titleSceneStatus.js');
  } catch (error) {
    throw new Error(`titleSceneStatus import 실패: ${error.message}`);
  }

  assert.equal(typeof titleSceneStatus.createTitleStatusController, 'function', 'createTitleStatusController가 없음');
  assert.equal(typeof titleSceneStatus.attemptWindowClose, 'function', 'attemptWindowClose가 없음');
  assert.match(titleSceneSource, /from '\.\/title\/titleSceneStatus\.js'/);
});

await test('TitleBackgroundRenderer는 state builder와 draw pass helper로 분리된다', async () => {
  let titleBackgroundState;
  let titleBackgroundDraw;

  try {
    titleBackgroundState = await import('../src/scenes/title/titleBackgroundState.js');
    titleBackgroundDraw = await import('../src/scenes/title/titleBackgroundDraw.js');
  } catch (error) {
    throw new Error(`title background helper import 실패: ${error.message}`);
  }

  assert.equal(typeof titleBackgroundState.createTitleBackgroundState, 'function', 'title background state helper가 없음');
  assert.equal(typeof titleBackgroundState.resizeTitleBackgroundState, 'function', 'title background resize helper가 없음');
  assert.equal(typeof titleBackgroundDraw.drawTitleBackgroundFrame, 'function', 'title background frame draw helper가 없음');
  assert.match(titleBackgroundRendererSource, /from '\.\/titleBackgroundState\.js'/);
  assert.match(titleBackgroundRendererSource, /from '\.\/titleBackgroundDraw\.js'/);
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
