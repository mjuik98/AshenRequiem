# Deterministic Browser Smoke Coverage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `runtimeHooks`와 기존 Playwright/Web Game client를 이용해 타이틀 → 전투 진입, 레벨업, ESC pause, 결과 화면까지를 재현 가능한 deterministic browser smoke로 고정한다.

**Architecture:** 런타임 상태 판별은 DOM 텍스트 파싱보다 `window.render_game_to_text()` snapshot을 우선 사용한다. 브라우저 smoke는 repo 내부 스크립트로 수렴해 ad-hoc CLI 기록 의존을 줄이고, 필요한 경우에만 `runtimeHooks` snapshot 필드를 최소 확장한다.

**Tech Stack:** Vanilla JS game runtime, existing `src/core/runtimeHooks.js`, Playwright CLI / web-game client, Node scripts, custom Node test runner.

---

## File Responsibilities

- `src/core/runtimeHooks.js`
  - browser smoke가 읽는 runtime snapshot 단일 소스
- `src/scenes/play/PlayUI.js`
  - pause / levelup / result 가시성 정보를 runtime snapshot이 읽을 수 있게 노출
- `scripts/browser-smoke/runDeterministicSmoke.mjs`
  - 로컬 정적 서버 URL을 받아 deterministic smoke를 순서대로 실행
- `scripts/browser-smoke/scenarios.js`
  - 타이틀 진입, 시작 무기 선택, runtime hook 주입, ESC pause, 결과 화면 확인 시나리오 정의
- `tests/RuntimeHooks.test.js`
  - smoke가 요구하는 runtime snapshot 계약 회귀
- `tests/BrowserSmokeSource.test.js`
  - smoke runner/시나리오 파일 존재와 핵심 contract 문자열 회귀
- `progress.md`
  - smoke coverage 완료 여부와 산출물 경로 기록

## Chunk 1: Runtime Snapshot Contract Lock

### Task 1: smoke가 필요한 runtime snapshot 필드를 failing test로 고정

**Files:**
- Modify: `tests/RuntimeHooks.test.js`
- Test: `tests/RuntimeHooks.test.js`

- [ ] **Step 1: Write the failing test**

추가로 검증할 snapshot 필드:
- `ui.pauseVisible`
- `ui.levelUpVisible`
- `ui.resultVisible`
- 필요 시 `ui.activePauseTab`
- 필요 시 `player.accessories`, `pendingLevelUpChoices`

- [ ] **Step 2: Run test to verify it fails**

Run: `"/mnt/c/Program Files/nodejs/node.exe" tests/RuntimeHooks.test.js`
Expected: FAIL because snapshot contract is incomplete.

- [ ] **Step 3: Write minimal implementation**

`src/core/runtimeHooks.js`와 필요 시 `src/scenes/play/PlayUI.js`를 최소 수정해 smoke가 읽는 상태를 노출한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `"/mnt/c/Program Files/nodejs/node.exe" tests/RuntimeHooks.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/runtimeHooks.js src/scenes/play/PlayUI.js tests/RuntimeHooks.test.js
git commit -m "test: lock runtime snapshot contract for browser smoke"
```

## Chunk 2: Repo-Local Smoke Runner

### Task 2: browser smoke runner source contract 추가

**Files:**
- Create: `tests/BrowserSmokeSource.test.js`
- Create: `scripts/browser-smoke/runDeterministicSmoke.mjs`
- Create: `scripts/browser-smoke/scenarios.js`

- [ ] **Step 1: Write the failing test**

테스트는 아래를 검증한다:
- repo 내부에 smoke runner 파일이 존재한다
- runner가 `render_game_to_text` 또는 `__ASHEN_RUNTIME__`를 사용한다
- scenario 정의가 `title`, `play`, `pause`, `result` 같은 단계 이름을 가진다
- 산출물 경로가 `output/web-game/` 또는 `output/playwright/` 아래로 제한된다

- [ ] **Step 2: Run test to verify it fails**

Run: `"/mnt/c/Program Files/nodejs/node.exe" tests/BrowserSmokeSource.test.js`
Expected: FAIL because runner files do not exist yet.

- [ ] **Step 3: Write minimal implementation**

`scripts/browser-smoke/runDeterministicSmoke.mjs`:
- 입력 URL을 받는다
- Playwright CLI wrapper 또는 web-game client를 호출한다
- 각 단계마다 snapshot/assert/screenshot를 남긴다

`scripts/browser-smoke/scenarios.js`:
- `title_to_play`
- `pause_overlay`
- `result_screen`
시나리오 정의를 export 한다.

- [ ] **Step 4: Run test to verify it passes**

Run: `"/mnt/c/Program Files/nodejs/node.exe" tests/BrowserSmokeSource.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/browser-smoke/runDeterministicSmoke.mjs scripts/browser-smoke/scenarios.js tests/BrowserSmokeSource.test.js
git commit -m "feat: add deterministic browser smoke runner"
```

## Chunk 3: Scenario Assertions

### Task 3: Title → Play deterministic smoke 구현

**Files:**
- Modify: `scripts/browser-smoke/runDeterministicSmoke.mjs`
- Modify: `scripts/browser-smoke/scenarios.js`
- Test: manual smoke artifact + optional source test update

- [ ] **Step 1: Implement title-to-play scenario**

시나리오 목표:
- 타이틀 화면 확인
- 시작 무기 선택 열기
- 시작하기 후 `scene === "PlayScene"` 확인
- `player.weapons.length === 1` 확인

- [ ] **Step 2: Run scenario**

Run: `node scripts/browser-smoke/runDeterministicSmoke.mjs --url http://127.0.0.1:43210 --scenario title_to_play`
Expected:
- JSON summary 생성
- 스크린샷 생성
- `scene: "PlayScene"` 확인

- [ ] **Step 3: Record artifact paths**

산출물 예시:
- `output/web-game/deterministic-smoke/title-to-play/summary.json`
- `output/web-game/deterministic-smoke/title-to-play/shot.png`

- [ ] **Step 4: Commit**

```bash
git add scripts/browser-smoke/runDeterministicSmoke.mjs scripts/browser-smoke/scenarios.js output/web-game/deterministic-smoke/title-to-play
git commit -m "feat: script deterministic title-to-play smoke"
```

### Task 4: Pause / Result smoke 구현

**Files:**
- Modify: `scripts/browser-smoke/runDeterministicSmoke.mjs`
- Modify: `scripts/browser-smoke/scenarios.js`
- Modify: `progress.md`

- [ ] **Step 1: Implement pause scenario**

pause 시나리오 목표:
- runtime hook 또는 controlled injection으로 accessory 1개를 보유시킨다
- ESC 후 `ui.pauseVisible === true`
- hover 또는 DOM check로 tooltip visible 확인

- [ ] **Step 2: Implement result scenario**

result 시나리오 목표:
- controlled defeat/victory transition 유도
- `ui.resultVisible === true`
- 결과 화면 버튼 텍스트 확인

- [ ] **Step 3: Run all scenarios**

Run:
- `node scripts/browser-smoke/runDeterministicSmoke.mjs --url http://127.0.0.1:43210 --scenario pause_overlay`
- `node scripts/browser-smoke/runDeterministicSmoke.mjs --url http://127.0.0.1:43210 --scenario result_screen`

Expected:
- scenario summary JSON 생성
- screenshot 생성
- runtime snapshot assertions PASS

- [ ] **Step 4: Record completion in progress**

`progress.md`에 deterministic smoke coverage 완료와 남은 blind spot을 기록한다.

- [ ] **Step 5: Commit**

```bash
git add scripts/browser-smoke/runDeterministicSmoke.mjs scripts/browser-smoke/scenarios.js progress.md output/web-game/deterministic-smoke
git commit -m "feat: cover pause and result browser smoke"
```

## Chunk 4: Verification

### Task 5: Focused and suite verification

**Files:**
- Test: `tests/RuntimeHooks.test.js`
- Test: `tests/BrowserSmokeSource.test.js`
- Test: `scripts/runTests.js`
- Test: build pipeline

- [ ] **Step 1: Run focused tests**

Run:
- `"/mnt/c/Program Files/nodejs/node.exe" tests/RuntimeHooks.test.js`
- `"/mnt/c/Program Files/nodejs/node.exe" tests/BrowserSmokeSource.test.js`

- [ ] **Step 2: Run full suite**

Run: `"/mnt/c/Program Files/nodejs/node.exe" scripts/runTests.js --runInBand`
Expected: PASS, 0 failures.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build success.

- [ ] **Step 4: Run deterministic smoke end-to-end**

Run:
- `node scripts/browser-smoke/runDeterministicSmoke.mjs --url http://127.0.0.1:43210 --all`

Expected:
- title / pause / result summaries all PASS
- artifacts under `output/web-game/deterministic-smoke/`

- [ ] **Step 5: Commit**

```bash
git add tests/RuntimeHooks.test.js tests/BrowserSmokeSource.test.js scripts/browser-smoke progress.md
git commit -m "test: add deterministic browser smoke coverage"
```
