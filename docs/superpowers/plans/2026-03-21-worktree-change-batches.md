# Current Worktree Change Batches

이 문서는 현재 워킹트리 변경을 커밋/리뷰 가능한 묶음으로 정리한 메모다.

## Batch A: Runtime Event And Progression Consistency

목적:
- 런타임 이벤트 SSOT와 progression DI를 실제 플레이 경로와 일치시킨다.

주요 파일:
- `src/data/GameDataLoader.js`
- `src/data/constants/events.js`
- `src/scenes/play/PlayResultHandler.js`
- `src/systems/event/codexHandler.js`
- `src/systems/progression/LevelSystem.js`
- `src/systems/progression/UpgradeApplySystem.js`
- `src/systems/progression/UpgradeSystem.js`
- `src/systems/progression/WeaponEvolutionSystem.js`
- `src/systems/spawn/SpawnSystem.js`
- `tests/PlayResultHandler.test.js`
- `tests/SpawnSystem.test.js`
- `tests/UpgradeApplySystem.test.js`
- `tests/WeaponEvolution.test.js`
- `tests/WorldState.test.js`
- `tests/fixtures/index.js`
- `docs/superpowers/plans/2026-03-21-runtime-event-and-progression-consistency.md`

검증:
- `"/mnt/c/Program Files/nodejs/node.exe" tests/PlayResultHandler.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/SpawnSystem.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/UpgradeApplySystem.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/WeaponEvolution.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/WorldState.test.js`

## Batch B: Pause / Loadout / Progression UX

목적:
- ESC 로드아웃 경험, 레벨업/무기 progression 확장, 관련 UI source 계약을 정리한다.

주요 파일:
- `src/data/upgradeData.js`
- `src/data/weaponData.js`
- `src/data/weaponEvolutionData.js`
- `src/data/weaponProgressionData.js`
- `src/scenes/CodexScene.js`
- `src/scenes/MetaShopScene.js`
- `src/scenes/PlayScene.js`
- `src/scenes/ResultScene.js`
- `src/scenes/SettingsScene.js`
- `src/scenes/TitleScene.js`
- `src/ui/pause/PauseView.js`
- `src/ui/pause/pauseLoadoutContent.js`
- `src/ui/pause/pauseTooltipContent.js`
- `tests/PauseAndInputSource.test.js`
- `tests/PauseLoadoutContent.test.js`
- `tests/ResultAndProgressionSource.test.js`
- `docs/superpowers/plans/2026-03-21-esc-loadout-redesign-implementation.md`

검증:
- `"/mnt/c/Program Files/nodejs/node.exe" tests/PauseAndInputSource.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/PauseLoadoutContent.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/ResultAndProgressionSource.test.js`

## Batch C: Runtime Hook And Browser Verification

목적:
- deterministic runtime snapshot과 실제 브라우저 smoke 검증을 안정화한다.

주요 파일:
- `src/core/runtimeHooks.js`
- `src/scenes/play/PlayUI.js`
- `tests/RuntimeHooks.test.js`
- `progress.md`

산출물:
- `output/playwright/pause-accessory-tooltip.png`

검증:
- `"/mnt/c/Program Files/nodejs/node.exe" tests/RuntimeHooks.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" scripts/runTests.js --runInBand`
- `npm run build`

## 작업 순서 제안

1. Batch A를 먼저 정리한다.
2. Batch B를 별도 변경 묶음으로 유지한다.
3. Batch C는 마지막에 얹어 브라우저 검증 인프라 변경으로 분리한다.
