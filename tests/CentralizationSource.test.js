import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import {
  projectPathExists,
  readProjectSource,
  stripLineComments,
} from './helpers/sourceInspection.js';
import {
  SESSION_OPTION_DEFAULTS,
  getEffectiveDevicePixelRatio,
} from '../src/state/sessionOptions.js';
import { applySessionOptionsToRuntime } from '../src/app/session/sessionRuntimeApplicationService.js';
import { PAUSE_AUDIO_DEFAULTS } from '../src/ui/pause/pauseAudioControls.js';
import { syncPlaySceneDevicePixelRatio } from '../src/app/play/playSceneFlowService.js';

const gameSource = readProjectSource('../src/core/Game.js');
const gameAppSource = readProjectSource('../src/app/GameApp.js');
const playSceneSource = readProjectSource('../src/scenes/PlayScene.js');
const settingsSceneSource = readProjectSource('../src/scenes/SettingsScene.js');
const metaShopSceneSource = readProjectSource('../src/scenes/MetaShopScene.js');
const titleSceneRuntimeSource = readProjectSource('../src/scenes/title/titleSceneRuntime.js');
const levelUpViewSource = readProjectSource('../src/ui/levelup/LevelUpView.js');
const settingsViewSource = readProjectSource('../src/ui/settings/SettingsView.js');
const settingsViewRuntimeSource = readProjectSource('../src/ui/settings/settingsViewRuntime.js');
const metaShopViewSource = readProjectSource('../src/ui/metashop/MetaShopView.js');
const pauseViewSource = readProjectSource('../src/ui/pause/PauseView.js');
const pauseAudioSource = readProjectSource('../src/ui/pause/pauseAudioControls.js');
const resultViewSource = readProjectSource('../src/ui/result/ResultView.js');
const startLoadoutViewSource = readProjectSource('../src/ui/title/StartLoadoutView.js');
const startLoadoutViewRuntimeSource = readProjectSource('../src/ui/title/startLoadoutViewRuntime.js');
const codexViewSource = readProjectSource('../src/ui/codex/CodexView.js');
const codexSceneSource = readProjectSource('../src/scenes/CodexScene.js');
const codexSceneAppSource = readProjectSource('../src/app/meta/codexSceneApplicationService.js');
const codexHandlerSource = readProjectSource('../src/adapters/play/events/codexEventAdapter.js');
const playContextSource = readProjectSource('../src/core/PlayContext.js');
const collisionSystemSource = readProjectSource('../src/systems/combat/CollisionSystem.js');
const enemyMovementSystemSource = readProjectSource('../src/systems/movement/EnemyMovementSystem.js');
const statusEffectSystemSource = readProjectSource('../src/systems/combat/StatusEffectSystem.js');
const entityUtilsSource = readProjectSource('../src/utils/entityUtils.js');
const bossHudViewSource = readProjectSource('../src/ui/boss/BossHudView.js');
const bossAnnouncementViewSource = readProjectSource('../src/ui/boss/BossAnnouncementView.js');
const accessoryDataSource = readProjectSource('../src/data/accessoryData.js');
const weaponDataSource = readProjectSource('../src/data/weaponData.js');
const accessoryModelSource = readProjectSource('../src/ui/codex/codexAccessoryModel.js');
const pauseLoadoutStatsSource = readProjectSource('../src/ui/pause/pauseLoadoutStatsSections.js');
const createPlayerSource = readProjectSource('../src/entities/createPlayer.js');
const titleLoadoutSource = readProjectSource('../src/scenes/title/titleLoadout.js');
const titleLoadoutFlowSource = readProjectSource('../src/scenes/title/titleLoadoutFlow.js');
const startLoadoutRuntimeSource = readProjectSource('../src/state/startLoadoutRuntime.js');
const worldTickSystemSource = readProjectSource('../src/systems/core/WorldTickSystem.js');
const pendingEventPumpSystemSource = readProjectSource('../src/systems/event/PendingEventPumpSystem.js');
const playUiSource = readProjectSource('../src/scenes/play/PlayUI.js');
const playResultHandlerSource = readProjectSource('../src/scenes/play/PlayResultHandler.js');
const playSceneAppFlowSource = readProjectSource('../src/app/play/playSceneFlowService.js');
const playerSpawnAppSource = readProjectSource('../src/app/play/playerSpawnApplicationService.js');
const levelUpAppFlowSource = readProjectSource('../src/app/play/levelUpFlowService.js');
const startRunAppSource = readProjectSource('../src/app/play/startRunApplicationService.js');
const activeRunAppSource = readProjectSource('../src/app/play/activeRunApplicationService.js');
const settingsAppSource = readProjectSource('../src/app/meta/settingsApplicationService.js');
const settingsRuntimeDepsSource = readProjectSource('../src/scenes/settingsRuntimeDependencies.js');
const metaShopAppSource = readProjectSource('../src/app/meta/metaShopApplicationService.js');
const metaShopSceneAppSource = readProjectSource('../src/app/meta/metaShopSceneApplicationService.js');
const titleLoadoutAppSource = readProjectSource('../src/app/title/titleLoadoutApplicationService.js');
const titleSceneAppSource = readProjectSource('../src/app/title/titleSceneApplicationService.js');
const playContextRuntimeSource = readProjectSource('../src/core/playContextRuntime.js');
const bootstrapBrowserGameSource = readProjectSource('../src/app/bootstrap/bootstrapBrowserGame.js');
const createSceneFactorySource = readProjectSource('../src/app/bootstrap/createSceneFactory.js');
const playRuntimeBuilderSource = readProjectSource('../src/core/PlayRuntimeBuilder.js');
const playRuntimeComposerSource = readProjectSource('../src/scenes/play/playRuntimeComposer.js');
const overlayViewLoadersSource = readProjectSource('../src/scenes/overlayViewLoaders.js');
const coreRuntimeHooksSource = readProjectSource('../src/core/runtimeHooks.js');
const browserRuntimeHooksSource = readProjectSource('../src/adapters/browser/runtimeHooks.js');
const dialogViewLifecycleSource = readProjectSource('../src/ui/shared/dialogViewLifecycle.js');
const touchAdapterSource = readProjectSource('../src/input/TouchAdapter.js');
const stageDataSource = readProjectSource('../src/data/stageData.js');
const sessionMigrationsSource = readProjectSource('../src/state/session/sessionMigrations.js');
const titleSceneSource = readProjectSource('../src/scenes/TitleScene.js');
const titleSceneNavigationSource = readProjectSource('../src/scenes/title/titleSceneNavigation.js');
const titleSceneInputSource = readProjectSource('../src/scenes/title/titleSceneInput.js');
const titleSceneRuntimeStateSource = readProjectSource('../src/scenes/title/titleSceneRuntimeState.js');
const playSceneRuntimeStateSource = readProjectSource('../src/scenes/play/playSceneRuntimeState.js');
const browserGameRuntimeSource = readProjectSource('../src/adapters/browser/gameRuntime.js');
const browserGameInputRuntimeSource = readProjectSource('../src/adapters/browser/gameInputRuntime.js');
const gameCanvasRuntimeSource = readProjectSource('../src/adapters/browser/gameCanvasRuntime.js');
const runtimeHostSource = readProjectSource('../src/core/runtimeHost.js');
const runtimeFeatureFlagsSource = readProjectSource('../src/core/runtimeFeatureFlags.js');
const runtimeEnvSource = readProjectSource('../src/adapters/browser/runtimeEnv.js');
const browserSessionStorageSource = readProjectSource('../src/adapters/browser/session/sessionStorage.js');
const browserSessionStorageDriverSource = readProjectSource('../src/adapters/browser/session/sessionStorageDriver.js');
const browserSessionRepositorySource = readProjectSource('../src/adapters/browser/session/sessionRepository.js');
const browserSessionRecoveryPolicySource = readProjectSource('../src/adapters/browser/session/sessionRecoveryPolicy.js');
const sessionRepositorySource = readProjectSource('../src/state/session/sessionRepository.js');
const sessionRecoveryPolicySource = readProjectSource('../src/state/session/sessionRecoveryPolicy.js');
const sessionStorageSource = readProjectSource('../src/state/session/sessionStorage.js');
const sessionStorageDriverSource = readProjectSource('../src/state/session/sessionStorageDriver.js');
const permanentUpgradeDataSource = readProjectSource('../src/data/permanentUpgradeData.js');

console.log('\n[CentralizationSource]');

test('씬과 UI는 공통 세션 옵션 모듈을 사용한다', () => {
  assert.equal(playSceneSource.includes('applySessionOptionsToRuntime'), true, 'PlayScene이 session runtime application service를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('createSettingsSceneHandlers'), true, 'SettingsScene이 scene-facing settings handler factory를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('updateSessionOptionsAndSave'), false, 'SettingsScene이 세션 저장 facade를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('applySessionOptionsToRuntime'), false, 'SettingsScene이 옵션 적용 helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('saveSettingsSceneOptions'), false, 'SettingsScene이 low-level settings save helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('previewSessionSnapshotImport'), false, 'SettingsScene이 low-level snapshot preview owner를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('previewSettingsSceneImport'), false, 'SettingsScene이 low-level settings preview helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('importSettingsSceneSnapshot'), false, 'SettingsScene이 low-level settings import helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('resetSettingsSceneProgress'), false, 'SettingsScene이 low-level settings reset helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('restoreSettingsSceneBackup'), false, 'SettingsScene이 low-level settings restore helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('inspectSettingsSceneStorage'), false, 'SettingsScene이 low-level settings inspect helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('importSessionSnapshot'), false, 'SettingsScene이 low-level snapshot command owner를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('resetSessionProgress'), false, 'SettingsScene이 low-level reset helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('restoreStoredSessionSnapshot'), false, 'SettingsScene이 low-level restore helper를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('inspectStoredSessionSnapshots'), false, 'SettingsScene이 low-level inspect helper를 직접 import하면 안 됨');
  assert.equal(
    settingsViewSource.includes('SESSION_OPTION_DEFAULTS') || settingsViewRuntimeSource.includes('SESSION_OPTION_DEFAULTS'),
    true,
    'SettingsView runtime이 공통 옵션 기본값을 사용하지 않음',
  );
  assert.equal(pauseViewSource.includes('PAUSE_AUDIO_DEFAULTS'), true, 'PauseView가 공통 pause 오디오 기본값 helper를 사용하지 않음');
  assert.equal(pauseAudioSource.includes('SESSION_OPTION_DEFAULTS'), true, 'Pause audio helper가 공통 옵션 기본값을 사용하지 않음');
  assert.equal(PAUSE_AUDIO_DEFAULTS.masterVolume, SESSION_OPTION_DEFAULTS.masterVolume, 'Pause audio 기본값이 세션 옵션 기본값과 어긋남');

  const runtimeCalls = [];
  applySessionOptionsToRuntime({ useDevicePixelRatio: false, glowEnabled: false }, {
    renderer: {
      setGlowEnabled(value) {
        runtimeCalls.push(['glow', value]);
      },
      setQualityPreset() {},
    },
  });
  assert.deepEqual(runtimeCalls, [['glow', false]]);
  assert.equal(getEffectiveDevicePixelRatio({ useDevicePixelRatio: false }, 2, true), 1);
  assert.equal(
    syncPlaySceneDevicePixelRatio({
      sessionOptions: { useDevicePixelRatio: false },
      currentDpr: 2,
      devicePixelRatio: 2,
    }).dpr,
    1,
    'PlayScene flow helper가 공통 DPR 계산을 사용하지 않음',
  );
});

test('dialog overlay view는 공통 lifecycle helper로 dialog runtime attach/detach를 중앙화한다', () => {
  assert.equal(dialogViewLifecycleSource.includes('replaceDialogRuntime'), true, 'dialog lifecycle helper가 replace helper를 제공하지 않음');
  assert.equal(dialogViewLifecycleSource.includes('disposeDialogRuntime'), true, 'dialog lifecycle helper가 dispose helper를 제공하지 않음');
  assert.equal(levelUpViewSource.includes("from '../shared/dialogViewLifecycle.js'"), true, 'LevelUpView가 공통 dialog lifecycle helper를 사용하지 않음');
  assert.equal(pauseViewSource.includes("from '../shared/dialogViewLifecycle.js'"), true, 'PauseView가 공통 dialog lifecycle helper를 사용하지 않음');
  assert.equal(resultViewSource.includes("from '../shared/dialogViewLifecycle.js'"), true, 'ResultView가 공통 dialog lifecycle helper를 사용하지 않음');
  assert.equal(startLoadoutViewSource.includes("from '../shared/dialogViewLifecycle.js'"), true, 'StartLoadoutView가 공통 dialog lifecycle helper를 사용하지 않음');
  assert.equal(codexViewSource.includes("from '../shared/dialogViewLifecycle.js'"), true, 'CodexView가 공통 dialog lifecycle helper를 사용하지 않음');
  assert.equal(codexSceneSource.includes("dialogViewLifecycle"), false, 'scene가 dialog lifecycle helper를 직접 소유하면 안 됨');
});

test('overlay view runtime은 delegated helper 모듈로 중앙화된다', () => {
  assert.equal(startLoadoutViewSource.includes("from './startLoadoutViewRuntime.js'"), true, 'StartLoadoutView가 runtime helper를 사용하지 않음');
  assert.equal(levelUpViewSource.includes("from './levelUpViewRuntime.js'"), true, 'LevelUpView가 runtime helper를 사용하지 않음');
  assert.equal(resultViewSource.includes("from './resultViewRuntime.js'"), true, 'ResultView가 runtime helper를 사용하지 않음');
  assert.equal(startLoadoutViewRuntimeSource.includes('bindStartLoadoutInteractions'), true, 'StartLoadout runtime helper가 interaction facade를 사용하지 않음');
  assert.equal(startLoadoutViewSource.includes('bindStartLoadoutInteractions('), false, 'StartLoadoutView가 interaction binding을 직접 소유하면 안 됨');
  assert.equal(levelUpViewSource.includes('bindLevelUpCardInteractions('), false, 'LevelUpView가 카드 interaction binding을 직접 소유하면 안 됨');
  assert.equal(resultViewSource.includes("querySelector('.result-restart-btn')?.addEventListener"), false, 'ResultView가 버튼 리스너를 직접 다시 바인딩하면 안 됨');
});

test('gameData 접근은 Game 인스턴스 기준으로 일원화된다', () => {
  assert.equal(
    playSceneSource.includes('bootstrapPlaySceneRuntime') || playSceneSource.includes('this.game.gameData'),
    true,
    'PlayScene이 Game의 gameData 기반 bootstrap 경로를 사용하지 않음',
  );
  assert.equal(playSceneSource.includes('GameDataLoader.clone(this.game.gameData)'), false, 'PlayScene이 여전히 gameData 전체 복제를 수행함');
  assert.equal(playSceneSource.includes('GameDataLoader.loadDefault()'), false, 'PlayScene이 여전히 loadDefault를 직접 호출함');
  assert.equal(codexSceneSource.includes('createCodexSceneApplicationService'), true, 'CodexScene이 scene-facing codex application service를 사용하지 않음');
  assert.equal(codexSceneSource.includes('GameDataLoader.loadDefault()'), false, 'CodexScene이 여전히 loadDefault를 직접 호출함');
});

test('PlayContext는 런타임에서 사용하지 않는 AssetManager를 생성하지 않는다', () => {
  assert.equal(playContextSource.includes('new AssetManager()'), false, 'PlayContext가 사용하지 않는 AssetManager를 생성함');
  assert.equal(playContextSource.includes('ctx.assets'), false, 'PlayContext가 불필요한 assets 슬롯을 유지함');
});

test('Game과 씬 전환은 정적 Scene import와 부트 AssetManager 의존을 줄인다', async () => {
  const sceneLoaders = await import('../src/scenes/sceneLoaders.js');

  assert.equal(typeof sceneLoaders.loadPlaySceneModule, 'function', 'PlayScene loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadTitleSceneModule, 'function', 'TitleScene loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadMetaShopSceneModule, 'function', 'MetaShopScene loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadSettingsSceneModule, 'function', 'SettingsScene loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadCodexSceneModule, 'function', 'CodexScene loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadPauseViewModule, 'function', 'PauseView loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadResultViewModule, 'function', 'ResultView loader helper가 없음');
  assert.equal(typeof sceneLoaders.loadLevelUpViewModule, 'function', 'LevelUpView loader helper가 없음');
  assert.equal(createSceneFactorySource.includes('createSceneFactory'), true, 'bootstrap-owned scene factory helper가 없음');
  assert.equal(bootstrapBrowserGameSource.includes('createSceneFactory'), true, 'browser bootstrap이 scene factory wiring을 소유하지 않음');
  assert.equal(titleSceneNavigationSource.includes('sceneFactory'), false, 'titleSceneNavigation은 scene factory wiring을 소유하면 안 됨');
  assert.equal(titleSceneRuntimeSource.includes('sceneFactory'), true, 'titleSceneRuntime이 injected scene factory를 사용하지 않음');
  assert.equal(titleSceneAppSource.includes('createMetaShopScene'), true, 'title scene application service가 injected title scene callback을 사용하지 않음');
  assert.equal(titleSceneAppSource.includes('createCodexScene'), true, 'title scene application service가 injected codex callback을 사용하지 않음');
  assert.equal(titleSceneAppSource.includes('createSettingsScene'), true, 'title scene application service가 injected settings callback을 사용하지 않음');
  assert.equal(playSceneSource.includes('sceneFactory'), true, 'PlayScene이 injected scene factory를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('sceneFactory'), true, 'SettingsScene이 injected scene factory를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('sceneFactory'), true, 'MetaShopScene이 injected scene factory를 사용하지 않음');
  assert.equal(codexSceneSource.includes('sceneFactory'), true, 'CodexScene이 injected scene factory를 사용하지 않음');
  assert.equal(titleSceneNavigationSource.includes('sceneLoaders'), false, 'titleSceneNavigation이 sceneLoaders facade에 직접 의존하면 안 됨');
  assert.equal(titleSceneRuntimeSource.includes('sceneLoaders'), false, 'titleSceneRuntime이 sceneLoaders facade에 직접 의존하면 안 됨');
  assert.equal(titleLoadoutFlowSource.includes('sceneLoaders'), false, 'titleLoadoutFlow가 sceneLoaders facade에 직접 의존하면 안 됨');
  assert.equal(playSceneSource.includes('sceneLoaders'), false, 'PlayScene이 sceneLoaders facade에 직접 의존하면 안 됨');
  assert.equal(playUiSource.includes("from '../overlayViewLoaders.js'"), true, 'PlayUI가 전용 overlay loader 모듈을 사용하지 않음');
  assert.equal(overlayViewLoadersSource.includes('loadPauseViewModule'), true, 'overlay view loader helper가 PauseView loader를 제공하지 않음');
  assert.equal(overlayViewLoadersSource.includes('loadResultViewModule'), true, 'overlay view loader helper가 ResultView loader를 제공하지 않음');
  assert.equal(overlayViewLoadersSource.includes('loadLevelUpViewModule'), true, 'overlay view loader helper가 LevelUpView loader를 제공하지 않음');

  assert.equal(/import\s+\{\s*TitleScene\s*\}\s+from\s+'\.\/TitleScene\.js'/.test(stripLineComments(playSceneSource)), false, 'PlayScene가 TitleScene을 정적 import함');
  assert.equal(/import\s+\{\s*PlayScene\s*\}\s+from\s+'\.\.\/PlayScene\.js'/.test(stripLineComments(titleSceneRuntimeSource)), false, 'titleSceneRuntime이 PlayScene을 정적 import함');
  assert.equal(/import\s+\{\s*MetaShopScene\s*\}\s+from\s+'\.\.\/MetaShopScene\.js'/.test(stripLineComments(titleSceneRuntimeSource)), false, 'titleSceneRuntime이 MetaShopScene을 정적 import함');
  assert.equal(/import\s+\{\s*MetaShopScene\s*\}\s+from\s+'\.\/MetaShopScene\.js'/.test(stripLineComments(readProjectSource('../src/scenes/TitleScene.js'))), false, 'TitleScene이 MetaShopScene을 정적 import함');
  assert.equal(/import\s+\{\s*TitleScene\s*\}\s+from\s+'\.\/TitleScene\.js'/.test(stripLineComments(settingsSceneSource)), false, 'SettingsScene이 TitleScene을 정적 import함');
  assert.equal(/import\s+\{\s*TitleScene\s*\}\s+from\s+'\.\/TitleScene\.js'/.test(stripLineComments(metaShopSceneSource)), false, 'MetaShopScene이 TitleScene을 정적 import함');

  assert.equal(gameSource.includes('new AssetManager()'), false, 'Game이 부트 시 AssetManager를 생성함');
  assert.equal(gameSource.includes('await this.assets.loadAll()'), false, 'Game이 부트 시 AssetManager.loadAll()에 의존함');
  assert.equal(/import\s+\{\s*PauseView\s*\}\s+from/.test(stripLineComments(playUiSource)), false, 'PlayUI가 PauseView를 정적 import함');
  assert.equal(/import\s+\{\s*ResultView\s*\}\s+from/.test(stripLineComments(playUiSource)), false, 'PlayUI가 ResultView를 정적 import함');
  assert.equal(/import\s+\{\s*LevelUpView\s*\}\s+from/.test(stripLineComments(playUiSource)), false, 'PlayUI가 LevelUpView를 정적 import함');
});

test('PlayScene 부트스트랩과 PlayContext 런타임 생성은 전용 helper로 분리된다', async () => {
  const playSceneBootstrap = await import('../src/scenes/play/playSceneBootstrap.js');
  const playContextRuntime = await import('../src/core/playContextRuntime.js');
  const playRuntimeComposer = await import('../src/scenes/play/playRuntimeComposer.js');

  assert.equal(typeof playSceneBootstrap.bootstrapPlaySceneRuntime, 'function', 'PlayScene bootstrap helper가 없음');
  assert.equal(typeof playSceneBootstrap.createPlaySceneWorldState, 'function', 'PlayScene world bootstrap helper가 없음');
  assert.equal(typeof playRuntimeComposer.buildPlayRuntime, 'function', 'scene-owned play runtime composer가 없음');
  assert.equal(typeof playContextRuntime.createPlayContextRuntimeState, 'function', 'PlayContext runtime helper가 없음');
  assert.equal(typeof playContextRuntime.createPlayContextServices, 'function', 'PlayContext services helper가 없음');
  assert.equal(playSceneSource.includes('bootstrapPlaySceneRuntime'), true, 'PlayScene이 bootstrap helper를 사용하지 않음');
  assert.equal(playContextSource.includes('createPlayContextRuntimeState'), true, 'PlayContext가 runtime helper를 사용하지 않음');
  assert.equal(/from '\.\.\/ui\//.test(stripLineComments(playRuntimeBuilderSource)), false, 'core PlayRuntimeBuilder wrapper가 ui 구현을 직접 import하면 안 됨');
  assert.equal(/from '\.\.\/scenes\//.test(stripLineComments(playRuntimeBuilderSource)), false, 'core PlayRuntimeBuilder wrapper가 scene 구현을 직접 import하면 안 됨');
  assert.equal(playRuntimeComposerSource.includes("from '../../ui/dom/mountUI.js'"), true, 'scene-owned play runtime composer가 UI mount를 소유하지 않음');
});

test('play orchestration helper는 app/play 소유 모듈로 일원화되고 zero-caller wrapper는 제거된다', () => {
  assert.equal(playSceneSource.includes("from '../app/play/playSceneFlowService.js'"), true, 'PlayScene이 app/play flow service를 직접 사용하지 않음');
  assert.equal(projectPathExists('../src/scenes/play/playSceneFlow.js'), false, 'unused playSceneFlow wrapper가 제거되지 않음');
  assert.equal(playerSpawnAppSource.includes('resolvePlayerSpawnState'), true, 'playerSpawn application service가 없음');
  assert.equal(projectPathExists('../src/scenes/play/playerSpawnRuntime.js'), false, 'unused playerSpawnRuntime wrapper가 제거되지 않음');
  assert.equal(levelUpAppFlowSource.includes('decorateLevelUpChoices'), true, 'level up flow app service가 없음');
  assert.equal(projectPathExists('../src/progression/levelUpFlowRuntime.js'), false, 'unused levelUpFlowRuntime wrapper가 제거되지 않음');
  assert.equal(playSceneAppFlowSource.includes('showPlaySceneResult'), true, 'playScene flow app service가 결과 orchestration을 소유하지 않음');
  assert.equal(/processPlayResult\(/.test(playSceneAppFlowSource), false, 'playScene flow app service가 play result domain을 직접 호출하면 안 됨');
  assert.equal(startRunAppSource.includes("from '../../scenes/play/playSceneRuntime.js'"), false, 'startRunApplicationService가 scene runtime helper에 직접 의존하면 안 됨');
});

test('app 계층은 legacy session facade 대신 실제 session write service를 직접 사용한다', () => {
  [
    [settingsAppSource, 'settingsApplicationService'],
    [metaShopAppSource, 'metaShopApplicationService'],
    [activeRunAppSource, 'activeRunApplicationService'],
    [titleLoadoutAppSource, 'titleLoadoutApplicationService'],
  ].forEach(([source, label]) => {
    assert.equal(source.includes("from '../../state/sessionFacade.js'"), false, `${label}가 legacy sessionFacade에 직접 의존하면 안 됨`);
  });
});

test('browser runtime wiring은 bootstrap/play context 경계에서 주입되고 core runtime helper는 browser adapter를 직접 import하지 않는다', () => {
  assert.equal(gameAppSource.includes("from '../scenes/TitleScene.js'"), false, 'GameApp이 기본 초기 Scene에 직접 결합되면 안 됨');
  assert.equal(gameAppSource.includes("from '../core/runtimeHooks.js'"), false, 'GameApp이 core runtimeHooks shim에 직접 의존하면 안 됨');
  assert.equal(gameAppSource.includes("from '../adapters/browser/runtimeHooks.js'"), false, 'GameApp이 browser runtimeHooks adapter를 직접 import하면 안 됨');
  assert.equal(playContextRuntimeSource.includes("from '../adapters/browser/runtimeEnv.js'"), false, 'playContextRuntime이 browser runtime adapter를 직접 import하면 안 됨');
  assert.equal(playContextRuntimeSource.includes("from '../adapters/browser/audioRuntime.js'"), false, 'playContextRuntime이 browser audio adapter를 직접 import하면 안 됨');
  assert.equal(bootstrapBrowserGameSource.includes("from './createSceneFactory.js'"), true, 'browser bootstrap이 scene factory wiring을 직접 소유해야 함');
  assert.equal(bootstrapBrowserGameSource.includes("from '../../adapters/browser/runtimeHooks.js'"), true, 'browser bootstrap이 runtime hook wiring을 소유해야 함');
  assert.equal(coreRuntimeHooksSource.includes("from '../adapters/browser/runtimeHooks.js'"), true, 'core/runtimeHooks는 adapter 소유 모듈을 재노출하는 shim이어야 함');
  assert.equal(browserRuntimeHooksSource.includes('export function registerRuntimeHooks'), true, 'browser runtimeHooks adapter가 실제 구현을 소유하지 않음');
  assert.equal(browserRuntimeHooksSource.includes('._ui'), false, 'browser runtimeHooks adapter가 scene private _ui 슬롯에 직접 의존하면 안 됨');
  assert.equal(browserRuntimeHooksSource.includes('._gameData'), false, 'browser runtimeHooks adapter가 scene private _gameData 슬롯에 직접 의존하면 안 됨');
  assert.equal(browserRuntimeHooksSource.includes('._levelUpController'), false, 'browser runtimeHooks adapter가 scene private _levelUpController 슬롯에 직접 의존하면 안 됨');
  assert.equal(browserRuntimeHooksSource.includes("from './runtimeHooks/runtimeHostRegistration.js'"), true, 'browser runtimeHooks adapter가 host registration helper를 사용하지 않음');
});

test('TitleScene runtime state와 PlayScene browser service는 명시 helper로 중앙화된다', () => {
  assert.equal(titleSceneSource.includes('createTitleSceneRuntimeState'), true, 'TitleScene이 runtime state helper를 사용하지 않음');
  assert.equal(titleSceneNavigationSource.includes('scene._nav'), false, 'titleSceneNavigation이 scene private nav 슬롯에 직접 의존하면 안 됨');
  assert.equal(titleSceneNavigationSource.includes('scene._el'), false, 'titleSceneNavigation이 scene private DOM 슬롯에 직접 의존하면 안 됨');
  assert.equal(titleSceneRuntimeSource.includes('createTitleSceneApplicationService'), true, 'titleSceneRuntime이 scene-facing title service를 조립하지 않음');
  assert.equal(titleSceneRuntimeSource.includes("from '../../app/title/titleSceneApplicationService.js'"), true, 'titleSceneRuntime이 app/title scene service를 사용하지 않음');
  assert.equal(titleSceneNavigationSource.includes('runTitleAction'), false, 'titleSceneNavigation이 action orchestration을 계속 소유하면 안 됨');
  assert.equal(titleSceneInputSource.includes('scene._background'), false, 'titleSceneInput이 scene private background 슬롯에 직접 의존하면 안 됨');
  assert.equal(titleSceneInputSource.includes('scene._onKeyDown'), false, 'titleSceneInput이 listener private slot을 직접 쓰면 안 됨');
  assert.equal(titleLoadoutFlowSource.includes('scene._loadoutView'), false, 'titleLoadoutFlow가 loadout view private slot에 직접 의존하면 안 됨');
  assert.equal(titleSceneRuntimeStateSource.includes('createSceneNavigationGuard'), true, 'title runtime state helper가 navigation guard를 소유하지 않음');
  assert.equal(playSceneSource.includes('createDocumentAccessibilityRuntime()'), false, 'PlayScene이 accessibility runtime을 직접 생성하면 안 됨');
  assert.equal(playSceneSource.includes('window.devicePixelRatio'), false, 'PlayScene에 직접 devicePixelRatio 접근이 남아 있으면 안 됨');
  assert.equal(playSceneSource.includes('createPlaySceneRuntimeState'), true, 'PlayScene이 runtime state helper를 사용하지 않음');
  assert.equal(playSceneRuntimeStateSource.includes('runtime.accessibilityRuntime'), true, 'PlayScene runtime state helper가 injected accessibility runtime을 사용하지 않음');
  assert.equal(playSceneRuntimeStateSource.includes('runtime.devicePixelRatioReader'), true, 'PlayScene runtime state helper가 injected devicePixelRatio reader를 사용하지 않음');
});

test('browser env와 session/data facade는 shared helper를 단일 소스로 사용한다', () => {
  assert.equal(gameCanvasRuntimeSource.includes("from './runtimeHost.js'"), true, 'gameCanvasRuntime이 runtimeHost SSOT를 사용하지 않음');
  assert.equal(gameCanvasRuntimeSource.includes('function getRuntimeHost('), false, 'gameCanvasRuntime에 runtime host 중복 helper가 남아 있음');
  assert.equal(browserGameRuntimeSource.includes("from './gameInputRuntime.js'"), true, 'browser-owned gameRuntime이 adapter-owned gameInputRuntime을 사용하지 않음');
  assert.equal(browserGameInputRuntimeSource.includes("from './runtimeFeatureFlags.js'"), true, 'browser-owned gameInputRuntime이 adapter-owned runtimeFeatureFlags를 사용하지 않음');
  assert.equal(runtimeEnvSource.includes("from './runtimeHost.js'"), true, 'runtimeEnv가 adapter-owned runtime host helper를 사용하지 않음');
  assert.equal(runtimeHostSource.includes("from '../adapters/browser/runtimeHost.js'"), true, 'core runtimeHost wrapper가 adapter owner를 재노출하지 않음');
  assert.equal(runtimeFeatureFlagsSource.includes("from '../adapters/browser/runtimeFeatureFlags.js'"), true, 'core runtimeFeatureFlags wrapper가 adapter owner를 재노출하지 않음');
  assert.equal(runtimeEnvSource.includes('export {\n  getDevicePixelRatio,'), true, 'runtimeEnv가 shared DPR helper를 재노출하지 않음');
  assert.equal(browserSessionRepositorySource.includes("from '../../../state/session/sessionStorageKeys.js'"), true, 'browser-owned sessionRepository가 storage key helper를 사용하지 않음');
  assert.equal(browserSessionRepositorySource.includes("from '../../../state/session/sessionStateCodec.js'"), true, 'browser-owned sessionRepository가 session codec helper를 사용하지 않음');
  assert.equal(browserSessionRepositorySource.includes("from './sessionRecoveryPolicy.js'"), true, 'browser-owned sessionRepository가 adapter-owned recovery policy helper를 사용하지 않음');
  assert.equal(browserSessionRepositorySource.includes("from './sessionStorageDriver.js'"), true, 'browser-owned sessionRepository가 adapter-owned session storage driver helper를 사용하지 않음');
  assert.equal(browserSessionRecoveryPolicySource.includes("from './sessionStorageDriver.js'"), true, 'browser-owned sessionRecoveryPolicy가 adapter-owned session storage driver helper를 사용하지 않음');
  assert.equal(browserSessionStorageSource.includes("from './sessionRepository.js'"), true, 'browser-owned sessionStorage가 adapter-owned sessionRepository를 사용하지 않음');
  assert.equal(sessionRepositorySource.includes("from '../../adapters/browser/session/sessionRepository.js'"), true, 'state sessionRepository wrapper가 browser owner를 재노출하지 않음');
  assert.equal(sessionRecoveryPolicySource.includes("from '../../adapters/browser/session/sessionRecoveryPolicy.js'"), true, 'state sessionRecoveryPolicy wrapper가 browser owner를 재노출하지 않음');
  assert.equal(sessionStorageSource.includes("from '../../adapters/browser/session/sessionStorage.js'"), true, 'state sessionStorage wrapper가 browser owner를 재노출하지 않음');
  assert.equal(sessionStorageDriverSource.includes("from '../../adapters/browser/session/sessionStorageDriver.js'"), true, 'state sessionStorageDriver wrapper가 browser owner를 재노출하지 않음');
  assert.equal(sessionRepositorySource.includes("from './sessionStorageKeys.js'"), false, 'state sessionRepository wrapper가 storage key 구현을 계속 소유하면 안 됨');
  assert.equal(sessionRepositorySource.includes("from './sessionRecoveryPolicy.js'"), false, 'state sessionRepository wrapper가 recovery policy 구현을 계속 소유하면 안 됨');
  assert.equal(sessionRecoveryPolicySource.includes("from './sessionStorageDriver.js'"), false, 'state sessionRecoveryPolicy wrapper가 storage driver 구현을 계속 소유하면 안 됨');
  assert.equal(browserSessionRepositorySource.includes('function buildSessionStorageKeys('), false, 'browser-owned sessionRepository에 storage key 중복 구현이 남아 있음');
  assert.equal(browserSessionRepositorySource.includes('export function parseSessionState('), false, 'browser-owned sessionRepository가 codec 구현을 직접 소유하면 안 됨');
  assert.equal(browserSessionRepositorySource.includes('globalThis.localStorage'), false, 'browser-owned sessionRepository에 localStorage 직접 해석이 남아 있으면 안 됨');
  assert.equal(browserSessionRecoveryPolicySource.includes('globalThis.localStorage'), false, 'browser-owned sessionRecoveryPolicy에 localStorage 직접 해석이 남아 있으면 안 됨');
  assert.equal(browserSessionStorageDriverSource.includes('host?.localStorage'), true, 'browser-owned sessionStorageDriver가 localStorage browser seam을 소유하지 않음');
  assert.equal(permanentUpgradeDataSource.includes("from './permanentUpgradeCatalog.js'"), true, 'permanentUpgradeData facade가 catalog helper를 사용하지 않음');
  assert.equal(permanentUpgradeDataSource.includes("from './permanentUpgradeApplicator.js'"), true, 'permanentUpgradeData facade가 applicator helper를 사용하지 않음');
  assert.equal(permanentUpgradeDataSource.includes('export const permanentUpgradeData = ['), false, 'permanentUpgradeData에 catalog 구현이 남아 있으면 안 됨');
});

test('엔티티 생존 판정은 entityUtils 헬퍼로 통일된다', () => {
  assert.equal(collisionSystemSource.includes('isLive'), true, 'CollisionSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(enemyMovementSystemSource.includes('isLive'), true, 'EnemyMovementSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(statusEffectSystemSource.includes('isLive'), true, 'StatusEffectSystem이 isLive 헬퍼를 사용하지 않음');
  assert.equal(bossHudViewSource.includes('isLive'), true, 'BossHudView가 isLive 헬퍼를 사용하지 않음');
});

test('Codex 메타 초기화는 단일 헬퍼로 중앙화된다', () => {
  assert.equal(codexSceneSource.includes('createCodexSceneApplicationService'), true, 'CodexScene이 scene-facing codex service를 사용하지 않음');
  assert.equal(codexSceneSource.includes('prepareCodexSceneState'), false, 'CodexScene이 low-level codex prepare service를 직접 import하면 안 됨');
  assert.equal(codexSceneAppSource.includes("from './codexApplicationService.js'"), true, 'codex scene application service가 low-level codex service를 사용하지 않음');
  assert.equal(codexSceneAppSource.includes("from '../session/codexSessionStateService.js'"), false, 'codex scene application service가 session owner service를 직접 import하면 안 됨');
  assert.equal(codexSceneSource.includes('ensureCodexMeta'), false, 'CodexScene이 Codex 메타 헬퍼를 직접 import하면 안 됨');
  assert.equal(codexSceneSource.includes('reconcileSessionUnlocks'), false, 'CodexScene이 unlock 보정 helper를 직접 import하면 안 됨');
  assert.equal(codexHandlerSource.includes('ensureCodexMeta'), true, 'codexHandler가 공통 Codex 메타 헬퍼를 사용하지 않음');
});

test('메타 씬은 app 계층 service를 통해 세션 규칙을 호출한다', () => {
  assert.equal(metaShopSceneSource.includes('createMetaShopSceneApplicationService'), true, 'MetaShopScene이 scene-facing meta shop service를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('purchaseMetaShopUpgrade'), false, 'MetaShopScene이 low-level meta shop purchase helper를 직접 import하면 안 됨');
  assert.equal(metaShopSceneSource.includes('purchasePermanentUpgradeAndSave'), false, 'MetaShopScene이 세션 facade를 직접 import하면 안 됨');
  assert.equal(metaShopSceneSource.includes('getPermanentUpgradeById'), false, 'MetaShopScene이 업그레이드 데이터 조회를 직접 수행하면 안 됨');
  assert.equal(metaShopSceneAppSource.includes("from './metaShopApplicationService.js'"), true, 'meta shop scene application service가 low-level meta shop service를 사용하지 않음');
  assert.equal(metaShopSceneAppSource.includes("from '../session/sessionPersistenceService.js'"), false, 'meta shop scene application service가 세션 저장 구현에 직접 결합하면 안 됨');
  assert.equal(metaShopSceneAppSource.includes("from '../../domain/meta/metashop/metaShopPurchaseDomain.js'"), false, 'meta shop scene application service가 purchase domain helper를 직접 import하면 안 됨');
  assert.equal(titleLoadoutFlowSource.includes('createTitleLoadoutApplicationService'), true, 'titleLoadoutFlow가 title loadout application service를 사용하지 않음');
  assert.equal(titleLoadoutFlowSource.includes('setSelectedStartWeaponAndSave'), false, 'titleLoadoutFlow가 session facade를 직접 import하면 안 됨');
  assert.equal(playResultHandlerSource.includes('createPlayResultApplicationService'), true, 'PlayResultHandler가 play result application service를 사용하지 않음');
  assert.equal(playSceneAppFlowSource.includes('processPlayResult('), false, 'playScene flow app service가 play result domain을 직접 호출하면 안 됨');
});

test('SettingsScene은 runtime dependency helper로 앱 서비스 인수를 조립한다', () => {
  const settingsSceneAppSource = readProjectSource('../src/app/session/settingsSceneApplicationService.js');

  assert.equal(settingsRuntimeDepsSource.includes('createSettingsRuntimeDependencies'), true, 'settings runtime deps helper가 없음');
  assert.equal(settingsRuntimeDepsSource.includes('accessibilityRuntimeFactory'), true, 'settings runtime deps helper가 accessibility runtime factory를 주입받지 않음');
  assert.equal(settingsSceneSource.includes("from './settingsRuntimeDependencies.js'"), true, 'SettingsScene이 settings runtime deps helper를 사용하지 않음');
  assert.equal(settingsSceneSource.includes("from '../app/session/settingsSceneApplicationService.js'"), true, 'SettingsScene이 session-owned settings scene service를 사용하지 않음');
  assert.equal(settingsSceneSource.includes("from '../app/meta/settingsApplicationService.js'"), false, 'SettingsScene이 meta facade 경로를 직접 import하면 안 됨');
  assert.equal(settingsSceneSource.includes('createSettingsSceneHandlers'), true, 'SettingsScene이 scene-facing settings handler factory를 사용하지 않음');
  assert.equal(settingsSceneAppSource.includes("from './sessionSnapshotQueryService.js'"), true, 'settings scene application service가 session query owner를 사용하지 않음');
  assert.equal(settingsSceneAppSource.includes("from './sessionSnapshotCommandService.js'"), true, 'settings scene application service가 session command owner를 사용하지 않음');
  assert.equal(settingsSceneSource.includes('createDocumentAccessibilityRuntime()'), false, 'SettingsScene에 accessibility runtime 생성 중복이 남아 있음');
});

test('콘텐츠 helper는 데이터 파일 밖의 전용 helper 모듈로 중앙화된다', () => {
  assert.equal(accessoryDataSource.includes('export function buildAccessoryLevelDesc'), false, 'accessoryData가 설명 helper를 직접 export함');
  assert.equal(accessoryDataSource.includes('export function buildAccessoryCurrentDesc'), false, 'accessoryData가 현재 설명 helper를 직접 export함');
  assert.equal(weaponDataSource.includes('export function getWeaponDataById'), false, 'weaponData가 조회 helper를 직접 export함');
  assert.equal(accessoryModelSource.includes("from '../../app/meta/codexAccessoryQueryService.js'"), false, 'Codex accessory model이 app-layer query service에 직접 결합되면 안 됨');
  assert.equal(accessoryModelSource.includes("from '../../domain/meta/codex/codexAccessoryPresentation.js'"), true, 'Codex accessory model이 stable presentation module을 재노출하지 않음');
  assert.equal(pauseLoadoutStatsSource.includes("from '../../data/accessoryDataHelpers.js'"), true, 'Pause loadout stats가 전용 accessory helper를 사용하지 않음');
  assert.equal(createPlayerSource.includes("from '../data/weaponDataHelpers.js'"), false, 'createPlayer가 여전히 데이터 helper에 직접 결합되어 있음');
  assert.equal(playerSpawnAppSource.includes('resolveStartLoadout('), false, 'playerSpawn application service가 broad start loadout DTO를 그대로 재노출하면 안 됨');
  assert.equal(titleLoadoutSource.includes('resolveStartLoadout('), false, 'titleLoadout이 broad start loadout DTO를 그대로 재노출하면 안 됨');
  assert.equal(titleLoadoutSource.includes("from '../../app/title/titleLoadoutQueryService.js'"), true, 'titleLoadout이 app-layer query service를 재노출하지 않음');
  assert.equal(titleLoadoutSource.includes('resolveStartWeaponSelection'), false, 'titleLoadout facade가 domain helper 구현을 직접 소유하면 안 됨');
  assert.equal(startLoadoutRuntimeSource.includes("from '../data/weaponDataHelpers.js'"), false, 'startLoadoutRuntime이 정적 weaponData helper로 폴백하면 안 됨');
  assert.equal(startLoadoutRuntimeSource.includes("from '../data/unlockAvailability.js'"), false, 'startLoadoutRuntime이 정적 unlock helper를 통해 데이터 주입 경계를 우회하면 안 됨');
  assert.equal(/export function resolveStartLoadout/.test(startLoadoutRuntimeSource), false, 'startLoadoutRuntime이 broad start loadout DTO export를 유지하면 안 됨');
  assert.equal(
    /resolveStartWeaponSelection/.test(startLoadoutRuntimeSource)
    && startLoadoutRuntimeSource.includes("from '../domain/meta/loadout/startLoadoutDomain.js'"),
    true,
    'startLoadoutRuntime이 domain start weapon selection helper를 재노출해야 함',
  );
  assert.equal(/export function getSelectedStartWeaponId/.test(titleLoadoutSource), false, 'titleLoadout에 중복 시작 무기 선택 helper가 남아 있음');
  assert.equal(/pendingRunStartEvents|pendingEventQueue/.test(worldTickSystemSource), false, 'WorldTickSystem에 pending event 주입 책임이 남아 있음');
  assert.equal(/weaponAcquired|accessoryAcquired/.test(pendingEventPumpSystemSource), false, 'PendingEventPumpSystem이 도메인 이벤트명을 하드코딩하면 안 됨');
});

test('ExperienceSystem pickup 판정은 entityUtils helper로 중앙화된다', () => {
  assert.equal(entityUtilsSource.includes('isLivePickup'), true, 'entityUtils가 live pickup predicate를 제공하지 않음');
  assert.equal(entityUtilsSource.includes('getLivePickupsByType'), true, 'entityUtils가 타입별 live pickup helper를 제공하지 않음');
  assert.equal(readProjectSource('../src/systems/progression/ExperienceSystem.js').includes("from '../../utils/entityUtils.js'"), true, 'ExperienceSystem이 pickup helper를 import하지 않음');
});

test('interactive UI runtime과 authoring registry는 전용 helper/module을 통해 중앙화된다', () => {
  assert.equal(settingsViewSource.includes("from './settingsViewRuntime.js'"), true, 'SettingsView가 delegated runtime helper를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('MetaShopView'), true, 'sanity');
  assert.equal(metaShopViewSource.includes("from './metaShopViewRuntime.js'"), true, 'MetaShopView가 delegated runtime helper를 사용하지 않음');
  assert.equal(codexViewSource.includes("from './codexViewRenderState.js'"), true, 'CodexView가 codex shell render-state helper를 사용하지 않음');
  assert.equal(touchAdapterSource.includes("from './touchHudRuntime.js'"), true, 'TouchAdapter가 touch HUD helper를 사용하지 않음');
  assert.equal(stageDataSource.includes("from './stages/ashPlainsStage.js'"), true, 'stageData가 Ash Plains module registry를 사용하지 않음');
  assert.equal(stageDataSource.includes("from './stages/frostHarborStage.js'"), true, 'stageData가 per-stage module registry를 사용하지 않음');
  assert.equal(sessionMigrationsSource.includes("from './migrations/sessionMigrationSteps.js'"), true, 'sessionMigrations가 step registry를 사용하지 않음');
  assert.equal(sessionMigrationsSource.includes('const migrations = ['), false, 'sessionMigrations에 inline migration array가 남아 있음');
  assert.equal(bossHudViewSource.includes("from './bossHudMarkup.js'"), true, 'BossHudView가 markup helper를 사용하지 않음');
  assert.equal(bossHudViewSource.includes("from './bossHudStyles.js'"), true, 'BossHudView가 style helper를 사용하지 않음');
  assert.equal(bossAnnouncementViewSource.includes("from './bossAnnouncementMarkup.js'"), true, 'BossAnnouncementView가 markup helper를 사용하지 않음');
  assert.equal(bossAnnouncementViewSource.includes("from './bossAnnouncementStyles.js'"), true, 'BossAnnouncementView가 style helper를 사용하지 않음');
});

summary();
