# Runtime Event And Progression Consistency Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore runtime event consistency and progression bookkeeping so actual play matches the tested behavior and AGENTS.md architecture intent.

**Architecture:** Keep combat and progression systems event-driven, but make `EVENT_TYPES` the true runtime SSOT again. Move run-stat aggregation out of ad hoc event side effects and into the end-of-run result handler, and let progression systems consume injected `data` so cloned/overridden game data actually affects gameplay.

**Tech Stack:** ES modules, custom test runner, DOM/canvas game runtime

---

### Task 1: Add Failing Coverage For Runtime/Event Drift

**Files:**
- Modify: `tests/PlayResultHandler.test.js`
- Modify: `tests/WeaponEvolution.test.js`
- Modify: `tests/SpawnSystem.test.js`

- [ ] **Step 1: Write failing tests**
  Add assertions that:
  `createWorld()` exposes `weaponEvolved` and `bossSpawned` queues,
  boss spawn emits `bossSpawned`,
  `PlayResultHandler` increments `totalRuns` once for victory and defeat.

- [ ] **Step 2: Run targeted tests to verify they fail**
  Run:
  `node scripts/runTests.js tests/WeaponEvolution.test.js tests/SpawnSystem.test.js tests/PlayResultHandler.test.js`

- [ ] **Step 3: Implement minimal runtime fixes**
  Update event constants/world initialization, spawn event emission, and run-result accounting.

- [ ] **Step 4: Re-run targeted tests to verify they pass**

### Task 2: Align Progression Systems With Injected Data

**Files:**
- Modify: `src/systems/progression/UpgradeSystem.js`
- Modify: `src/systems/progression/UpgradeApplySystem.js`
- Modify: `src/systems/progression/LevelSystem.js`
- Modify: `src/systems/progression/WeaponEvolutionSystem.js`
- Modify: `tests/UpgradeApplySystem.test.js`
- Modify: `tests/WeaponEvolution.test.js`

- [ ] **Step 1: Write failing tests**
  Assert that upgrade/evolution logic uses injected `data` rather than only module-level defaults.

- [ ] **Step 2: Run targeted tests to verify they fail**

- [ ] **Step 3: Implement minimal code**
  Thread `data.upgradeData`, `data.weaponData`, `data.accessoryData`, and `data.weaponEvolutionData` through progression code paths where needed.

- [ ] **Step 4: Re-run targeted tests to verify they pass**

### Task 3: Verify Whole Runtime

**Files:**
- Modify: none expected unless cleanup is needed

- [ ] **Step 1: Run the full suite**
  Run:
  `npm test -- --runInBand`

- [ ] **Step 2: Fix any regression introduced by the runtime consistency work**

- [ ] **Step 3: Re-run the full suite and confirm all green**
