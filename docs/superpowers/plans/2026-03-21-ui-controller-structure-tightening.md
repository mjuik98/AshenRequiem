# UI Controller Structure Tightening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pause/Result/Play scene의 남은 대형 책임을 작은 공통 모듈로 나누고 브라우저 검증용 deterministic 훅을 추가한다.

**Architecture:** PauseView는 렌더 helper와 툴팁 builder를 별도 모듈로 분리하고, PlayScene의 레벨업 액션 흐름은 작은 controller 모듈로 옮긴다. ResultView와 PauseView의 액션 버튼 룩앤필은 공통 토큰으로 정리하고, Game는 테스트 전용이 아닌 일반 runtime 훅으로 deterministic stepping 인터페이스를 노출한다.

**Tech Stack:** Vanilla JS, DOM UI, 기존 testRunner 기반 source/import 테스트, Playwright CLI 브라우저 스모크

---

### Task 1: 구조 고정 테스트 추가

**Files:**
- Create: `tests/UiStructureSource.test.js`
- Modify: `tests/PauseAndInputSource.test.js`
- Modify: `tests/ResultAndProgressionSource.test.js`

- [ ] PauseView 분리 지점, PlayScene level-up controller 사용, 공통 action token 사용, deterministic hook 노출을 검증하는 실패 테스트를 작성한다.
- [ ] `'/mnt/c/Program Files/nodejs/node.exe' tests/UiStructureSource.test.js`와 관련 source 테스트를 실행해 RED를 확인한다.

### Task 2: PauseView/ResultView 공통화

**Files:**
- Create: `src/ui/shared/actionButtonTheme.js`
- Create: `src/ui/pause/pauseViewSections.js`
- Create: `src/ui/pause/pauseTooltipContent.js`
- Modify: `src/ui/pause/PauseView.js`
- Modify: `src/ui/result/ResultView.js`

- [ ] PauseView의 tab/content 렌더와 tooltip content builder를 helper 모듈로 이동한다.
- [ ] ResultView와 PauseView footer 버튼이 같은 공통 토큰/markup helper를 사용하도록 정리한다.
- [ ] 관련 source 테스트를 재실행해 GREEN을 확인한다.

### Task 3: PlayScene level-up controller 추출

**Files:**
- Create: `src/scenes/play/levelUpController.js`
- Modify: `src/scenes/PlayScene.js`

- [ ] PlayScene의 level-up 표시/선택/리롤/봉인 로직을 controller helper로 옮긴다.
- [ ] PlayScene은 world transition과 UI wiring만 담당하도록 축소한다.
- [ ] source 테스트를 재실행해 GREEN을 확인한다.

### Task 4: Deterministic runtime hook 추가

**Files:**
- Create: `src/core/runtimeHooks.js`
- Modify: `src/core/Game.js`
- Modify: `src/main.js`

- [ ] 외부 검증이 사용할 수 있는 `window.advanceTime(ms)` 및 상태 텍스트 훅 등록 지점을 추가한다.
- [ ] 기존 runtime 동작을 깨지 않으면서 브라우저 스모크가 deterministic stepping을 사용할 수 있게 한다.
- [ ] source 테스트와 필요 시 간단 브라우저 확인으로 GREEN을 확인한다.

### Task 5: 통합 검증 및 기록

**Files:**
- Modify: `progress.md`

- [ ] 관련 개별 테스트와 전체 `scripts/runTests.js`, `npm run build`를 실행한다.
- [ ] 필요 시 Playwright로 deterministic 훅과 기존 pause/result flow를 짧게 smoke 검증한다.
- [ ] `progress.md`에 구조 변경과 남은 리스크를 기록한다.
