# Start Weapon Selection And Unlock System Design

Date: 2026-03-21
Project: Ashen Requiem
Scope: Start weapon selection and codex/achievement-driven unlocks

## 1. Goal

Add a vampire-survivors-style progression layer where:

- the player can choose a starting weapon before a run
- new weapons and accessories can be unlocked through codex/achievement conditions
- unlocked content only appears from the next run onward
- locked weapons/accessories do not appear in level-up pools before they are unlocked

This spec intentionally excludes the following requests and treats them as follow-up work:

- further ESC modal card layout changes
- result screen button changes
- six unique bosses
- stronger late-game wave scaling

## 2. Recommended Approach

Use a data-driven unlock system.

Why:

- it matches the project rule of data-first expansion
- unlock rules remain editable without scattering logic through scenes and views
- it scales cleanly when more weapons, accessories, and achievements are added
- it keeps combat systems free of session mutation and unlock decisions

## 3. Player Flow

### 3.1 Start Weapon Selection

Run start flow:

1. User clicks `Start Game` in `TitleScene`
2. A lightweight `StartLoadoutView` modal opens
3. Only unlocked starting weapons are shown
4. User selects one weapon
5. Selection is stored in `session.meta.selectedStartWeaponId`
6. User presses `시작하기`
7. `PlayScene` starts and `createPlayer()` uses the selected start weapon

UX rules:

- keep the loadout view small and focused
- show icon, name, one-line description, and weapon-type tag only
- default selection is the current `selectedStartWeaponId`
- if nothing is set, default to `magic_bolt`
- `magic_bolt` is always unlocked

### 3.2 Unlock Flow

Unlock flow:

1. During runs, existing codex stats continue accumulating in `session.meta`
2. At run end, `PlayResultHandler` evaluates unlock conditions once
3. Newly completed unlocks are recorded in session
4. Rewards are added to unlocked pools
5. Newly unlocked items appear starting from the next run

Design rule:

- no mid-run unlock activation
- no combat system directly changes unlock state

## 4. Data Model

### 4.1 Session State Additions

Extend `session.meta` with:

- `unlockedWeapons: string[]`
- `unlockedAccessories: string[]`
- `completedUnlocks: string[]`
- `selectedStartWeaponId: string`

Defaults:

- `unlockedWeapons = ['magic_bolt']`
- `unlockedAccessories = []`
- `completedUnlocks = []`
- `selectedStartWeaponId = 'magic_bolt'`

Migration:

- add a new session version
- migrate older saves by injecting the fields above
- preserve all existing meta progress fields

### 4.2 Unlock Data

Create `src/data/unlockData.js`.

Each entry should include:

- `id`
- `targetType` as `'weapon' | 'accessory'`
- `targetId`
- `conditionType`
- `conditionValue`
- `title`
- `description`
- `rewardText`

Example shapes:

```js
{
  id: 'unlock_boomerang',
  targetType: 'weapon',
  targetId: 'boomerang',
  conditionType: 'total_kills_gte',
  conditionValue: 500,
  title: '곡예의 각성',
  description: '총 500킬 달성',
  rewardText: '시작 무기 및 런 중 등장 무기에 부메랑 해금',
}
```

```js
{
  id: 'unlock_persistence_charm',
  targetType: 'accessory',
  targetId: 'persistence_charm',
  conditionType: 'survival_time_gte',
  conditionValue: 600,
  title: '시간을 버틴 자',
  description: '한 런에서 10분 생존',
  rewardText: '지속의 부적 해금',
}
```

## 5. Supported Condition Types

Version 1 supports only simple, single-axis conditions.

Allowed types:

- `total_kills_gte`
- `survival_time_gte`
- `boss_kills_gte`
- `weapon_owned_once`
- `weapon_evolved_once`

Reason:

- easy to explain in codex UI
- easy to verify from existing session data
- avoids premature complexity from compound conditions

Out of scope for V1:

- AND/OR compound conditions
- per-run multi-step challenge chains
- character-specific unlock rules

## 6. System Responsibilities

### 6.1 Data

`src/data/unlockData.js`

- single source of truth for unlock definitions

### 6.2 Session

`src/state/createSessionState.js`

- add new session meta fields
- handle migration

### 6.3 Unlock Evaluation

`src/systems/progression/unlockEvaluator.js`

- pure evaluation layer
- reads session/meta/run result
- returns newly completed unlocks
- does not touch DOM or scenes

Expected API shape:

```js
evaluateUnlocks({ session, runResult, unlockData }) => {
  newlyCompletedUnlocks,
  newlyUnlockedWeapons,
  newlyUnlockedAccessories,
}
```

### 6.4 Run-End Integration

`src/scenes/play/PlayResultHandler.js`

- after normal result aggregation, evaluate unlocks
- update `session.meta.completedUnlocks`
- update `session.meta.unlockedWeapons`
- update `session.meta.unlockedAccessories`
- save session once through the existing result flow

### 6.5 Start Weapon UI

`src/ui/title/StartLoadoutView.js`

- dedicated modal for selecting the starting weapon
- UI only, no session mutation outside explicit callbacks

### 6.6 Title Flow

`src/scenes/TitleScene.js`

- `Start Game` opens the loadout modal instead of entering play immediately
- scene remains responsible only for transition flow

### 6.7 Player Creation

`src/entities/createPlayer.js`

- build the initial weapon from `session.meta.selectedStartWeaponId`
- fallback safely to `magic_bolt`

### 6.8 Upgrade Pool Gating

`src/systems/progression/UpgradeSystem.js`

- `weapon_new` choices only appear if the target weapon is unlocked
- `accessory` choices only appear if the target accessory is unlocked
- already-owned and slot rules stay unchanged

### 6.9 Codex Display

`src/ui/codex/CodexView.js`

- keep discovered vs undiscovered behavior
- add a records/unlocks section showing:
  - unlock title
  - condition text
  - reward text
  - completed / locked state

## 7. State Flow

### 7.1 Start Weapon

```text
TitleScene
  -> StartLoadoutView
  -> session.meta.selectedStartWeaponId updated
  -> PlayScene
  -> createPlayer(session)
  -> selected weapon injected as starting weapon
```

### 7.2 Unlock Evaluation

```text
Combat/Event Handlers
  -> session.meta stats accumulate

PlayResultHandler.process(world)
  -> build runResult
  -> updateSessionBest(...)
  -> evaluateUnlocks(...)
  -> commit new unlock arrays
  -> saveSession(...)
  -> return result payload
```

## 8. Guardrails

- combat systems must not read or write unlock state directly
- unlocks must be evaluated only at run end
- locked content must not appear in runtime choice pools
- `magic_bolt` must remain always selectable
- if selected start weapon becomes invalid for any reason, fallback to `magic_bolt`

## 9. Testing Plan

Add tests for:

- session migration initializes unlock fields correctly
- unlock evaluator returns correct rewards for each condition type
- duplicate unlock completion is ignored
- selected start weapon is applied by `createPlayer()`
- locked weapons/accessories are filtered out from `UpgradeSystem.generateChoices()`
- codex unlock list renders locked/completed states correctly

Recommended order:

1. session migration tests
2. unlock evaluator tests
3. createPlayer selected start weapon tests
4. upgrade pool gating tests
5. codex/start-loadout UI rendering tests

## 10. Implementation Boundaries

This spec covers only:

- start weapon selection
- codex/achievement-based unlock data and evaluation
- next-run appearance gating

Separate follow-up specs should cover:

- additional ESC/result UI revisions
- boss variety expansion
- wave intensity scaling
