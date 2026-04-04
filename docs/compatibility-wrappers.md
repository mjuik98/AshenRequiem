# Wrapper Inventory

남아 있는 호환 wrapper는 내부 구조 정리와 공개 import 안정성을 동시에 만족시키기 위해 유지한다.
generated usage snapshot은 `npm run compatibility:wrappers` 출력 기준으로 관리한다.

Disposition taxonomy:

- `keep-public-wrapper`: 내부 코드에서는 금지하지만 테스트/외부 공개 경로 호환을 위해 유지

2026-03-28 cleanup:

- repo 내부 caller가 0이던 zero-caller dead wrapper 10개(`playerSpawnRuntime`, `playSceneFlow`, `levelUpFlowRuntime`, legacy event/sound handler shim)는 코드베이스에서 완전히 제거했다.
- generated usage snapshot에서 `internalCallers = 0`인 zero-caller wrapper는 더 이상 inventory에 남겨두지 않는다.
- 2026-03-30 runtime realignment에서는 `src/core/PlayRuntimeBuilder.js`를 compatibility wrapper로 늘리지 않았다. 이 파일은 여전히 internal pure helper이며, concrete scene/UI wiring은 `src/scenes/play/playRuntimeComposer.js`가 소유한다.
- 2026-04-05 session storage realignment에서는 browser-backed session storage 구현을 `src/adapters/browser/session/*`로 이동했다. `src/state/session/sessionStorageDriver.js`, `sessionRecoveryPolicy.js`, `sessionRepository.js`, `sessionStorage.js`는 테스트/기존 import 호환용 thin re-export만 유지한다.

| Path | Role | Disposition | Notes |
|---|---|---|---|
| `src/core/Game.js` | `GameApp` + `BrowserGameShell` facade | `keep-public-wrapper` | main 엔트리는 직접 사용하지 않음. 일부 공개 helper/tests 호환 때문에 유지 |
| `src/core/gameRuntime.js` | browser runtime state facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/gameRuntime.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/core/gameInputRuntime.js` | browser input runtime facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/gameInputRuntime.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/core/gameCanvasRuntime.js` | browser canvas runtime facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/gameCanvasRuntime.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/core/runtimeHost.js` | browser host lookup facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/runtimeHost.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/core/runtimeFeatureFlags.js` | browser runtime flag facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/runtimeFeatureFlags.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/core/runtimeHooks.js` | browser runtime hook facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/runtimeHooks.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/scenes/play/PlayResultHandler.js` | `playResultApplicationService` class facade | `keep-public-wrapper` | 테스트/기존 import 호환 경로. `createPlayResultHandler()` / `processPlayResult()` thin helper export 제공 |
| `src/state/createWorld.js` | `createPlayWorld` re-export | `keep-public-wrapper` | 내부 import 금지, domain 경로가 SSOT. 일부 source test 호환이 남아 있음 |
| `src/state/startLoadoutRuntime.js` | start loadout domain re-export | `keep-public-wrapper` | title/start loadout 공개 경로 호환. 일부 테스트 import가 남아 있음 |
| `src/state/session/sessionStorageDriver.js` | browser session storage driver facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/session/sessionStorageDriver.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/state/session/sessionRecoveryPolicy.js` | browser session recovery facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/session/sessionRecoveryPolicy.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/state/session/sessionRepository.js` | browser session repository facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/session/sessionRepository.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |
| `src/state/session/sessionStorage.js` | browser session storage facade | `keep-public-wrapper` | 실제 구현은 `src/adapters/browser/session/sessionStorage.js`가 소유. 테스트/기존 import 호환용 re-export만 유지 |

판정 원칙:

- `src` 내부 모듈은 이 wrapper들을 직접 import하지 않는다. `check:boundaries`와 source test가 이를 강제한다.
- dead wrapper는 inventory에 남기지 않고 바로 삭제한다. inventory는 실제로 유지 중인 공개 호환 경로만 기록한다.

## Generated Wrapper Usage Snapshot

| Path | internalCallers | srcCallers | testCallers | scriptCallers |
|---|---|---|---|---|
| `src/core/Game.js` | 2 | 0 | 2 | 0 |
| `src/core/gameRuntime.js` | 1 | 0 | 1 | 0 |
| `src/core/gameInputRuntime.js` | 2 | 0 | 2 | 0 |
| `src/core/gameCanvasRuntime.js` | 2 | 0 | 2 | 0 |
| `src/core/runtimeHost.js` | 1 | 0 | 1 | 0 |
| `src/core/runtimeFeatureFlags.js` | 1 | 0 | 1 | 0 |
| `src/core/runtimeHooks.js` | 2 | 0 | 2 | 0 |
| `src/scenes/play/PlayResultHandler.js` | 2 | 0 | 2 | 0 |
| `src/state/createWorld.js` | 1 | 0 | 1 | 0 |
| `src/state/startLoadoutRuntime.js` | 2 | 0 | 2 | 0 |
| `src/state/session/sessionStorageDriver.js` | 1 | 0 | 1 | 0 |
| `src/state/session/sessionRecoveryPolicy.js` | 2 | 0 | 2 | 0 |
| `src/state/session/sessionRepository.js` | 1 | 0 | 1 | 0 |
| `src/state/session/sessionStorage.js` | 2 | 0 | 2 | 0 |

## Generated Wrapper Caller Details

- `src/core/Game.js`: `tests/GameShellArchitecture.test.js`, `tests/UiStructureSource.test.js`
- `src/core/gameRuntime.js`: `tests/GameRuntimeBootstrap.test.js`
- `src/core/gameInputRuntime.js`: `tests/GameInputRuntime.test.js`, `tests/GameRuntimeBootstrap.test.js`
- `src/core/gameCanvasRuntime.js`: `tests/GameRuntimeBootstrap.test.js`, `tests/RuntimeCanvasBoundaries.test.js`
- `src/core/runtimeHost.js`: `tests/RuntimeEnv.test.js`
- `src/core/runtimeFeatureFlags.js`: `tests/RuntimeFeatureFlags.test.js`
- `src/core/runtimeHooks.js`: `tests/RuntimeHooks.test.js`, `tests/UiStructureSource.test.js`
- `src/scenes/play/PlayResultHandler.js`: `tests/PlayResultHandler.test.js`, `tests/SceneInfrastructureSource.test.js`
- `src/state/createWorld.js`: `tests/ProfileSource.test.js`
- `src/state/startLoadoutRuntime.js`: `tests/StartLoadoutRuntime.test.js`, `tests/TitleLoadout.test.js`
- `src/state/session/sessionStorageDriver.js`: `tests/SessionModules.test.js`
- `src/state/session/sessionRecoveryPolicy.js`: `tests/SessionModules.test.js`, `tests/UiStructureSource.test.js`
- `src/state/session/sessionRepository.js`: `tests/SessionRepository.test.js`
- `src/state/session/sessionStorage.js`: `tests/SessionModules.test.js`, `tests/SessionRepository.test.js`
