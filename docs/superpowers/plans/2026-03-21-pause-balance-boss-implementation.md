# Pause, Balance, and Boss Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved gameplay/UI bundle for accessory rebalance, pause-modal improvements, projectile lifetime progression, reduced death-SFX spam, and 5-minute boss cadence with 6-boss victory handling.

**Architecture:** Keep data-driven balance and boss schedule changes in `src/data/`, keep scene-owned state transitions in `PlayScene`, and keep combat/sound rules inside their systems or event handlers. UI views emit intent only; they do not mutate `world` directly.

**Tech Stack:** HTML/CSS/JavaScript, Vite, custom test runner via `node scripts/runTests.js`

---

## File Map

- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/accessoryData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/permanentUpgradeData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/upgradeData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/entities/createPlayer.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/state/createWorld.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/PlayScene.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/play/PlayResultHandler.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/ui/result/ResultView.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/ui/pause/PauseView.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/progression/UpgradeSystem.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/weaponBehaviorUtils.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/orbit.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/boomerangWeapon.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/sound/soundEventHandler.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/bossData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/combat/DeathSystem.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/spawn/SpawnSystem.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/UpgradeSystem.test.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/WeaponSystem.test.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/DeathSystem.test.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/BossPhaseSystem.test.js`
- Create: `/mnt/c/Users/mjuik/AshenRequiem/tests/PauseView.test.js`
- Create: `/mnt/c/Users/mjuik/AshenRequiem/tests/SpawnSystem.test.js` additions for boss cadence if existing coverage is insufficient

## Chunk 1: Run Outcome, Boss Cadence, and Victory

### Task 1: Add run outcome state and result routing

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/state/createWorld.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/PlayScene.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/play/PlayResultHandler.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/ui/result/ResultView.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/DeathSystem.test.js`

- [ ] **Step 1: Write the failing test for non-player run outcomes**

Add a focused test showing that a non-death run end can still produce a result state with explicit outcome data.

```js
test('run outcome defaults to defeat and can be overridden to victory', () => {
  const world = makeWorld({ runOutcome: 'victory' });
  assert.equal(world.runOutcome, 'victory');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/DeathSystem.test.js`

Expected: FAIL because `runOutcome` does not exist yet on `world` or result routing does not consume it.

- [ ] **Step 3: Add minimal world/result outcome plumbing**

Implement:

- `world.runOutcome` default state in `createWorld`
- result processing returning `runOutcome`
- result UI accepting `runOutcome` and rendering victory/defeat title/text
- `PlayScene` passing outcome through to `ResultView`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/DeathSystem.test.js`

Expected: PASS for the added case and no regression in existing death tests.

- [ ] **Step 5: Commit**

```bash
git add src/state/createWorld.js src/scenes/PlayScene.js src/scenes/play/PlayResultHandler.js src/ui/result/ResultView.js tests/DeathSystem.test.js
git commit -m "feat: add explicit run outcome handling"
```

### Task 2: Implement 5-minute boss schedule and 6-boss victory

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/bossData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/spawn/SpawnSystem.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/combat/DeathSystem.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/PlayScene.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/SpawnSystem.test.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/DeathSystem.test.js`

- [ ] **Step 1: Write failing boss cadence tests**

Add tests that assert:

- bosses spawn only at `300, 600, 900, 1200, 1500, 1800`
- the 6th boss death marks the run as `victory`

```js
test('bosses spawn every 300 seconds', () => {
  // elapsedTime = 300 should enqueue a boss spawn
});

test('6th boss kill ends run in victory', () => {
  // bossKillCount 5 + one more boss death => runOutcome victory
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/SpawnSystem.test.js tests/DeathSystem.test.js`

Expected: FAIL because current schedule is `90/210` and victory flow does not exist.

- [ ] **Step 3: Implement data-driven boss schedule and victory counter**

Implement:

- `bossData` entries for six 5-minute marks
- `world.bossKillCount` state
- boss death increments on `world`
- on boss kill count `=== 6`, mark `world.runOutcome = 'victory'` and route out of gameplay without faking player death

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/SpawnSystem.test.js tests/DeathSystem.test.js`

Expected: PASS with the new cadence and victory condition.

- [ ] **Step 5: Commit**

```bash
git add src/data/bossData.js src/systems/spawn/SpawnSystem.js src/systems/combat/DeathSystem.js src/scenes/PlayScene.js tests/SpawnSystem.test.js tests/DeathSystem.test.js
git commit -m "feat: add 5-minute bosses and victory condition"
```

## Chunk 2: Balance, Progression, and Level-Up Text

### Task 3: Rebalance accessories to linear progression and add projectile lifetime stat

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/accessoryData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/permanentUpgradeData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/entities/createPlayer.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/progression/UpgradeSystem.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write failing progression tests**

Add tests for:

- accessory upgrades add linear deltas
- projectile lifetime accessory applies player stat
- projectile lifetime permanent upgrade applies at player creation

```js
test('projectile lifetime accessory upgrade increases player stat linearly', () => {
  // apply accessory + upgrade and assert stat changes by expected fixed delta
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/UpgradeSystem.test.js`

Expected: FAIL because player has no projectile lifetime stat and new accessory/meta items do not exist.

- [ ] **Step 3: Implement stat/data changes**

Implement:

- linear value tables via base + `valuePerLevel` rebalance in `accessoryData`
- new projectile lifetime accessory
- new projectile lifetime permanent upgrade
- `createPlayer` default stat field such as `projectileLifetimeMult` or equivalent
- `UpgradeSystem` application support for the new stat
- `applyPermanentUpgrades` support for the new stat

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/UpgradeSystem.test.js`

Expected: PASS for new progression cases and existing upgrade behavior.

- [ ] **Step 5: Commit**

```bash
git add src/data/accessoryData.js src/data/permanentUpgradeData.js src/entities/createPlayer.js src/systems/progression/UpgradeSystem.js tests/UpgradeSystem.test.js
git commit -m "feat: rebalance accessories and add projectile lifetime progression"
```

### Task 4: Replace vague accessory-upgrade text with concrete delta text

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/accessoryData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/data/upgradeData.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/ui/levelup/LevelUpView.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/UpgradeSystem.test.js`

- [ ] **Step 1: Write failing description-generation tests**

Add tests that assert `accessory_upgrade` options produce concrete text such as `이동 속도 증가 10%` or the flat-stat equivalent rather than `효과 강화`.

```js
test('accessory upgrade description is concrete and not generic', () => {
  // assert description does not equal '효과 강화'
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/UpgradeSystem.test.js`

Expected: FAIL because current text is still generic.

- [ ] **Step 3: Implement generated descriptions**

Implement a helper-driven approach that:

- derives next-level delta from accessory data
- populates `upgradeData` descriptions without hardcoded vague strings
- keeps `LevelUpView` dumb, only rendering provided text

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/UpgradeSystem.test.js`

Expected: PASS with concrete descriptions for accessory level-up cards.

- [ ] **Step 5: Commit**

```bash
git add src/data/accessoryData.js src/data/upgradeData.js src/ui/levelup/LevelUpView.js tests/UpgradeSystem.test.js
git commit -m "feat: generate concrete level-up descriptions"
```

### Task 5: Apply projectile lifetime stat at projectile spawn points

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/weaponBehaviorUtils.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/orbit.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/behaviors/weaponBehaviors/boomerangWeapon.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/WeaponSystem.test.js`

- [ ] **Step 1: Write failing projectile lifetime tests**

Add tests covering at least one bounded projectile spawn path and one orbit-style lifetime path.

```js
test('projectile lifetime stat scales spawned projectile maxLifetime', () => {
  // player stat > 1 should increase maxLifetime in spawnQueue config
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/WeaponSystem.test.js`

Expected: FAIL because spawn helpers ignore lifetime stat today.

- [ ] **Step 3: Implement minimal lifetime scaling**

Implement a shared helper for lifetime scaling and use it only where projectile lifetime semantics already exist.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/WeaponSystem.test.js`

Expected: PASS for lifetime scaling without regressing cooldown/proj-count behavior.

- [ ] **Step 5: Commit**

```bash
git add src/behaviors/weaponBehaviors/weaponBehaviorUtils.js src/behaviors/weaponBehaviors/orbit.js src/behaviors/weaponBehaviors/boomerangWeapon.js tests/WeaponSystem.test.js
git commit -m "feat: scale projectile lifetime from player progression"
```

## Chunk 3: Pause Modal UX and Sound Output Control

### Task 6: Add quick-audio tab and fix pause-modal interaction bugs

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/ui/pause/PauseView.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/scenes/PlayScene.js`
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/state/createSessionState.js` only if default option normalization needs support changes
- Create: `/mnt/c/Users/mjuik/AshenRequiem/tests/PauseView.test.js`

- [ ] **Step 1: Write failing pause-view tests**

Add targeted tests for:

- scrollability / pointer-event behavior
- tooltip target registration on weapon and accessory cards
- quick audio callbacks
- forfeit callback
- gold-related stat rendering

```js
test('pause view exposes quick audio controls and forfeit action', () => {
  // render view and assert controls/callbacks exist
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/PauseView.test.js`

Expected: FAIL because the quick-audio tab, forfeit action, and current interaction fixes are missing.

- [ ] **Step 3: Implement pause modal changes**

Implement:

- `Sound` tab using the approved quick-audio layout
- `master/bgm/sfx` sliders
- `BGM/SFX` toggles
- immediate callback pathway to `PlayScene`
- `전투 포기` button emitting forfeit intent
- scroll fix by enabling pointer events and proper overflow container behavior
- tooltip fix by ensuring hover/focus targets remain interactive
- gold/currency stats in the stats tab

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/PauseView.test.js`

Expected: PASS for pause view interactions.

- [ ] **Step 5: Commit**

```bash
git add src/ui/pause/PauseView.js src/scenes/PlayScene.js tests/PauseView.test.js
git commit -m "feat: expand pause modal with quick audio and forfeit"
```

### Task 7: Reduce death SFX spam without touching combat event emission

**Files:**
- Modify: `/mnt/c/Users/mjuik/AshenRequiem/src/systems/sound/soundEventHandler.js`
- Test: `/mnt/c/Users/mjuik/AshenRequiem/tests/DeathSystem.test.js`

- [ ] **Step 1: Write failing sound-throttle tests**

Add a test that simulates rapid `deaths` events and asserts the sound handler does not attempt one playback per enemy kill burst.

```js
test('death sound playback is throttled during kill bursts', () => {
  // fake sound system and registry, emit many deaths, assert limited plays
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/DeathSystem.test.js`

Expected: FAIL because current handler plays one death sound for every death event.

- [ ] **Step 3: Implement output-layer throttling**

Implement a simple timestamp/cooldown or burst-coalescing strategy inside `registerSoundEventHandlers`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/DeathSystem.test.js`

Expected: PASS with materially lower playback frequency.

- [ ] **Step 5: Commit**

```bash
git add src/systems/sound/soundEventHandler.js tests/DeathSystem.test.js
git commit -m "fix: throttle enemy death sound playback"
```

## Chunk 4: Final Verification and Cleanup

### Task 8: Run focused automated verification

**Files:**
- No code changes required unless failures are found

- [ ] **Step 1: Run focused suite**

Run:

```bash
npm test -- tests/UpgradeSystem.test.js tests/WeaponSystem.test.js tests/DeathSystem.test.js tests/SpawnSystem.test.js tests/PauseView.test.js
```

Expected: PASS

- [ ] **Step 2: Run full suite**

Run:

```bash
npm test
```

Expected: PASS

- [ ] **Step 3: Run data validation**

Run:

```bash
npm run validate
```

Expected: PASS

- [ ] **Step 4: Manual verification**

Check in the running game:

- pause modal mouse wheel / trackpad scroll works
- weapon/accessory tooltips appear in pause modal
- audio sliders/toggles update live while paused
- forfeit leads to defeat result screen
- 6th boss kill leads to victory result screen
- new projectile lifetime accessory and permanent upgrade both affect felt projectile duration

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "test: verify pause balance and boss expansion"
```

## Notes for Execution

- Keep all balance tuning data-driven. Do not hardcode per-accessory level text in `PauseView` or `LevelUpView`.
- Do not let `PauseView` mutate `world`; send callbacks to `PlayScene`.
- Keep session persistence in scene/result/infrastructure flow, not combat systems.
- If a separate victory play mode becomes too invasive, keep play mode transition minimal but carry `runOutcome` explicitly so victory is not guessed from `dead`.
