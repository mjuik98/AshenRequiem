# Start Weapon Selection And Unlock System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven unlock system plus a start-weapon selection flow so newly unlocked weapons/accessories appear from the next run onward and players can choose their starting weapon before entering combat.

**Architecture:** Unlock definitions live in a dedicated data file, unlock evaluation runs only at result processing, and session meta becomes the source of truth for unlocked content and the selected start weapon. Scene/UI code only drives flow and rendering; combat systems remain unaware of unlock state beyond the already-recorded codex stats.

**Tech Stack:** HTML/CSS/JavaScript (ES modules), existing scene/view architecture, session persistence in localStorage, project custom test runner.

---

## File Responsibilities

- `src/data/unlockData.js`
  - New unlock definitions for weapons/accessories.
- `src/state/createSessionState.js`
  - Session version bump, default unlock fields, migration.
- `src/systems/progression/unlockEvaluator.js`
  - Pure unlock evaluation logic.
- `src/scenes/play/PlayResultHandler.js`
  - Invoke unlock evaluation and persist newly unlocked rewards.
- `src/entities/createPlayer.js`
  - Build the initial weapon from `session.meta.selectedStartWeaponId`.
- `src/systems/progression/UpgradeSystem.js`
  - Gate weapon/accessory choice pools by unlocked state.
- `src/ui/title/StartLoadoutView.js`
  - New modal for selecting the start weapon.
- `src/scenes/TitleScene.js`
  - Open start-loadout UI before entering `PlayScene`.
- `src/ui/codex/CodexView.js`
  - Show unlock progress and reward state.
- `src/systems/event/codexHandler.js`
  - Keep using existing codex stats; only extend if an unlock condition lacks a source.
- `tests/SessionState.test.js`
  - Migration/default tests for unlock meta fields.
- `tests/UnlockEvaluator.test.js`
  - New unlock evaluator tests.
- `tests/UpgradeSystem.test.js`
  - Verify locked content is filtered out.
- `tests/StartWeapon.test.js`
  - New create-player/start-weapon tests.
- `tests/CodexViewSource.test.js` or a similarly scoped UI-source test
  - Verify unlock section wiring appears.

## Chunk 1: Session And Unlock Data

### Task 1: Add unlock session fields

**Files:**
- Modify: `src/state/createSessionState.js`
- Test: `tests/SessionState.test.js`

- [ ] **Step 1: Write the failing test**

Add tests that assert:
- new sessions default `meta.unlockedWeapons` to `['magic_bolt']`
- new sessions default `meta.unlockedAccessories` to `[]`
- new sessions default `meta.completedUnlocks` to `[]`
- new sessions default `meta.selectedStartWeaponId` to `'magic_bolt'`

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: FAIL because the new fields do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Update `src/state/createSessionState.js` to:
- bump session version
- include the new meta defaults
- migrate older session data safely
- preserve all existing codex/meta fields

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/createSessionState.js tests/SessionState.test.js
git commit -m "feat: add unlock session fields"
```

### Task 2: Create unlock data source

**Files:**
- Create: `src/data/unlockData.js`
- Test: `tests/UnlockEvaluator.test.js`

- [ ] **Step 1: Write the failing test**

Create a test file that imports `unlockData` and asserts:
- it exports at least one weapon unlock and one accessory unlock
- all unlock IDs are unique
- only approved condition types are used

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UnlockEvaluator.test.js`
Expected: FAIL because `unlockData.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/data/unlockData.js` with a small initial unlock set such as:
- `unlock_boomerang` via `total_kills_gte`
- `unlock_lightning_ring` via `boss_kills_gte`
- `unlock_arcane_prism` via `weapon_owned_once`
- `unlock_persistence_charm` via `survival_time_gte`

Use explicit fields:
- `id`
- `targetType`
- `targetId`
- `conditionType`
- `conditionValue`
- `title`
- `description`
- `rewardText`

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UnlockEvaluator.test.js`
Expected: PASS for the data-shape assertions

- [ ] **Step 5: Commit**

```bash
git add src/data/unlockData.js tests/UnlockEvaluator.test.js
git commit -m "feat: add unlock data definitions"
```

## Chunk 2: Unlock Evaluation And Result Integration

### Task 3: Implement unlock evaluator

**Files:**
- Create: `src/systems/progression/unlockEvaluator.js`
- Modify: `tests/UnlockEvaluator.test.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/UnlockEvaluator.test.js` to cover:
- `total_kills_gte`
- `survival_time_gte`
- `boss_kills_gte`
- `weapon_owned_once`
- `weapon_evolved_once`
- completed unlocks are not emitted twice

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UnlockEvaluator.test.js`
Expected: FAIL because evaluator logic is missing.

- [ ] **Step 3: Write minimal implementation**

Create `evaluateUnlocks({ session, runResult, unlockData })` that:
- reads session meta
- checks unlock conditions
- skips already completed unlocks
- returns `newlyCompletedUnlocks`, `newlyUnlockedWeapons`, `newlyUnlockedAccessories`

Keep it pure and side-effect free.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UnlockEvaluator.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/progression/unlockEvaluator.js tests/UnlockEvaluator.test.js
git commit -m "feat: add unlock evaluator"
```

### Task 4: Integrate unlock evaluation into result flow

**Files:**
- Modify: `src/scenes/play/PlayResultHandler.js`
- Modify: `tests/SessionState.test.js`
- Modify: `tests/DeathSystem.test.js` only if result assumptions need adjustment

- [ ] **Step 1: Write the failing test**

Add a test that simulates a completed run and asserts:
- newly completed unlocks are added to `session.meta.completedUnlocks`
- reward IDs are inserted into `unlockedWeapons` or `unlockedAccessories`
- result saving still occurs through the existing path

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: FAIL because result integration is not present.

- [ ] **Step 3: Write minimal implementation**

Update `PlayResultHandler.process()` to:
- build `runResult`
- evaluate unlocks
- append new unlock IDs without duplicates
- save once through the existing result path

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scenes/play/PlayResultHandler.js tests/SessionState.test.js
git commit -m "feat: award unlocks at run end"
```

## Chunk 3: Start Weapon Selection

### Task 5: Make player creation respect the selected start weapon

**Files:**
- Modify: `src/entities/createPlayer.js`
- Create: `tests/StartWeapon.test.js`

- [ ] **Step 1: Write the failing test**

Create tests asserting:
- selected start weapon is used when unlocked
- invalid or missing selection falls back to `magic_bolt`
- created player still starts with one weapon only

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/StartWeapon.test.js`
Expected: FAIL because `createPlayer()` always hardcodes `magic_bolt`.

- [ ] **Step 3: Write minimal implementation**

Update `createPlayer()` to:
- read `session.meta.selectedStartWeaponId`
- validate it against weapon data
- optionally validate it against `session.meta.unlockedWeapons`
- fallback to `magic_bolt`

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/StartWeapon.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/entities/createPlayer.js tests/StartWeapon.test.js
git commit -m "feat: support selected start weapon"
```

### Task 6: Add start loadout modal

**Files:**
- Create: `src/ui/title/StartLoadoutView.js`
- Modify: `src/scenes/TitleScene.js`
- Test: `tests/StartWeapon.test.js` or `tests/TitleSceneSource.test.js`

- [ ] **Step 1: Write the failing test**

Add a source-level or behavior test that asserts:
- `TitleScene` no longer enters `PlayScene` immediately on `Start Game`
- a loadout view path exists
- loadout cards are built from unlocked start weapons only

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/StartWeapon.test.js`
Expected: FAIL because no loadout modal exists.

- [ ] **Step 3: Write minimal implementation**

Create `StartLoadoutView.js` with:
- weapon list
- selected state
- confirm button
- cancel/back behavior

Update `TitleScene` so `Start Game` opens the view, saves `selectedStartWeaponId`, and only then transitions to `PlayScene`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/StartWeapon.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/title/StartLoadoutView.js src/scenes/TitleScene.js tests/StartWeapon.test.js
git commit -m "feat: add start weapon selection flow"
```

## Chunk 4: Gating Runtime Content And Codex Display

### Task 7: Gate level-up pools by unlock state

**Files:**
- Modify: `src/systems/progression/UpgradeSystem.js`
- Modify: `tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write the failing test**

Add tests asserting:
- locked weapons do not appear in `weapon_new` choices
- locked accessories do not appear in `accessory` choices
- unlocked items still follow existing slot/ownership rules

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: FAIL because unlock gating is absent.

- [ ] **Step 3: Write minimal implementation**

Update `UpgradeSystem.generateChoices()` / `_buildAvailablePool()` to consult:
- `player.session` if already available, or
- a passed-in unlock source, or
- a small adapter pattern if needed by current architecture

If needed, thread the unlocked pools through the world/player creation path in the smallest possible way.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/progression/UpgradeSystem.js tests/UpgradeSystem.test.js
git commit -m "feat: gate upgrade pools by unlock state"
```

### Task 8: Show unlock progress in codex

**Files:**
- Modify: `src/ui/codex/CodexView.js`
- Test: `tests/CodexViewSource.test.js`

- [ ] **Step 1: Write the failing test**

Create a source-level/UI test asserting:
- the records tab includes unlock progress text
- completed vs locked states are rendered
- reward text is visible

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/CodexViewSource.test.js`
Expected: FAIL because unlock UI does not exist.

- [ ] **Step 3: Write minimal implementation**

Extend `CodexView` records rendering with an unlock section that lists:
- unlock title
- condition description
- reward text
- completed/locked badge

Do not turn codex into an interactive reward claim screen; rewards are automatic.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/CodexViewSource.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/codex/CodexView.js tests/CodexViewSource.test.js
git commit -m "feat: show unlock progress in codex"
```

## Final Verification

- [ ] Run targeted tests:

```bash
PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js
PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UnlockEvaluator.test.js
PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/StartWeapon.test.js
PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js
PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/CodexViewSource.test.js
```

- [ ] Run full suite:

```bash
PATH="/tmp/node-bin:$PATH" node scripts/validateData.js
PATH="/tmp/node-bin:$PATH" node scripts/runTests.js
```

- [ ] Run production build:

```bash
PATH="/tmp/node-bin:$PATH" npm run build
```

- [ ] Manual verification checklist:
- start game opens start-weapon selection
- only unlocked starting weapons are selectable
- selected weapon is actually the starting weapon in combat
- completing an unlock condition updates codex and the next-run content pool
- locked items do not appear before unlock

- [ ] Final commit:

```bash
git add src tests docs/superpowers/plans/2026-03-21-start-weapon-unlock-implementation.md
git commit -m "feat: add start weapon selection and unlock system"
```
