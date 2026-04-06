# Module Map

이 문서는 현재 코드베이스에서 새 코드를 어디에 두어야 하는지, 어떤 폴더가 실제 owner인지, 어떤 경로가 점진적 정리 대상인지 빠르게 판단하기 위한 owner map이다.

## Stable Owners

### `play`
- 책임: 전투 시뮬레이션, 런 초기화/종료, 이벤트 파이프라인, stage gimmick, level-up, active-run snapshot.
- 현재 owner 경로:
  - `src/domain/play/*`
  - `src/app/play/*`
  - `src/systems/*`
  - `src/entities/*`
  - `src/behaviors/*`
- 규칙:
  - gameplay rule은 `Scene`/`UI`가 아니라 play owner 안에서만 추가한다.
  - session persistence나 browser API를 직접 알면 안 된다.

### `meta`
- 책임: codex, metashop, settings, loadout selection, run-result meta progression, session write orchestration.
- 현재 owner 경로:
  - `src/domain/meta/*`
  - `src/app/meta/*`
  - `src/app/title/*`
  - `src/app/session/*`
- 규칙:
  - 메타 계산은 가능한 한 domain/meta에 둔다.
  - 실제 저장과 settings session snapshot orchestration은 `src/app/session/*`과 browser session adapter 경계로만 보낸다.

### `catalog`
- 책임: shipped game data, asset manifest, validation, catalog hydration.
- 현재 owner 경로:
  - `src/data/*`
- 규칙:
  - 무기/적/스테이지/업그레이드 확장은 catalog를 먼저 본다.
  - 런타임 조합 로직은 catalog에 넣지 않는다.

### `platform`
- 책임: browser runtime, DOM/canvas/audio/input/localStorage, runtime hooks, debug policy.
- 현재 owner 경로:
  - `src/adapters/browser/*`
  - `src/adapters/play/*`
- 규칙:
  - browser-specific 해석은 `platform`만 직접 안다.
  - non-platform helper는 browser adapter를 직접 import하지 않는다.

### `shared`
- 책임: 여러 owner가 공통으로 사용하는 순수 helper, config, ids, random, logging/runtime issue facade.
- 현재 owner 경로:
  - `src/utils/*`
  - `src/math/*`
  - `src/core/GameConfig.js`
- 규칙:
  - `shared`는 platform owner를 직접 import하지 않는다.
  - 환경별 동작 차이는 bootstrap이나 adapter에서 주입한다.
  - 동적 import 실패 분류/복구 문구 같은 runtime issue formatting도 `shared` helper에서만 공통화한다.

### `compat`
- 책임: 외부 공개 경로나 테스트 안정성을 위한 temporary compatibility wrapper.
- 현재 owner 경로:
  - `docs/compatibility-wrappers.md`에 기록된 thin facade only
- 규칙:
  - compatibility wrapper에는 새 로직을 추가하지 않는다.
  - 내부 코드에서 wrapper를 새로 import하지 않는다.

## Placement Rules

- 새 gameplay rule: `play`
- 새 codex/metashop/settings/loadout rule: `meta`
- 새 content data/validation: `catalog`
- 새 DOM/browser/localStorage/audio/runtime hook logic: `platform`
- 새 pure helper/config/logger facade: `shared`
- 기존 공개 경로 유지용 re-export: `compat`

## Deprecated Ambiguity Zones

### `src/progression/*`
- 상태: legacy gameplay helper zone.
- owner 해석:
  - legacy zone은 정리 완료 대상으로 본다.
  - 새 파일은 추가하지 않는다.
- 전환 원칙:
  - `play` helper는 `src/domain/play/progression/*`, meta unlock helper는 `src/domain/meta/progression/*`로 둔다.

### resolved play state helpers
- `spawnRequest`와 `createSynergyState`의 실제 owner는 이제 `src/domain/play/state/*`다.
- 새 gameplay state helper는 `src/state/*`가 아니라 play owner 하위에 둔다.

### resolved play progression helpers
- `accessoryEffectRuntime`, `synergyRuntime`, `upgradeChoicePool`, `upgradeChoiceRuntime`, `upgradeFallbackChoices`의 실제 owner는 이제 `src/domain/play/progression/*`다.
- 새 gameplay progression helper는 `src/progression/*`가 아니라 play owner 하위에 둔다.

### resolved meta progression helpers
- `unlockEvaluator`, `unlockProgressRuntime`의 실제 owner는 이제 `src/domain/meta/progression/*`다.
- 새 meta progression helper는 `src/progression/*`가 아니라 meta owner 하위에 둔다.

### `src/state/createSessionState.js`
- 상태: legacy barrel.
- owner 해석:
  - session state/migration owner는 `src/state/session/*`
  - browser storage/repository owner는 `src/adapters/browser/session/*`
- 전환 원칙:
  - 새 persistence caller는 adapter/app owner를 직접 본다.
  - barrel은 compatibility 목적의 재노출만 허용한다.
  - 내부 `src` 코드는 이 barrel을 직접 import하지 않는다.

### `src/state/sessionMeta.js`
- 상태: legacy session meta facade.
- owner 해석:
  - session meta 기본값/정규화 owner는 `src/state/session/sessionMetaState.js`
  - unlock progress 보정 owner는 `src/state/session/sessionUnlockState.js`
- 전환 원칙:
  - 새 세션 메타 보정 caller는 facade가 아니라 `src/state/session/*` owner를 직접 본다.
  - facade는 compatibility 목적의 재노출만 허용한다.

### `src/app/meta/*QueryService.js` and `src/app/meta/*ViewModelService.js`
- 상태: facade-heavy meta read-model entrypoint.
- owner 해석:
  - 실제 read-model 계산 owner는 `src/domain/meta/*Presentation.js`
- 전환 원칙:
  - 새 계산 로직은 domain presentation owner에 둔다.
  - facade는 thin re-export만 유지한다.

### resolved settings session snapshot services
- `sessionSnapshotQueryService`, `sessionSnapshotCommandService`, `sessionSnapshotPreview`, `sessionSnapshotCodec`, `sessionSnapshotMutationService`의 실제 owner는 이제 `src/app/session/*`다.
- `src/app/meta/settingsQueryService.js`, `settingsCommandService.js`는 thin facade만 유지한다.
- `SettingsScene`의 scene-facing entrypoint는 `src/app/session/settingsSceneApplicationService.js`가 맡고, scene가 직접 만들던 settings data-panel result payload와 오류 매핑도 이 service가 소유한다. `src/app/meta/settingsApplicationService.js`는 compatibility facade만 유지한다.
- 새 settings snapshot/import-export/reset 로직은 `src/app/meta/*`가 아니라 session owner 하위에 둔다.

### resolved meta shop purchase helper
- `metaShopPurchaseDomain`의 실제 owner는 이제 `src/domain/meta/metashop/metaShopPurchaseDomain.js`다.
- `src/app/meta/metaShopApplicationService.js`는 purchase rule 계산을 직접 소유하지 않고, domain helper + session persistence orchestration만 담당한다.
- 새 meta shop purchase validation/cost rule은 app 계층이 아니라 meta domain 하위에 둔다.

### resolved meta shop scene service
- `MetaShopScene`의 scene-facing entrypoint는 이제 `src/app/meta/metaShopSceneApplicationService.js`다.
- `src/app/meta/metaShopApplicationService.js`는 low-level purchase orchestration만 맡고, scene가 직접 들고 있던 refresh payload와 성공/실패 해석은 scene service가 소유한다.
- 새 meta shop scene payload shaping이나 refresh 판단은 `MetaShopScene`이 아니라 `src/app/meta/metaShopSceneApplicationService.js`에 둔다.

### resolved codex scene service
- `CodexScene`의 scene-facing entrypoint는 이제 `src/app/meta/codexSceneApplicationService.js`다.
- `src/app/meta/codexApplicationService.js`는 low-level codex session/gameData preparation만 맡고, scene가 직접 들고 있던 view payload assembly는 scene service가 소유한다.
- 새 codex scene payload shaping은 `CodexScene`이 아니라 `src/app/meta/codexSceneApplicationService.js`에 둔다.

### compatibility wrapper inventory
- `docs/compatibility-wrappers.md`에 없는 새 wrapper는 만들지 않는다.
- 새 wrapper가 정말 필요하면 문서와 guard를 함께 갱신한다.

## Current Mapping Snapshot

| Current Path | Owner Bucket | Notes |
|---|---|---|
| `src/scenes/*` | presentation | scene flow and surface orchestration only |
| `src/ui/*` | presentation | DOM/render state only |
| `src/app/play/*` | `play` | use-case orchestration |
| `src/domain/play/*` | `play` | pure gameplay/domain calculations |
| `src/systems/*` | `play` | frame pipeline systems |
| `src/app/meta/*` | `meta` | settings/codex/metashop orchestration |
| `src/domain/meta/*` | `meta` | read models and meta rules |
| `src/data/*` | `catalog` | shipped catalog + validation inputs |
| `src/adapters/browser/*` | `platform` | browser/runtime integration |
| `src/utils/*` | `shared` | pure helper or shared facade only |

## Decision Shortcut

새 코드를 추가할 때 아래 순서로 판단한다.

1. browser/DOM/localStorage/audio/query-string을 직접 아는가
2. yes면 `platform`, no면 계속 진행
3. gameplay simulation 또는 run-state rule인가
4. yes면 `play`
5. meta progression/read-model/settings/loadout rule인가
6. yes면 `meta`
7. shipped data/catalog/validation인가
8. yes면 `catalog`
9. 그 외 공통 순수 helper면 `shared`
