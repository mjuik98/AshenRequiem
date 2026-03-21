# Level-Up Reroll And Banish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add meta-progression-backed reroll and banish actions to level-up / chest reward selection, plus a fixed-gold fallback choice when the normal pool is exhausted.

**Architecture:** Reroll/banish charges live in permanent upgrades and are copied into run-local world state at run start. Upgrade selection rules stay inside `UpgradeSystem`, while `LevelUpView` owns UI state and delegates slot-specific actions back through `PlayScene` callbacks. Banish is `upgrade.id` based and applies only to the current run.

**Tech Stack:** HTML/CSS/JavaScript (ES modules), existing DOM overlay UI, custom test runner, Vite build.

---

## File Responsibilities

- `src/data/permanentUpgradeData.js`
  - Add permanent upgrades for reroll and banish charges.
- `src/data/upgradeData.js`
  - Add fixed-gold fallback upgrade definition.
- `src/state/createWorld.js`
  - Add run-local reroll/banish state fields.
- `src/scenes/PlayScene.js`
  - Initialize run-local charges from session meta and wire level-up UI action callbacks.
- `src/scenes/play/PlayUI.js`
  - Expand LevelUpView interface to accept action state and callbacks.
- `src/ui/levelup/LevelUpView.js`
  - Render reroll buttons, banish mode UI, counters, and per-slot interactions.
- `src/systems/progression/UpgradeSystem.js`
  - Filter banished ids, generate non-duplicate fallback choices, and expose single-slot replacement helpers.
- `tests/UpgradeSystem.test.js`
  - Cover banished id exclusion, slot reroll uniqueness, and fallback uniqueness.
- `tests/SessionState.test.js`
  - Cover reroll/banish permanent upgrade defaults if needed through existing session meta path.
- `tests/TitleAndCodexSource.test.js`
  - Leave untouched unless shared source assertions are impacted.
- `tests/LevelUpViewSource.test.js`
  - New source-level assertions for reroll/banish UI strings and controls.

## Chunk 1: Meta Upgrades And Run State

### Task 1: Add reroll/banish permanent upgrades

**Files:**
- Modify: `src/data/permanentUpgradeData.js`
- Test: `tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write the failing test**

Add a test asserting:
- `permanentUpgradeData` contains `reroll_charge`
- `permanentUpgradeData` contains `banish_charge`

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: FAIL because the new permanent upgrade ids do not exist.

- [ ] **Step 3: Write minimal implementation**

Add two permanent upgrades to `src/data/permanentUpgradeData.js`:
- `reroll_charge`
- `banish_charge`

Use concise names, explicit descriptions, and existing cost/maxLevel patterns.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: PASS for the new data assertions.

- [ ] **Step 5: Commit**

```bash
git add src/data/permanentUpgradeData.js tests/UpgradeSystem.test.js
git commit -m "feat: add reroll and banish permanent upgrades"
```

### Task 2: Add run-local reroll/banish world state

**Files:**
- Modify: `src/state/createWorld.js`
- Modify: `src/scenes/PlayScene.js`
- Test: `tests/SessionState.test.js`

- [ ] **Step 1: Write the failing test**

Add a test asserting a new world starts with:
- `runRerollsRemaining === 0`
- `runBanishesRemaining === 0`
- `banishedUpgradeIds` as an empty array
- `levelUpActionMode === 'select'`

If the project has no direct world-state test yet, add this case to `tests/SessionState.test.js` or create a tight source/state test file.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: FAIL because the world fields do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Update `src/state/createWorld.js` to add:
- `runRerollsRemaining: 0`
- `runBanishesRemaining: 0`
- `banishedUpgradeIds: []`
- `levelUpActionMode: 'select'`

Update `src/scenes/PlayScene.js` so `enter()` initializes reroll/banish counts from:
- `session.meta.permanentUpgrades.reroll_charge`
- `session.meta.permanentUpgrades.banish_charge`

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/SessionState.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/createWorld.js src/scenes/PlayScene.js tests/SessionState.test.js
git commit -m "feat: add run reroll and banish state"
```

## Chunk 2: Upgrade Selection Rules

### Task 3: Add fixed-gold fallback upgrade

**Files:**
- Modify: `src/data/upgradeData.js`
- Test: `tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write the failing test**

Add a test asserting:
- `upgradeData` contains `stat_gold`
- its description is concrete and includes the fixed amount

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: FAIL because `stat_gold` does not exist.

- [ ] **Step 3: Write minimal implementation**

Add `stat_gold` to `src/data/upgradeData.js`:
- `type: 'stat'`
- fixed currency amount, recommended `25`
- explicit description like `골드 +25`

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/upgradeData.js tests/UpgradeSystem.test.js
git commit -m "feat: add gold fallback upgrade"
```

### Task 4: Banished ids must be excluded from the level-up pool

**Files:**
- Modify: `src/systems/progression/UpgradeSystem.js`
- Test: `tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write the failing test**

Add tests asserting:
- `_buildAvailablePool(player, options)` excludes upgrades whose `id` is in `banishedUpgradeIds`
- a banished fallback id is not emitted if alternatives exist

Use concrete ids like:
- `up_magic_bolt`
- `get_boomerang`

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: FAIL because banish filtering does not exist.

- [ ] **Step 3: Write minimal implementation**

Update `UpgradeSystem` to accept run options when building choices:
- `banishedUpgradeIds`
- `excludeChoiceIds`

Filter by `upgrade.id`, not by weapon/accessory family.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/progression/UpgradeSystem.js tests/UpgradeSystem.test.js
git commit -m "feat: exclude banished upgrades from levelup pool"
```

### Task 5: Add single-slot reroll and non-duplicate fallback selection

**Files:**
- Modify: `src/systems/progression/UpgradeSystem.js`
- Test: `tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write the failing test**

Add tests asserting:
- rerolling one slot does not duplicate the other visible choices
- rerolling respects `banishedUpgradeIds`
- when the normal pool is exhausted, `stat_heal` and `stat_gold` are used without duplicating each other

Model the visible choices array explicitly and reroll a specific index.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: FAIL because single-slot replacement helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add focused helpers to `UpgradeSystem`, for example:
- `generateChoices(player, options = {})`
- `replaceChoiceAtIndex(player, currentChoices, index, options = {})`

Rules:
- never duplicate other currently visible cards by `id`
- prefer normal pool
- only use fallback pool when needed
- allow `stat_heal` repetition only as a last-resort exhausted state if no other choice exists

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/systems/progression/UpgradeSystem.js tests/UpgradeSystem.test.js
git commit -m "feat: support slot reroll and unique fallback choices"
```

## Chunk 3: Level-Up UI Actions

### Task 6: Add failing source tests for reroll and banish UI

**Files:**
- Create: `tests/LevelUpViewSource.test.js`
- Test target: `src/ui/levelup/LevelUpView.js`

- [ ] **Step 1: Write the failing test**

Create a source test asserting `LevelUpView` includes:
- `리롤`
- `봉인 모드`
- `봉인할 카드를 선택하세요`
- counters for remaining rerolls/banishes

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: FAIL because the UI strings and controls are missing.

- [ ] **Step 3: Write minimal implementation placeholder**

Do not fully style yet. First extend `LevelUpView` markup to include:
- action bar
- reroll button area per card
- banish mode messaging

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/LevelUpViewSource.test.js src/ui/levelup/LevelUpView.js
git commit -m "test: add levelup reroll and banish ui coverage"
```

### Task 7: Make LevelUpView stateful enough for card actions

**Files:**
- Modify: `src/ui/levelup/LevelUpView.js`
- Modify: `src/scenes/play/PlayUI.js`
- Test: `tests/LevelUpViewSource.test.js`

- [ ] **Step 1: Write the failing test**

Extend the source test to assert:
- `LevelUpView.show()` accepts action state / callbacks
- card-level reroll handler names or wiring exist
- banish mode can be toggled and cancelled

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: FAIL because the interface is still too narrow.

- [ ] **Step 3: Write minimal implementation**

Update `LevelUpView` to own current modal state:
- `choices`
- `remainingRerolls`
- `remainingBanishes`
- `actionMode`

Expose callbacks:
- `onSelect(upgrade)`
- `onReroll(index)`
- `onToggleBanish()`
- `onBanish(index)`

Update `PlayUI.showLevelUp()` to forward the richer config object.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/levelup/LevelUpView.js src/scenes/play/PlayUI.js tests/LevelUpViewSource.test.js
git commit -m "feat: add levelup reroll and banish actions ui"
```

## Chunk 4: Scene Wiring And Verification

### Task 8: Wire reroll and banish actions through PlayScene

**Files:**
- Modify: `src/scenes/PlayScene.js`
- Test: `tests/UpgradeSystem.test.js`
- Test: `tests/LevelUpViewSource.test.js`

- [ ] **Step 1: Write the failing test**

Add tests or source assertions covering:
- `PlayScene` passes reroll/banish counters into the level-up view
- reroll decrements `world.runRerollsRemaining`
- banish decrements `world.runBanishesRemaining`
- banish inserts the chosen `upgrade.id` into `world.banishedUpgradeIds`
- banish resets `levelUpActionMode` to `select`

If direct scene unit tests are too expensive, add a focused source test file for `PlayScene` action wiring.

- [ ] **Step 2: Run test to verify it fails**

Run:
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: FAIL because callbacks are not connected.

- [ ] **Step 3: Write minimal implementation**

Update `PlayScene._showLevelUpUI()` to:
- pass current choices, counters, and action mode to `PlayUI`
- reroll a single slot via `UpgradeSystem.replaceChoiceAtIndex(...)`
- toggle banish mode
- banish a slot, replace it immediately, and reset mode
- keep standard select behavior untouched outside banish mode

- [ ] **Step 4: Run test to verify it passes**

Run:
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scenes/PlayScene.js tests/UpgradeSystem.test.js tests/LevelUpViewSource.test.js
git commit -m "feat: wire levelup reroll and banish flow"
```

### Task 9: Full verification

**Files:**
- Modify if needed: `progress.md`

- [ ] **Step 1: Run targeted tests**

Run:
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/UpgradeSystem.test.js`
- `PATH="/tmp/node-bin:$PATH" node --experimental-vm-modules tests/LevelUpViewSource.test.js`

Expected: PASS

- [ ] **Step 2: Run full suite**

Run: `PATH="/tmp/node-bin:$PATH" node scripts/runTests.js`
Expected: PASS

- [ ] **Step 3: Run build**

Run: `PATH="/tmp/node-bin:$PATH" npm run build`
Expected: PASS

- [ ] **Step 4: Update progress log**

Append the final implementation/testing note to `progress.md`.

- [ ] **Step 5: Commit**

```bash
git add progress.md
git commit -m "chore: verify levelup reroll and banish feature"
```
