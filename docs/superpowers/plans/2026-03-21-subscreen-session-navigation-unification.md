# Subscreen Session Navigation Unification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify subscene navigation guards, centralize scene-side session persistence, and move Codex/Settings/MetaShop onto a shared visual shell.

**Architecture:** Add a small scene navigation helper for guarded async transitions, add a session facade for scene-owned writes and persistence, and add a shared subscreen theme module that exports common CSS/tokens for DOM-based subviews. Refactor existing scenes/views to consume those helpers without changing gameplay/system responsibilities.

**Tech Stack:** Vanilla ES modules, DOM-based views, existing custom Node test runner, source-based regression tests.

---

## Chunk 1: Shared Helpers

### Task 1: Navigation guard helper

**Files:**
- Create: `src/scenes/sceneNavigation.js`
- Test: `tests/SceneNavigation.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `'/mnt/c/Program Files/nodejs/node.exe' --experimental-vm-modules tests/SceneNavigation.test.js` and verify failure**
- [ ] **Step 3: Implement minimal navigation guard helper**
- [ ] **Step 4: Re-run the test and verify pass**

### Task 2: Session facade

**Files:**
- Create: `src/state/sessionFacade.js`
- Test: `tests/SessionFacade.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `'/mnt/c/Program Files/nodejs/node.exe' --experimental-vm-modules tests/SessionFacade.test.js` and verify failure**
- [ ] **Step 3: Implement minimal scene-side session facade**
- [ ] **Step 4: Re-run the test and verify pass**

### Task 3: Shared subscreen theme

**Files:**
- Create: `src/ui/shared/subscreenTheme.js`
- Test: `tests/SubscreenTheme.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `'/mnt/c/Program Files/nodejs/node.exe' --experimental-vm-modules tests/SubscreenTheme.test.js` and verify failure**
- [ ] **Step 3: Implement shared theme tokens/CSS helpers**
- [ ] **Step 4: Re-run the test and verify pass**

## Chunk 2: Refactor Callers

### Task 4: Refactor scenes to use shared helpers

**Files:**
- Modify: `src/scenes/SettingsScene.js`
- Modify: `src/scenes/CodexScene.js`
- Modify: `src/scenes/MetaShopScene.js`
- Modify: `src/scenes/TitleScene.js`
- Modify: `src/scenes/play/PlayResultHandler.js`
- Test: `tests/SceneInfrastructureSource.test.js`

- [ ] **Step 1: Write the failing source test**
- [ ] **Step 2: Run `'/mnt/c/Program Files/nodejs/node.exe' --experimental-vm-modules tests/SceneInfrastructureSource.test.js` and verify failure**
- [ ] **Step 3: Refactor scene navigation and session writes**
- [ ] **Step 4: Re-run the source test and verify pass**

### Task 5: Refactor views to use shared shell styling

**Files:**
- Modify: `src/ui/codex/CodexView.js`
- Modify: `src/ui/settings/SettingsView.js`
- Modify: `src/ui/metashop/MetaShopView.js`
- Modify: `tests/TitleAndCodexSource.test.js`

- [ ] **Step 1: Update the failing source assertions around shared theme usage**
- [ ] **Step 2: Run relevant source tests and verify failure**
- [ ] **Step 3: Apply shared shell styling and visual polish**
- [ ] **Step 4: Re-run source tests and verify pass**

## Chunk 3: Verification

### Task 6: Regression verification

**Files:**
- Modify: `tests/SessionState.test.js` (only if needed)
- Run: `tests/SceneNavigation.test.js`
- Run: `tests/SessionFacade.test.js`
- Run: `tests/SubscreenTheme.test.js`
- Run: `tests/SceneInfrastructureSource.test.js`
- Run: `tests/TitleAndCodexSource.test.js`
- Run: `scripts/runTests.js`

- [ ] **Step 1: Run focused helper/source tests**
- [ ] **Step 2: Run `'/mnt/c/Program Files/nodejs/node.exe' scripts/runTests.js`**
- [ ] **Step 3: Confirm 0 failures and summarize the final boundaries**
