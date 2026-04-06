# Current Architecture Snapshot

Last verified against code: 2026-04-05

이 문서는 현재 코드베이스의 구현 사실을 기록한다. 지속적으로 강제할 설계 규칙은 `AGENTS.md`를 따르고, 새 코드 배치/owner 판단은 `docs/module-map.md`를 기준으로 한다.

## Current Product Surface

- 런타임 엔트리포인트는 `src/main.js`이며 브라우저 부트스트랩은 `src/app/bootstrap/bootstrapBrowserGame.js`를 통해 `BrowserGameShell`, `GameApp`, `sceneFactory`를 조합한다. 기본 초기 씬과 이후 scene transition 생성은 모두 이 bootstrap 경계가 주입한 `game.sceneFactory`가 소유한다.
- `src/app/bootstrap/createSceneFactory.js`는 `TitleScene`만 정적 import하고 `PlayScene`, `MetaShopScene`, `SettingsScene`, `CodexScene`은 dynamic import로 생성한다. 초기 entry chunk는 title shell 위주로 유지하고, 전투/메타/UI surface는 실제 진입 시점까지 지연 로드된다.
- `GameApp`은 더 이상 browser runtime hook 구현을 직접 import하지 않는다. debug/runtime hook 등록 해제는 `bootstrapBrowserGame()`이 `src/adapters/browser/runtimeHooks.js`를 주입해 소유하고, runtime hook은 `PlayScene.getDebugSurface()` explicit contract를 통해 UI/controller snapshot만 읽는다. `PlayScene` 내부 bootstrap state, overlay controller, debug surface 조립은 `src/scenes/play/playSceneRuntimeState.js`가 담당한다.
- `src/scenes/sceneLoaders.js`는 더 이상 내부 runtime의 scene transition SSOT가 아니다. scene 구현은 injected `sceneFactory`를 사용하고, `sceneLoaders.js`는 테스트/호환용 facade만 유지한다. `PlayUI`의 lazy overlay import는 `src/scenes/overlayViewLoaders.js`가 별도 소유한다.
- `src/core/Game.js`는 더 이상 메인 엔트리의 직접 부트스트랩이 아니라 호환 facade 역할만 맡는다.
- `BrowserGameShell`은 legacy `game._resizeCanvas` shim과 함께 public `game.runtimeCapabilities.resizeCanvas` contract를 주입한다. Settings 계층은 이 공개 capability를 우선 사용하고, legacy shim은 호환 경로로만 유지한다.
- 타이틀 화면에서는 게임 시작, 영구 업그레이드 상점, 도감, 설정으로 진입할 수 있다.
- 타이틀의 시작 로드아웃 모달에서는 시작 무기, 시작 장신구, archetype, risk relic, 스테이지, 시드, Ascension 난이도 레벨을 함께 선택한다.
- 시작 로드아웃 모달은 접힌 `고급 설정` 요약 disclosure를 통해 Ascension/Stage/Archetype 등의 확장 런 옵션을 관리한다.
- 세션은 `localStorage`의 `ashenRequiem_session` 키에 저장되며, 동일 payload를 backup 슬롯에도 기록한다. primary save가 깨지면 backup으로 복구하고 손상본은 `ashenRequiem_session_corrupt`에 보존한다. 저장소 키/codec는 `src/state/session/*`가 유지하지만, browser-backed 저장/복구/저장소 구현 소유권은 `src/adapters/browser/session/sessionStorageDriver.js`, `sessionRecoveryPolicy.js`, `sessionRepository.js`, `sessionStorage.js`로 이동했다. 기존 `src/state/session/*` 경로는 facade만 유지한다.
- 세션 메타 기본값/정규화와 unlock progress 보정의 실소유권은 `src/state/session/sessionMetaState.js`, `src/state/session/sessionUnlockState.js`로 이동했다. 기존 `src/state/sessionMeta.js`는 테스트/기존 import 호환용 thin wrapper만 유지한다.
- 메타 씬(`SettingsScene`, `MetaShopScene`, `CodexScene`)은 세션/콘텐츠 규칙을 직접 조합하지 않고 `src/app/meta/*ApplicationService.js`를 통해 호출한다.
- 타이틀/플레이 오버레이와 타이틀 하위 서브스크린은 공통 keyboard dialog contract를 공유한다. `src/ui/shared/dialogRuntime.js`가 panel focus, Tab 순환, Escape dismiss, 이전 포커스 복원을 맡고 각 view는 panel selector와 close callback만 주입한다.
- `StartLoadoutView`, `LevelUpView`, `ResultView`의 interactive runtime은 각각 `startLoadoutViewRuntime.js`, `levelUpViewRuntime.js`, `resultViewRuntime.js`가 delegated listener와 rerender orchestration을 소유한다. view class는 state, markup rerender, dialog lifecycle만 유지한다.
- 설정 화면은 옵션 저장 외에도 세션 snapshot export/import/reset UX를 제공하며, 실제 직렬화/파싱과 슬롯 inspection/restore는 `src/adapters/browser/session/sessionRepository.js` owner를 통해 수행된다. public orchestration은 `src/app/meta/settingsApplicationService.js`가 유지하되, 실소유권은 `src/app/session/sessionSnapshotQueryService.js`, `sessionSnapshotCommandService.js`, `sessionSnapshotPreview.js`, `sessionSnapshotCodec.js`, `sessionSnapshotMutationService.js`로 이동했다.
- `settingsApplicationService`는 공개 facade만 유지하고, `src/app/meta/settingsQueryService.js`, `settingsCommandService.js`는 `src/app/session/*` owner service를 thin re-export한다.
- codex scene 진입 전 세션 보정 실소유권은 `src/app/session/codexSessionStateService.js`로 이동했다. `src/app/meta/codexApplicationService.js`는 session owner service를 호출해 준비된 `session`과 `gameData`만 scene에 전달한다.
- meta shop purchase의 검증/비용 계산 실소유권은 `src/domain/meta/metashop/metaShopPurchaseDomain.js`로 이동했다. `src/app/meta/metaShopApplicationService.js`는 injected catalog를 domain helper에 전달하고, 성공 시에만 `sessionPersistenceService`를 통해 저장을 조합한다.
- `SettingsView`와 `MetaShopView`의 interactive runtime은 각각 `settingsViewRuntime.js`, `metaShopViewRuntime.js`가 root-level delegated listener로 소유한다. view class는 dialog lifecycle과 state만 유지하고, shell/section partial update는 `settingsViewRenderState.js`, `metaShopViewRenderState.js`가 담당한다.
- 세션 저장소 경계는 이제 primary/backup/corrupt 슬롯 inspection과 backup restore helper까지 제공한다. Settings 데이터 탭은 이 저장소 요약과 import preview diff를 호출해 운영 중 복구 UX를 제공한다.
- 플레이 시작 조립은 `src/app/play/startRunApplicationService.js`가 world 생성, player spawn state 해석, 영구 업그레이드 적용, 런 초기화, run-start event 큐잉을 한 경로로 수행한다. 런 초기화와 run-start event 큐잉의 세부 helper 소유권은 `src/app/play/runSessionStateService.js`에 있다.
- gameplay spawn request helper와 synergy tracking state의 실소유권은 `src/domain/play/state/spawnRequest.js`, `src/domain/play/state/createSynergyState.js`로 이동했다. `src/state/*` 루트에는 이 helper를 더 두지 않는다.
- 플레이 런타임은 `EncounterDirectorSystem`이 stage encounter timeline과 boss schedule을 읽어 `world.run.encounterState`를 갱신하고, `SpawnSystem`/`StageRuntimeSystem`/HUD가 이를 소비한다.
- 런 시작 시 guidance snapshot은 `src/domain/play/encounter/runGuidanceDomain.js`가 계산하고 `startRunApplicationService`가 `world.run.guidance.primaryObjective`로 주입한다.
- 런 guidance snapshot은 이제 `primaryObjective`, `stageDirective`뿐 아니라 시작 무기 기반 `recommendedBuild` 경로와 rationale 배열도 함께 계산한다. 레벨업 오버레이는 이 guidance를 읽어 추천 무기/장신구/진화 카드에 전용 priority hint를 붙인다.
- HUD는 기존 레벨/시간/골드 외에 현재 위협 chip, 다음 boss ETA, primary objective chip을 함께 노출한다.
- HUD guidance는 `위협 / 보스 / 스테이지 규칙 / 목표` chip과 단일 contextual note로 재정렬돼, 요약 문구는 chip 내부가 아니라 note row에 배치된다.
- stage catalog는 `assets.backgroundKey`, `assets.bossCueKey`, `assets.stageFxKey`를 통해 first-class asset manifest key를 참조하며, `GameDataLoader.loadDefault()`는 `assetManifest`도 함께 적재한다.
- asset manifest entry는 이제 stable key 외에도 `preloadGroup`, `budgetTier`, `estimatedBytes`, `qualityPolicy`, `sourceType` shipping metadata를 가진다. stage background image asset은 `files.baseSrc/overlaySrc/overlayAlpha` metadata도 함께 소유하며, `gameDataValidation`은 잘못된 preload/budget/quality/source policy와 background file metadata를 함께 검증한다.
- `GameApp.start()`의 startup validation은 이제 `upgradeData`, `weaponData`, `waveData`뿐 아니라 실제 shipped runtime catalog인 `stageData`, `assetManifest`까지 함께 전달한다. `src/utils/validateGameData.js`는 이 전체 catalog 세트를 `validateCoreGameData()`로 위임한다.
- stage background는 더 이상 `CanvasRenderer` 내부의 단순 fill/grid만으로 고정되지 않는다. checked-in `stageData.background`는 `mode/tileSize/palette/layers` 토큰과 `assets.backgroundKey`만 유지하고, `GameDataLoader`가 asset manifest file metadata를 hydrate해 runtime `background.images` shape를 만든다. `CanvasRenderer`는 `src/renderer/background/createStageBackgroundRenderer.js` runtime에 seamless tile 렌더링을 위임한 뒤 legacy grid 경로로만 폴백한다.
- 투사체/이펙트 렌더러는 `src/renderer/sprites/vfxSpriteManifest.js`와 `src/renderer/sprites/vfxSpriteRuntime.js`를 통해 raster sprite source를 lazy-load한다. shared atlas(`projectiles`, `effects`)와 standalone 4x4 sheet source를 함께 지원하며, `magic_bolt` / `arcane_nova` / `piercing_spear` / `astral_pike` / `holy_bolt` / `holy_bolt_upgrade` / `ice_bolt` / `ice_bolt_upgrade`는 무기별 animated projectile/effect sequence를 우선 사용한다. source가 준비되지 않았거나 정의되지 않은 behavior/effect는 기존 vector draw registry 경로로 폴백한다.
- combat VFX image source는 `public/assets/vfx/projectiles-atlas.png`, `public/assets/vfx/effects-atlas.png`, `public/assets/vfx/fire_bolt.png`, `public/assets/vfx/fire_bolt_upgrade.png`, `public/assets/vfx/holy_bolt.png`, `public/assets/vfx/holy_bolt_upgrade.png`, `public/assets/vfx/ice_bolt.png`, `public/assets/vfx/ice_bolt_upgrade.png`에 위치하며 `assetManifest`에서 atlas key와 standalone sprite-sheet key로 관리된다.
- browser smoke는 이제 combat pressure 외에도 `touch_hud_mobile`, `daily_seed_run` extended 시나리오를 포함하며, authoring용 `npm run encounter:report`는 wave/stage/boss pacing뿐 아니라 pressure/reward/gimmick metrics까지 출력한다.
- browser smoke의 title loadout/accessibility 시나리오는 advanced summary disclosure와 dialog 접근성을 함께 확인하고, combat pressure 시나리오는 stage directive chip과 contextual note를, touch/daily 시나리오는 touch HUD forcing과 daily seed 경로를 점검한다.

## Generated Scene Snapshot

Detected top-level scene modules in `src/scenes/`:

- `CodexScene`
- `MetaShopScene`
- `PlayScene`
- `SettingsScene`
- `TitleScene`

## Play Pipeline

`PlayContext.buildPipeline()`은 `PipelineBuilder`를 통해 아래 순서로 시스템을 등록한다.

## Generated Play Pipeline Snapshot

| Priority | System | Source |
|----------|--------|--------|
| 0 | WorldTickSystem | `SYSTEM_REGISTRY` |
| 5 | PendingEventPumpSystem | `SYSTEM_REGISTRY` |
| 8 | EncounterDirectorSystem | `SYSTEM_REGISTRY` |
| 10 | SpawnSystem | `PipelineBuilder factory` |
| 12 | StageRuntimeSystem | `SYSTEM_REGISTRY` |
| 20 | PlayerMovementSystem | `SYSTEM_REGISTRY` |
| 30 | EnemyMovementSystem | `PipelineBuilder factory` |
| 35 | EliteBehaviorSystem | `SYSTEM_REGISTRY` |
| 40 | WeaponSystem | `SYSTEM_REGISTRY` |
| 50 | ProjectileSystem | `SYSTEM_REGISTRY` |
| 60 | CollisionSystem | `PipelineBuilder factory` |
| 65 | StatusEffectSystem | `SYSTEM_REGISTRY` |
| 70 | DamageSystem | `SYSTEM_REGISTRY` |
| 75 | BossPhaseSystem | `SYSTEM_REGISTRY` |
| 80 | DeathSystem | `SYSTEM_REGISTRY` |
| 90 | ExperienceSystem | `SYSTEM_REGISTRY` |
| 95 | SynergySystem | `PipelineBuilder factory` |
| 96 | WeaponEvolutionSystem | `SYSTEM_REGISTRY` |
| 100 | LevelSystem | `SYSTEM_REGISTRY` |
| 101 | UpgradeApplySystem | `SYSTEM_REGISTRY` |
| 105 | EventRegistry.asSystem() | `PipelineBuilder registry instance` |
| 108 | EffectTickSystem | `SYSTEM_REGISTRY` |
| 110 | FlushSystem | `SYSTEM_REGISTRY` |
| 120 | CameraSystem | `SYSTEM_REGISTRY` |
| 125 | CullingSystem | `PipelineBuilder factory` |
| 130 | RenderSystem | `SYSTEM_REGISTRY` |

정책:

- `SYSTEM_REGISTRY`에는 상태 없는 시스템만 들어간다.
- 상태를 가진 시스템은 `PipelineBuilder`가 팩토리로 생성한다.
- 이벤트 큐는 `WorldTickSystem`이 프레임 시작 시 `EVENT_TYPES` 기준으로 초기화한다.

## Current Session And Event Flow

- 전투 시스템은 세션을 직접 수정하지 않는다.
- `currencyEarned` 이벤트는 `src/adapters/play/events/currencyEventAdapter.js`가 받아 `earnCurrency(session, amount)`를 호출하고, 동시에 `world.run.runCurrencyEarned`도 누적한다.
- 런 시작 시 큐잉된 이벤트는 `world.progression.pendingEventQueue`에 generic envelope(`{ type, payload }`) 형태로 저장되고, `PendingEventPumpSystem`이 첫 플레이 프레임 시작에 해당 이벤트 큐로 주입한다.
- 도감 관련 메타(`enemyKills`, `enemiesEncountered`, `killedBosses`, `weaponsUsedAll`, `accessoriesOwnedAll`, `evolvedWeapons`)는 `src/adapters/play/events/codexEventAdapter.js`가 이벤트 기반으로 갱신한다.
- 런 종료 결과 요약 계산은 `src/domain/meta/progression/playResultDomain.js`의 순수 helper가 담당하고, 세션 커밋은 `src/app/play/playResultSessionService.js` / `src/app/play/playResultApplicationService.js`가 소유한다. `PlayResultHandler`는 호환 wrapper로 유지된다.
- 장기 메타 목표 조합은 `src/domain/meta/progression/metaGoalDomain.js`가 소유하고, `unlock / meta_upgrade / codex / daily` roadmap을 결과 화면 `nextGoals`, Codex 기록 탭 `focusGoals`, Meta Shop toolbar `roadmapGoal`에 공통 공급한다.
- 데일리 시드 승리 보상은 `src/domain/meta/progression/dailyChallengeDomain.js`가 판정하고, 첫 승리 reward claim은 `session.meta.claimedDailyRewardSeeds`에 기록된다. 결과 화면이 이 통계와 보상 상태를 노출한다.
- daily meta는 `session.meta.dailyChallengeStreak`, `bestDailyChallengeStreak`, `lastDailyRewardSeed`를 함께 유지한다. reward amount는 ascension + streak bonus + milestone bonus를 반영한다.
- 결과 추천은 `src/domain/meta/progression/runRecommendationDomain.js`가 소유하고, `runAnalyticsDomain`의 stage weakness / archetype record / death cause 요약을 기반으로 생성된다.
- 결과 요약은 `deathRecap`을 함께 계산해 마지막 타격 원인, 종료 시점, 추천 조정의 첫 액션을 한 블록으로 묶어 ResultView에 노출한다.
- 씬/UI 계층에서의 세션 저장 facade는 `sessionFacade`가 호환 경로로 유지되지만, `src/app/*` 내부는 이 facade를 직접 import하지 않는다. 실제 쓰기 소유권은 `src/app/session/sessionPersistenceService.js`와 `src/app/session/loadoutSelectionWriteService.js`에 있다.
- `SettingsScene`는 더 이상 `src/app/meta/settingsApplicationService.js`를 직접 보지 않고, scene-facing entrypoint인 `src/app/session/settingsSceneApplicationService.js`를 통해 settings snapshot/save/import/reset use-case를 조립한다. 기존 `src/app/meta/settingsApplicationService.js`는 thin compatibility facade만 유지한다.
- 시작 무기 후보/선택 해석 facade는 `src/domain/meta/loadout/startLoadoutDomain.js`가 유지하되, 내부 책임은 `startLoadoutCatalog.js`, `startLoadoutUnlocks.js`, `startLoadoutSelection.js`, `startLoadoutPlayerStart.js`, `startLoadoutPresentation.js`로 분리됐다. `src/state/startLoadoutRuntime.js`는 호환 re-export 경로를 유지한다. 실제 플레이어 스폰 패키지 조립은 `src/app/play/playerSpawnApplicationService.js`의 `resolvePlayerSpawnState()`가 담당한다.
- 시작 무기 선택 저장은 `setSelectedStartWeaponAndSave(..., gameData)`가 내부 정규화 후 `{ saved, selectedWeaponId }` 결과와 함께 수행한다.
- Ascension 선택 저장은 `setSelectedAscensionAndSave(session, level)`가 담당하며, 런 시작 시 `world.run.ascensionLevel` / `world.run.ascension` snapshot으로 주입된다.
- 타이틀 시작 무기 선택 UI는 `buildTitleLoadoutConfig()`의 `canStart` 상태를 받아, 후보가 없으면 시작 버튼을 비활성화한다. 실제 저장과 PlayScene 생성 orchestration은 `src/app/title/titleLoadoutApplicationService.js`가 담당하되, 입력 정규화/세션 commit/result shaping 구현은 `titleRunOptions.js`, `titleRunSelectionCommit.js`, `titleRunResult.js` helper로 분리됐다.
- `TitleScene`는 `titleSceneRuntimeState.js`가 만든 runtime state 객체를 소유한다. `titleSceneRuntime`, `titleSceneNavigation`, `titleSceneInput`, `titleLoadoutFlow`는 이 명시 state를 통해 DOM/background/loadout/nav/listener를 읽고 쓴다. 타이틀 shell DOM 자체는 `titleSceneShell.js`가 재사용 가능한 root + cached refs(`canvas`, `flash`, `live`)로 유지한다.
- 플레이어 영구 업그레이드 카탈로그와 적용 로직은 `permanentUpgradeCatalog.js`, `permanentUpgradeApplicator.js`로 분해되고, `permanentUpgradeData.js`는 lookup/apply facade만 유지한다. applicator는 최종 무기 데미지와 HP 보정까지 단일 경로로 담당한다.
- 런 world runtime slice는 `replayTrace`, `replayFrame`, `maxReplaySamples`를 유지한다. `GameApp.tick()`이 최근 입력 snapshot을 ring buffer로 기록해 runtime debug snapshot과 authoring overlay가 이를 소비한다.
- 해금 진행은 `computeUnlockProgress()` / `applyUnlockProgress()`로 분리되고, 실소유권은 `src/domain/meta/progression/unlockProgressRuntime.js`, `unlockEvaluator.js`에 있다. session 보정과 기본 `unlockData` 결합은 `src/state/session/sessionUnlockState.js`가 담당하고, 런 종료 세션 커밋은 이 helper를 재사용한다.
- gameplay progression helper(`accessoryEffectRuntime`, `synergyRuntime`, `upgradeChoicePool`, `upgradeChoiceRuntime`, `upgradeFallbackChoices`)의 실소유권은 `src/domain/play/progression/`로 이동했다. 레벨업 오버레이 orchestration은 `src/app/play/levelUpFlowService.js`가 직접 소유한다.
- 월드 상태 생성은 `src/domain/play/state/createPlayWorld.js`가 소유하고, `src/state/createWorld.js`는 호환 re-export 경로를 유지한다. 런타임 소유권은 `entities`, `queues`, `presentation`, `runtime`, `run`, `progression` 하위 상태로 고정되며 production world에는 기존 top-level alias를 더 이상 두지 않는다.
- gameplay nondeterministic RNG bootstrap은 `createPlayWorld()`가 `createMathRng()`를 통해 명시적으로 주입한다. 공용 `createRng()`는 더 이상 암묵적 `Math.random()` 기본값을 갖지 않는다.
- 플레이 이벤트 SSOT는 `src/data/constants/eventContracts.js`이며, `src/data/constants/events.js`는 여기서 파생된 `EVENT_TYPES`와 contract 조회 API만 재노출한다.
- `PlayUI`, `LevelSystem`, `DeathSystem`, `RenderSystem`, `src/adapters/browser/runtimeHooks.js`, `levelUpFlowService` 등 핵심 허브는 `world.entities/*`, `world.run/*`, `world.progression/*`, `world.queues/*`, `world.presentation/*`, `world.runtime/*` ownership 경로를 우선 사용한다.
- `RenderSystem`은 browser runtime adapter를 직접 import하지 않고, `PlayContext` 서비스로 주입된 `nowSeconds()` clock을 사용한다. browser clock/audio binding은 `src/adapters/browser/playRuntimeServices.js`가 만들고, `src/app/bootstrap/bootstrapBrowserGame.js`가 이를 `game.playRuntimeServices`로 조립한 뒤 `src/scenes/play/playSceneBootstrap.js` → `src/scenes/play/playRuntimeComposer.js` → `src/core/PlayRuntimeBuilder.js` → `PlayContext.create()` 경로로 주입한다.
- `PlayScene`는 더 이상 `window.devicePixelRatio`나 `createDocumentAccessibilityRuntime()`를 직접 읽지 않는다. browser DPR reader와 accessibility runtime은 bootstrap이 만든 `game.playRuntimeServices`를 통해 주입되고, scene는 `playSceneRuntimeState`를 통해 injected service만 소비한다.
- browser shell은 `BrowserGameShell`이 `game.runtimeHost`, `game.accessibilityRuntime`를 조립해 소유한다. `SettingsScene`, `TitleScene`, `KeyboardAdapter`, `playSceneBootstrap`는 이 injected browser surface를 재사용하고 각자 browser global을 직접 만들지 않는다.
- 플레이 런타임의 concrete UI 조립(`mountUI`, `PlayUI`, pipeline profiling default`)은 이제 `src/scenes/play/playRuntimeComposer.js`가 소유하고, `src/core/PlayRuntimeBuilder.js`는 scene/bootstrap 경계가 주입한 의존성만 소비하는 순수 builder 역할로 축소됐다.
- 세션 접근성 옵션(`reducedMotion`, `highVisibilityHud`, `largeText`)은 `src/adapters/browser/accessibilityRuntime.js`가 document root class 토글을 소유하고, scene/runtime은 `applySessionOptionsToRuntime(..., { accessibilityRuntime })` 경로를 통해 injected runtime만 호출한다.
- 세션 옵션의 기본값/정규화/DPR 계산 SSOT는 `src/state/sessionOptions.js`에 남아 있고, 실제 runtime 반영(`soundSystem`, renderer, accessibility, key binding`)은 `src/app/session/sessionRuntimeApplicationService.js`가 소유한다.
- viewport/DPR host 해석 SSOT는 `src/adapters/browser/runtimeHost.js`가 소유한다. `runtimeEnv.js`, `gameCanvasRuntime.js`, `titleBackgroundState.js`가 이 helper를 공유해 browser adapter 중복 구현을 피하고, `src/core/runtimeHost.js`는 테스트/기존 import 호환용 re-export shim만 유지한다. `cameraCull.js`는 browser host를 직접 보지 않고 camera metadata + `GameConfig` fallback만 사용한다.
- 세션 입력 옵션(`options.keyBindings`)은 `src/input/keyBindings.js`가 정규화하고, `KeyboardAdapter`와 `TitleScene` confirm 입력이 같은 binding 규칙을 공유한다. `KeyboardAdapter`는 `createGameInput()`이 주입한 runtime host에만 listener를 붙이고, settings save/import/reset/restore는 `input.configureKeyBindings()`를 통해 즉시 반영된다.
- 입력 runtime은 `KeyboardAdapter` 외에 capability-gated `GamepadAdapter`를 함께 등록한다. gamepad의 left stick/d-pad와 confirm/pause/debug 버튼은 같은 `InputState.actions` contract로 합류한다.
- touch 입력은 `TouchAdapter`가 좌측 virtual joystick HUD와 우측 pause 버튼 overlay를 함께 제공한다. HUD DOM lifecycle과 knob sync는 `src/input/touchHudRuntime.js`가 소유하고, adapter는 입력 정규화와 action bridge만 담당한다. 이동은 기존 `moveX/moveY`, pause는 `actions.add('pause')` 경로로 합류한다.
- touch HUD는 `MOVE` / `AIM / TAP` guide label, clamped joystick knob, pause action button을 함께 가지며 모바일 시각 피드백을 직접 제공한다.
- browser debug hook 구현은 `src/adapters/browser/runtimeHooks.js`가 소유하고, `src/core/runtimeHooks.js`는 테스트/기존 import 호환을 위한 re-export shim만 유지한다. 내부 책임은 `runtimeDebugSurface`, `runtimeSnapshot`, `runtimeOverlayHelpers`, `runtimeScenarioHelpers`, `runtimeHostRegistration` helper 모듈로 분리됐다.
- browser debug hook은 pause/levelup/result helper 외에도 `openBossReadabilityOverlay()`를 제공해 강제 boss HUD 상태를 smoke/debug에서 열 수 있다.
- browser debug hook은 `getAuthoringSnapshot()`과 `openEncounterAuthoringOverlay()`도 제공한다. authoring snapshot은 current beat, stage modifier, counterplay, replay trace tail을 담는다.
- `SoundSystem`도 browser global을 직접 읽지 않는다. `soundSfxController`는 주입된 `_nowSeconds()`만 사용한다.
- `CodexView`는 `codexViewRenderState.js`가 stable shell(`progress pill`, `tabs`, `summary`, `content`)을 유지하고, `codexViewRuntime.js`가 root-level delegated tab/back interaction을 소유한다. 개별 enemy/weapon/accessory panel만 controller helper가 다시 렌더한다.
- boss overlay DOM surface는 `BossHudView`, `BossAnnouncementView`가 얇은 lifecycle만 맡고, 실제 markup/style는 `bossHudMarkup`, `bossHudStyles`, `bossAnnouncementMarkup`, `bossAnnouncementStyles` helper가 소유한다.
- 세션 저장소 browser seam SSOT는 `src/adapters/browser/session/sessionStorageDriver.js`다. `src/adapters/browser/session/sessionRepository.js`와 `sessionRecoveryPolicy.js`는 storage key/codec/migration helper를 조합하고, 기존 `src/state/session/sessionStorageDriver.js`, `sessionRecoveryPolicy.js`, `sessionRepository.js`, `sessionStorage.js`는 thin wrapper만 유지한다.
- `sessionPersistenceService`는 더 이상 `createSessionState` barrel이나 `src/state/session/sessionRepository.js` facade에 직접 의존하지 않는다. session command(`sessionCommands`)와 adapter-owned repository save(`src/adapters/browser/session/sessionRepository.js`)를 app/session factory에서 조합하고, `sessionFacade`는 그 thin re-export만 유지한다.
- `gameCanvasRuntime`는 viewport 계산과 canvas transform만 소유하고, 실제 viewport 적용(owner)은 `BrowserGameShell`이다. shell은 live viewport를 `game.viewport`에만 기록하고, `PlayScene`이 이를 `world.runtime.viewport`로 동기화한 뒤 `WorldTickSystem`이 `camera.width/height` SSOT로 반영한다. `GameConfig.canvasWidth/Height`는 더 이상 live viewport 저장소가 아니라 기본값 fallback 역할만 맡는다.
- browser runtime state/canvas/input/flag helper의 실소유권은 `src/adapters/browser/gameRuntime.js`, `gameCanvasRuntime.js`, `gameInputRuntime.js`, `runtimeFeatureFlags.js`로 이동했다. `src/core/gameRuntime.js`, `gameCanvasRuntime.js`, `gameInputRuntime.js`, `runtimeFeatureFlags.js`는 테스트/기존 import 호환을 위한 thin wrapper만 유지한다.
- 플레이 이벤트 adapter 조합은 `src/adapters/play/playEventAdapters.js`가 맡고, 실제 registration orchestration은 `src/app/play/playEventRegistrationService.js`가 소유한다. runtime helper인 `src/systems/event/eventHandlerRegistry.js`는 전달받은 registration spec을 순서대로 등록하는 공용 helper만 유지한다. legacy `src/systems/event/*` / `src/systems/sound/soundEventHandler.js` re-export shim은 zero-caller 정리로 제거됐다.
- deterministic smoke 산출물은 `output/web-game/deterministic-smoke-core/`와 `output/web-game/deterministic-smoke-full/`로 분리된다.
- deterministic smoke preview wrapper(`scripts/browser-smoke/runSmokeAgainstPreview.mjs`)는 기본적으로 `vite preview`를 쓰되, preview 프로세스가 준비되지 않으면 같은 포트에서 `dist/` 정적 서버로 fallback한 뒤 동일 smoke runner를 계속 실행한다.
- deterministic smoke 시나리오는 `combat_pressure`, `boss_readability` 외에 `touch_hud_mobile`, `daily_seed_run`을 추가로 등록했고, `bootToPlay()` helper는 runtime flag/viewport/beforeStartRun hook을 받아 selector click 폴백과 함께 loadout 사전 조작을 지원한다.
- 결과 화면은 이번 런 요약 외에도 unlock guidance 기반의 `다음 목표` chips, daily challenge streak/reward 상태, analytics 기반 `추천 조정`, `전투 복기` 섹션을 함께 보여준다. Codex 기록 탭은 하이라이트, 장기 목표, 발견 진행, 업적, 해금 보상 중심의 요약 화면을 렌더하고, 그 집계/query 모델은 `src/domain/meta/codex/codexRecordsPresentation.js`가 실제 구현을 소유한다. `src/app/meta/codexRecordsQueryService.js`는 compatibility facade만 유지한다.
- `StartLoadoutView`, `MetaShopView`, `CodexView` helper entrypoint는 더 이상 `ui -> app` 직접 import에 묶이지 않는다. 시작 로드아웃 요약/시드 문구는 `src/domain/meta/loadout/startLoadoutPresentation.js`, 메타 상점 카드 모델은 `src/domain/meta/metashop/metaShopPresentation.js`, 도감 요약/적/무기/장신구 모델은 `src/domain/meta/codex/*Presentation.js`가 실제 구현을 소유하고 app 계층은 thin re-export facade만 유지한다.
- 타이틀 loadout 선택, 플레이어 spawn state, run guidance, meta shop purchase는 더 이상 정적 `stage/archetype/risk relic/ascension/permanent upgrade` data import를 직접 사용하지 않는다. 이 경로들은 주입된 `gameData` catalog만 읽고, scene/application layer가 그 catalog를 전달한다.
- stage catalog는 `ash_plains`, `moon_crypt`, `ember_hollow`, `frost_harbor` 4개를 포함하고, 각 stage는 `bossEcho` signature gimmick을 가진다. boss phase action은 `projectile_nova`와 `stage_echo`까지 확장됐다.
- stage authoring source는 `src/data/stages/*.js` per-stage 모듈로 분해되고, `src/data/stageData.js`는 registry facade만 유지한다.
- 각 stage는 `background.mode === "seamless_tile"` 기반의 declarative floor theme를 가지며, checked-in source에서는 `palette`/`layers` 토큰과 `assets.backgroundKey`를 유지한다. `GameDataLoader`가 hydrate한 runtime stage background만 `images` 토큰을 가지며, stage background renderer가 이를 소비한다. `ash_plains`, `moon_crypt`, `ember_hollow`는 image tile set을, 나머지 stage는 절차적 palette/layer 토큰을 사용한다. active run snapshot은 이 nested background shape를 deep clone으로 저장/복원한다.
- 각 stage는 `encounterTimeline`을 가지며, beat별 `spawnRateMult`, `gimmickIntervalMult`, `label`, `summaryText`가 전투 리듬과 HUD 문구를 함께 정의한다.
- 각 stage는 `stageDirective`를 함께 가져, 런 시작 guidance와 HUD stage chip이 스테이지 고유 규칙을 한 줄로 설명한다. `ash_plains`는 ward pickup gimmick(`ashen_lantern`)도 함께 가진다.
- 각 stage는 `modifierDrafts`도 함께 가져, 런 guidance가 `stageModifier` snapshot을 만들고 HUD/debug/report surface가 `ruleText`와 `counterplay`를 노출한다.
- 콘텐츠 카탈로그는 신규 무기 `ember_spines`, 신규 장신구 `glacier_band`, 관련 unlock/upgrade data를 포함한다. `GameDataLoader.loadDefault()`는 `unlockData`까지 함께 적재한다.

## Current Verified Phase 2 Features

- 영구 업그레이드 상점: `MetaShopScene` + `MetaShopView`
- Ascension 난이도 선택과 런 반영: `ascensionData`, `StartLoadoutView`, `startRunApplicationService`
- 로드아웃 2차 확장: `archetypeData`, `riskRelicData`, `titleLoadoutApplicationService`, `playerSpawnApplicationService`
- 저장/불러오기와 세션 마이그레이션: `src/adapters/browser/session/sessionStorage.js`, `sessionMigrations`
- 세션 저장소 분해: `sessionStorageKeys`, `sessionStateCodec`, `src/adapters/browser/session/sessionRecoveryPolicy.js`, `sessionRepository.js`
- 세션 migration step registry: `src/state/session/migrations/sessionMigrationSteps.js`, `migration0To1.js` ... `migration7To8.js`
- 도감/기록 열람: `CodexScene` + `CodexView`
- 런 히스토리 분석/추천 목표: `runAnalyticsDomain`, `unlockGuidanceDomain`, `codexRecordsTab`, `resultViewMarkup`
- 보스/페이즈/보스 알림: `BossPhaseSystem`, `bossAnnouncementEventAdapter`, `BossAnnouncementView`, `bossAnnouncementMarkup`, `bossAnnouncementStyles`, `bossHudMarkup`, `bossHudStyles`
- 스테이지 기믹과 런타임 이벤트: `StageRuntimeSystem`, `stageEventAdapter`, `stageData.gimmicks`
- boss-stage 결합 패턴: `bossData.phaseActions`, `bossPhaseActionRegistry.stage_echo`, `stageData.bossEcho`
- 무기 진화와 관련 알림: `WeaponEvolutionSystem`, `weaponEvolutionEventAdapter`, `WeaponEvolutionAnnounceView`, `weaponEvolutionAnnounceMarkup`, `weaponEvolutionAnnounceStyles`
- 설정과 런타임 옵션 반영: `SettingsScene`, `sessionRuntimeApplicationService`, `SoundSystem`, renderer quality controls
- delegated overlay/runtime shell: `StartLoadoutView`, `LevelUpView`, `ResultView`, `SettingsView`, `MetaShopView`, `CodexView`
- 세션 스냅샷 export/import/reset: `SettingsScene`, `settingsApplicationService`, `src/adapters/browser/session/sessionRepository.js`, `sessionStorageDriver`
- 세션 저장 슬롯 inspection/backup restore: `SettingsScene`, `settingsApplicationService`, `src/adapters/browser/session/sessionRepository.js`, `sessionStorageDriver`
- 세션 import preview/diff: `SettingsScene`, `settingsApplicationService`
- 접근성 옵션 런타임 반영: `sessionRuntimeApplicationService`, `accessibilityRuntime`, `PlayScene`, `SettingsScene`
- 키 리맵 런타임 반영: `keyBindings`, `KeyboardAdapter`, `TitleScene`, `SettingsScene`
- 후반 전투 다양화: `rangedChase` enemy behavior 등록, `cultist` / `grave_hound` / `ember_mage` / `elite_cultist`, 확장된 late wave pools
- 스테이지/보스 확장 패턴: `StageRuntimeSystem`의 `projectile_barrage`, boss phase action `heal_pulse`, stage/boss data 반영
- 추가 스테이지/보스 패턴: `StageRuntimeSystem`의 `hazard_ring`, `cross_barrage`, boss phase action `projectile_arc`, `projectile_nova`, 관련 stage/boss data 반영
- encounter pacing + HUD guidance: `EncounterDirectorSystem`, `runGuidanceDomain`, `HudView`, `hudViewMarkup`, `hudViewStyles`, stage encounter timeline, `combat_pressure` smoke, `encounter:report`
- encounter authoring metrics + asset manifest: `encounterAuthoringMetrics`, `assetManifest`, `validateCoreGameData`, `validateData`
- seamless stage background pipeline with image/procedural fallback: `stageData.background`, `stageBackgroundTheme`, `createStageBackgroundRenderer`, `CanvasRenderer.drawBackground`, `public/assets/backgrounds/*.png`
- projectile/effect sprite sources with shared atlas + standalone sheet support, animated magic_bolt / arcane_nova / fire_bolt / holy_bolt / ice_bolt sequences, and vector fallback: `vfxSpriteManifest`, `vfxSpriteRuntime`, `drawBehaviorRegistry`, `drawEffectRegistry`, `public/assets/vfx/*.png`
- game studio operability extensions: `GamepadAdapter`, replay trace runtime, authoring snapshot/overlay, asset shipping metadata validation
- 추천 빌드 guidance + 메타 roadmap: `runGuidanceDomain.recommendedBuild`, `levelUpChoicePresentation`, `levelUpChoice/choiceRelations`, `levelUpChoice/choiceSummary`, `levelUpChoice/choicePriorityHints`, `metaGoalDomain`, `playResultSessionService`, `codexRecordsPresentation`, `metaShopPresentation`
- stage modifier guidance surface: `stageData.modifierDrafts`, `runGuidanceDomain.stageModifier`, `HudView`, `runtimeHooks`, `encounterReport`
- boss readability smoke/debug: `runtimeHooks.openBossReadabilityOverlay`, `boss_readability` smoke scenario
- mobile touch/daily smoke: `forceTouchHud` runtime flag, `touch_hud_mobile`, `daily_seed_run`
- 추가 콘텐츠 데이터: `frost_harbor` stage, `ember_spines` weapon, `glacier_band` accessory, 관련 unlock/upgrade data
- 기본 game data 로더는 `stageData`, `archetypeData`, `riskRelicData` 외에도 `ascensionData`, `permanentUpgradeData`를 함께 적재해 title/meta/play application service가 같은 catalog 세트를 공유한다.
- 확장 시너지와 메타 도전 해금: `synergyData` 추가 조합, `currency_earned_gte` / `curse_gte` / `ascension_clear_gte`
- 메타/진입 application service 계층: `settingsApplicationService`, `metaShopApplicationService`, `codexApplicationService`, `titleLoadoutApplicationService`, `startRunApplicationService`, `playResultApplicationService`
- 성능 기준선과 브라우저 smoke 검증: `profile:check`, `verify:fast`, `verify:ci`, GitHub Actions verify workflow
- 남은 호환 facade/wrapper 판정은 `docs/compatibility-wrappers.md`에 기록한다.
- wrapper inventory의 generated usage snapshot은 `npm run compatibility:wrappers` 기준으로 관리된다.
- 아키텍처 import cycle 검사는 `check:cycles`, resolved import 경계 검사는 `check:boundaries`, 문서 drift 검사는 `check:architecture-docs`가 담당한다. 셋은 `npm run lint` baseline으로 묶여 `verify:fast`/`verify:ci`에 포함된다.
- 편집 시점 import 경계 가드는 `eslint.config.js`의 `no-restricted-imports` 규칙으로도 중복 적용된다.

## Current UI Overlay Contracts

- modal shell 계열(`StartLoadout`, `Pause`, `LevelUp`, `Result`)은 `modalTheme` tone token과 `actionButtonTheme` button token을 함께 사용한다.
- `actionButtonTheme`는 semantic tone(`accent`, `neutral`, `danger`, `success`) 외에 modal tone alias(`loadout`, `pause`, `reward`, `result-victory`, `result-defeat`)도 직접 지원한다.
- 타이틀 하위 서브스크린(`MetaShop`, `Settings`, `Codex`) 패널은 `role="dialog"`, `aria-modal="true"`, `tabindex="-1"`를 갖고 공통 dialog runtime으로 포커스/ESC 계약을 공유한다.
- 공통 문구 계층은 `eyebrow -> title -> copy -> primary CTA -> secondary CTA` 구조를 기준으로 유지한다. 설명문은 한 줄 요약 우선, 종료/복귀 계열 CTA는 공통 라벨을 우선 사용한다.
- in-run HUD는 stats row와 별개로 `threat / boss ETA / objective` chips를 가진 guidance row를 유지한다.
- in-run HUD는 stats row와 별개로 `threat / boss ETA / stage directive / stage modifier / objective` chips를 가진 guidance row와 contextual note row를 유지한다.
- mobile touch overlay는 virtual joystick, guide label, pause button을 동일 컨테이너에서 렌더한다.
- result overlay는 stats / unlocks / recommendations 외에 `전투 복기` chip group을 함께 렌더한다.

## Verification Baselines

- `npm run verify`
  local fast baseline. Runs typecheck, `profile:check`, `lint`, unit tests, and build.
- `npm run verify:smoke`
  local browser smoke baseline. Runs a single build followed by prebuilt core deterministic smoke.
- `npm run verify:ci`
  CI baseline. Runs typecheck, `profile:check`, `lint`, unit tests, core browser smoke, and build.
- `npm run lint`
  architecture lint baseline. Runs import-cycle checks, import-boundary checks, and architecture document drift checks.
- `npm run check:cycles`
  verifies that src import cycles stay below the explicit allowlist baseline.
- `npm run check:architecture-docs`
  verifies that generated snapshot sections and wrapper inventory stay aligned with checked-in docs.
- `npm run test:smoke`
  preview build against core deterministic browser smoke scenarios. Artifacts go under `output/web-game/deterministic-smoke-core/`.
- `npm run test:smoke:full`
  preview build against the full deterministic browser smoke suite. Artifacts go under `output/web-game/deterministic-smoke-full/`.
- `npm run smoke:core:prebuilt`
  runs core smoke against an already-built `dist/` without rebuilding first.
- `npm run smoke:full:prebuilt`
  runs full smoke against an already-built `dist/` without rebuilding first.

## Generated Verification Snapshot

- `npm run lint`: `npm run lint:architecture`
- `npm run lint:architecture`: `npm run lint:eslint && npm run check:cycles && npm run check:boundaries && npm run check:architecture-docs`
- `npm run lint:eslint`: `eslint .`
- `npm run check:cycles`: `node scripts/checkCycles.mjs`
- `npm run check:architecture-docs`: `node scripts/checkArchitectureDocs.mjs`
- `npm run verify`: `npm run verify:fast`
- `npm run verify:fast`: `npm run typecheck && npm run profile:check && npm run lint && npm test && npm run build`
- `npm run verify:ci`: `npm run typecheck && npm run profile:check && npm run lint && npm test && npm run build && npm run smoke:core:prebuilt`
- `npm run verify:smoke`: `npm run build && npm run smoke:core:prebuilt`
- `npm run profile:check`: `node scripts/profile.js 300 --assert-budget`
- CI workflow uses `npm run verify:ci`: yes

## Maintenance Rule

- 규칙을 바꾸면 `AGENTS.md`를 수정한다.
- 현재 구현 사실이 바뀌면 이 문서를 수정한다.
