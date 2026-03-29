# Game Studio Operability Push Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the browser-game operating surface with richer encounter authoring metrics, a first-class asset manifest, stronger gameplay smoke coverage, better onboarding/result feedback, and device-oriented performance presets.

**Architecture:** Keep simulation, UI, scripts, and validation boundaries intact. Add new domain/data helpers instead of pushing logic into scenes or renderers, and route new checks through existing validation, smoke, and result-summary seams.

**Tech Stack:** HTML, JavaScript ES modules, Vite, Node test runner, deterministic browser smoke scripts

---

## Chunk 1: Encounter Authoring Metrics

### Task 1: Lock richer encounter report expectations

**Files:**
- Create: `tests/EncounterReport.test.js`
- Modify: `scripts/encounterReport.mjs`
- Create: `src/domain/play/encounter/encounterAuthoringMetrics.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `node scripts/runTests.js tests/EncounterReport.test.js` and verify failure**
- [ ] **Step 3: Implement metrics helper for stage pressure, reward cadence, boss windows, and wave throughput**
- [ ] **Step 4: Update `encounter:report` to print the richer metrics**
- [ ] **Step 5: Re-run `node scripts/runTests.js tests/EncounterReport.test.js` and verify pass**

## Chunk 2: Asset Manifest And Validation

### Task 2: Introduce a first-class asset manifest

**Files:**
- Create: `src/data/assetManifest.js`
- Modify: `src/data/GameDataLoader.js`
- Modify: `src/data/gameDataValidation.js`
- Modify: `scripts/validateData.js`
- Modify: `tests/GameDataValidation.test.js`
- Create: `tests/AssetManifest.test.js`

- [ ] **Step 1: Write failing tests for manifest presence, loader exposure, and validation errors**
- [ ] **Step 2: Run the targeted tests and verify failure**
- [ ] **Step 3: Implement manifest entries for UI, stage backgrounds, FX, and audio cues using stable keys**
- [ ] **Step 4: Thread the manifest through `GameDataLoader` and shared validation**
- [ ] **Step 5: Re-run targeted tests and verify pass**

## Chunk 3: Gameplay Smoke Coverage

### Task 3: Add mobile/touch and daily-seed smoke coverage

**Files:**
- Modify: `scripts/browser-smoke/scenarios.js`
- Modify: `scripts/browser-smoke/smokeScenarioRunners.mjs`
- Modify: `scripts/browser-smoke/smokePlayScenarios.mjs`
- Modify: `src/core/gameInputRuntime.js`
- Modify: `src/adapters/browser/runtimeHooks.js`
- Modify: `tests/BrowserSmokeSource.test.js`
- Create: `tests/GameInputRuntime.test.js`

- [ ] **Step 1: Write failing tests for new smoke scenarios and force-touch runtime support**
- [ ] **Step 2: Run targeted tests and verify failure**
- [ ] **Step 3: Implement touch smoke and daily-seed smoke scenarios**
- [ ] **Step 4: Add a browser-safe runtime path for forcing touch HUD during smoke**
- [ ] **Step 5: Re-run targeted tests and verify pass**

## Chunk 4: Onboarding And Result Feedback

### Task 4: Surface recommended-build rationale and death recap

**Files:**
- Modify: `src/domain/play/encounter/runGuidanceDomain.js`
- Modify: `src/domain/meta/progression/playResultDomain.js`
- Modify: `src/ui/result/resultViewMarkup.js`
- Modify: `tests/WorldState.test.js`
- Modify: `tests/ResultAndProgressionSource.test.js`
- Modify: `tests/PlayResultHandler.test.js`

- [ ] **Step 1: Write failing tests for richer guidance snapshot and result recap output**
- [ ] **Step 2: Run targeted tests and verify failure**
- [ ] **Step 3: Implement recommended-build rationale data and death recap summary**
- [ ] **Step 4: Render the new feedback in the result surface without mutating runtime ownership**
- [ ] **Step 5: Re-run targeted tests and verify pass**

## Chunk 5: Device-Oriented Performance Presets

### Task 5: Expand performance presets for browser operating targets

**Files:**
- Modify: `scripts/profileRuntime.js`
- Modify: `tests/ProfileRuntime.test.js`
- Modify: `docs/architecture-current.md`

- [ ] **Step 1: Write failing tests for new profile preset IDs and budget metadata**
- [ ] **Step 2: Run targeted tests and verify failure**
- [ ] **Step 3: Implement mobile/stress presets with clear budgets**
- [ ] **Step 4: Update architecture docs snapshot if the generated verification section changes**
- [ ] **Step 5: Re-run targeted tests and verify pass**

## Chunk 6: Final Verification

### Task 6: Prove the integrated result

**Files:**
- Modify: `docs/architecture-current.md` as needed by snapshot drift

- [ ] **Step 1: Run targeted tests for each chunk**
- [ ] **Step 2: Run `npm test`**
- [ ] **Step 3: Run `npm run validate`**
- [ ] **Step 4: Run `npm run lint`**
- [ ] **Step 5: Run `npm run verify:fast` or explain the exact blocker if it fails**
