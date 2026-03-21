# ESC Loadout Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ESC 일시정지 모달의 무기/장신구 표시를 하나의 `로드아웃` 경험으로 통합하고, 선택 기반 상세 패널과 반응형 레이아웃으로 가독성·시너지 가시성·보상감을 개선한다.

**Architecture:** `PauseView`는 선택 상태와 이벤트 wiring만 유지하고, 로드아웃 리스트/상세 패널 HTML은 전용 helper 모듈로 분리한다. 기존 `pauseViewSections.js`는 탭과 패널 셸만 담당하고, `pauseTooltipContent.js`는 보조 tooltip 역할로 축소한다. 모든 변경은 UI 레이어에 한정하고 `player`/`data`에서 이미 전달되는 정보만 재조합한다.

**Tech Stack:** Vanilla JS, DOM UI, 기존 source/import 테스트, existing Node test runner, Vite build

---

## File Structure

- `src/ui/pause/PauseView.js`
  - pause modal orchestration
  - selected loadout item state
  - click/keyboard binding
  - CSS injection
- `src/ui/pause/pauseViewSections.js`
  - tab navigation
  - high-level panel wrappers
  - header/footer shell markup
- `src/ui/pause/pauseLoadoutContent.js`
  - unified loadout item list builder
  - detail panel builder
  - slot/detail formatting helpers
- `src/ui/pause/pauseTooltipContent.js`
  - supplementary tooltip builders only
  - no longer the primary explanation surface
- `tests/PauseLoadoutContent.test.js`
  - direct helper tests for unified loadout/detail HTML
- `tests/PauseAndInputSource.test.js`
  - source-level checks for tab names, panel layout, and interaction hooks
- `tests/ResultAndProgressionSource.test.js`
  - replace old “weapon card must stay minimal” assumptions with new redesign expectations
- `progress.md`
  - record redesign completion and remaining validation risks

## Implementation Notes

- Use `@test-driven-development` during implementation: write/adjust the failing test first for each behavior slice.
- Use `@verification-before-completion` before claiming the redesign is done.
- Preserve AGENTS constraints:
  - UI only, no combat-rule mutation
  - no direct `session` mutation from `PauseView`
  - do not move rule logic into scenes

## Chunk 1: Lock The New UI Contract

### Task 1: Replace outdated pause source assertions with loadout redesign expectations

**Files:**
- Modify: `tests/PauseAndInputSource.test.js`
- Modify: `tests/ResultAndProgressionSource.test.js`

- [ ] Replace the old assertions that require separate weapon/accessory tabs or ultra-minimal card bodies with assertions for:
  - `로드아웃` tab 존재
  - `무기` / `장신구` tab 제거
  - detail panel class/markup 존재
  - selection-oriented card hooks 존재
- [ ] Keep existing unrelated pause/input regressions intact so this test file still guards ESC width, sound panel, and keyboard behavior.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseAndInputSource.test.js`
  Expected: FAIL because the current `PauseView` still renders the old tab structure.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/ResultAndProgressionSource.test.js`
  Expected: FAIL because the current source still matches the pre-redesign card assumptions.

### Task 2: Add direct helper tests for unified loadout/detail rendering

**Files:**
- Create: `tests/PauseLoadoutContent.test.js`

- [ ] Add a focused test file that imports the new helper module shape in advance and asserts the planned API:
  - unified loadout items include weapons, accessories, empty slots, and locked slots
  - default selection fallback is stable
  - detail panel output includes linked items, synergy block, and evolution block containers
- [ ] Use fixture-lite test inputs that mimic `player` and `data` shape already used by `PauseView`; do not add test-only production APIs.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseLoadoutContent.test.js`
  Expected: FAIL because `src/ui/pause/pauseLoadoutContent.js` does not exist yet.

### Task 3: Commit the red test baseline

**Files:**
- Modify: `tests/PauseAndInputSource.test.js`
- Modify: `tests/ResultAndProgressionSource.test.js`
- Create: `tests/PauseLoadoutContent.test.js`

- [ ] Review the changed tests once to ensure they describe the new UI contract, not implementation trivia.
- [ ] Commit:

```bash
git add tests/PauseAndInputSource.test.js tests/ResultAndProgressionSource.test.js tests/PauseLoadoutContent.test.js
git commit -m "test: define ESC loadout redesign contract"
```

## Chunk 2: Build The Unified Loadout Rendering Helpers

### Task 4: Create the loadout helper module with minimal passing behavior

**Files:**
- Create: `src/ui/pause/pauseLoadoutContent.js`
- Test: `tests/PauseLoadoutContent.test.js`

- [ ] Implement the smallest helper surface needed by the new tests. Prefer a small exported API such as:
  - `buildPauseLoadoutItems(...)`
  - `getDefaultPauseSelection(...)`
  - `renderPauseLoadoutPanel(...)`
- [ ] Keep helper responsibilities data-to-HTML/data-to-view-model only. Do not touch DOM globals or `PauseView` instance state here.
- [ ] Reuse existing index maps and `weaponEvolutionData` / `synergyData` already passed through `PauseView`.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseLoadoutContent.test.js`
  Expected: PASS.

### Task 5: Update pause section shells for the new tab layout

**Files:**
- Modify: `src/ui/pause/pauseViewSections.js`
- Modify: `tests/PauseAndInputSource.test.js`

- [ ] Change tab navigation to `로드아웃`, `스탯`, `사운드`.
- [ ] Replace the old weapon/accessory panel wrappers with one loadout panel shell that can host:
  - left list container
  - right detail container
- [ ] Keep header/footer helpers intact unless a small markup adjustment is required by the new structure.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseAndInputSource.test.js`
  Expected: PASS for the new tab/panel source assertions; other existing assertions remain green.

### Task 6: Commit the helper-layer milestone

**Files:**
- Create: `src/ui/pause/pauseLoadoutContent.js`
- Modify: `src/ui/pause/pauseViewSections.js`
- Modify: `tests/PauseAndInputSource.test.js`
- Create: `tests/PauseLoadoutContent.test.js`

- [ ] Re-read `pauseLoadoutContent.js` and verify it stays UI-only and does not introduce test-only exports.
- [ ] Commit:

```bash
git add src/ui/pause/pauseLoadoutContent.js src/ui/pause/pauseViewSections.js tests/PauseAndInputSource.test.js tests/PauseLoadoutContent.test.js
git commit -m "feat: add ESC loadout rendering helpers"
```

## Chunk 3: Integrate The New Loadout Flow Into PauseView

### Task 7: Add selected-item state and render integration to PauseView

**Files:**
- Modify: `src/ui/pause/PauseView.js`
- Modify: `src/ui/pause/pauseViewSections.js`
- Modify: `src/ui/pause/pauseLoadoutContent.js`
- Test: `tests/PauseAndInputSource.test.js`
- Test: `tests/PauseLoadoutContent.test.js`

- [ ] Add `PauseView` state for the selected loadout item.
- [ ] On `show()`, compute loadout items and initialize selection from the new helper fallback.
- [ ] Replace the old `weaponCardsHtml` / `accessoryGridHtml` rendering path with a single loadout panel render path.
- [ ] Keep `stats` and `sound` rendering behavior intact.
- [ ] Run:
  - `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseLoadoutContent.test.js`
  - `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseAndInputSource.test.js`
  Expected: PASS.

### Task 8: Wire click/focus selection behavior and shrink tooltip responsibility

**Files:**
- Modify: `src/ui/pause/PauseView.js`
- Modify: `src/ui/pause/pauseTooltipContent.js`
- Modify: `tests/ResultAndProgressionSource.test.js`

- [ ] Bind click handlers for loadout cards so selecting a card refreshes the detail panel without reopening the modal.
- [ ] Ensure keyboard focus can follow the same selection path or, at minimum, updates selected styling predictably on focus.
- [ ] Reduce tooltip content to supplementary detail only. The detail panel must contain the core explanation even when no tooltip is shown.
- [ ] Update source assertions so they validate the new intended behavior instead of the old “minimal card only” layout.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/ResultAndProgressionSource.test.js`
  Expected: PASS.

### Task 9: Rework PauseView styles for unified cards and responsive master-detail layout

**Files:**
- Modify: `src/ui/pause/PauseView.js`
- Test: `tests/PauseAndInputSource.test.js`

- [ ] Replace separate weapon-list/accessory-grid styling with shared loadout card primitives.
- [ ] Add state styling for selected, rare, synergy-active, evolution-ready, empty slot, and locked slot.
- [ ] Add responsive breakpoints so desktop uses two columns and narrow widths collapse to a vertical stack.
- [ ] Preserve footer stacking behavior and keep sound/stats layouts functional at small widths.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/PauseAndInputSource.test.js`
  Expected: PASS.

### Task 10: Commit the integrated PauseView redesign

**Files:**
- Modify: `src/ui/pause/PauseView.js`
- Modify: `src/ui/pause/pauseTooltipContent.js`
- Modify: `tests/ResultAndProgressionSource.test.js`

- [ ] Manually skim `PauseView.js` for AGENTS violations:
  - no combat-rule logic
  - no session mutation
  - no module-level mutable UI caches beyond existing style guard patterns
- [ ] Commit:

```bash
git add src/ui/pause/PauseView.js src/ui/pause/pauseTooltipContent.js tests/ResultAndProgressionSource.test.js
git commit -m "feat: redesign ESC loadout panel"
```

## Chunk 4: Full Verification And Project Notes

### Task 11: Run targeted regression tests

**Files:**
- Test: `tests/PauseAndInputSource.test.js`
- Test: `tests/PauseLoadoutContent.test.js`
- Test: `tests/ResultAndProgressionSource.test.js`
- Test: `tests/UiStructureSource.test.js`

- [ ] Run:

```bash
'/mnt/c/Program Files/nodejs/node.exe' tests/PauseAndInputSource.test.js
'/mnt/c/Program Files/nodejs/node.exe' tests/PauseLoadoutContent.test.js
'/mnt/c/Program Files/nodejs/node.exe' tests/ResultAndProgressionSource.test.js
'/mnt/c/Program Files/nodejs/node.exe' tests/UiStructureSource.test.js
```

- [ ] Confirm all four test files pass before moving on.

### Task 12: Run suite-level verification

**Files:**
- Test: `scripts/runTests.js`
- Test: build pipeline

- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' scripts/runTests.js`
  Expected: full test suite PASS.
- [ ] Run: `npm run build`
  Expected: build completes without new errors.

### Task 13: Optional browser smoke for the redesigned pause modal

**Files:**
- Verify runtime behavior only

- [ ] If a local static/dev server is already available, open a run and verify:
  - ESC opens the redesigned modal
  - the `로드아웃` tab is default
  - clicking different cards updates the detail panel
  - narrow viewport stacks list/detail without overlap
- [ ] If browser validation is blocked by the environment, record that explicitly instead of guessing.

### Task 14: Record the result in progress.md

**Files:**
- Modify: `progress.md`

- [ ] Add one concise dated entry describing:
  - loadout tab unification
  - selected detail panel introduction
  - responsive master-detail behavior
  - what was verified
  - any remaining browser-only risk

### Task 15: Commit the verification and notes

**Files:**
- Modify: `progress.md`

- [ ] Commit:

```bash
git add progress.md
git commit -m "docs: record ESC loadout redesign verification"
```
