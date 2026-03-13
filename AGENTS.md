# AGENTS.md

## Purpose

This document is the operating contract for any AI agent working on this project.
The project is an **HTML / JavaScript vampire-survivors-like MVP**.
The primary goal is to ship a **playable combat loop quickly without collapsing the architecture**.

When making changes, prefer:
- playable results over overengineering
- small, local edits over broad rewrites
- explicit module boundaries over convenience shortcuts
- data-driven extension over hardcoded branching

---

## Primary MVP Goal

The MVP loop is:

**move → attack → kill → gain XP → level up → survive longer or die**

The MVP should support:
- player movement
- enemy chase movement
- 1–2 automatic weapons
- enemy death
- XP drop and pickup
- level-up with 3 choices
- increasing pressure over time
- result screen on death

Out of scope for MVP unless explicitly requested:
- save/load
- meta progression
- localization
- advanced status systems
- advanced enemy AI
- advanced pooling
- boss presentation
- elaborate animation framework
- complex equipment slot systems
- networking

---

## Non-Negotiable Architecture Rules

### 1) Scene controls flow only
Scenes may:
- enter / exit states
- orchestrate update order
- manage scene transitions
- open / close UI overlays

Scenes must not directly own:
- combat rules
- collision logic
- damage logic
- spawn logic
- rendering details

### 2) Systems own game rules
Each system should have **one clear responsibility**.

Examples:
- movement handles movement only
- collision detects collisions only
- damage applies damage only
- spawn schedules spawns only

Do not merge multiple gameplay responsibilities into one system unless there is a very strong reason.

### 3) Entities are state containers
Entities should stay lightweight.
Prefer factories such as:
- `createPlayer()`
- `createEnemy(enemyId)`
- `createProjectile(config)`
- `createPickup(config)`

Do not bury large gameplay logic inside entity objects.

### 4) Renderer is output-only
Renderer and UI should know **what to show**, not **why game state changed**.
They must not decide damage, AI, progression, or spawn timing.

### 5) Data and logic stay separate
Enemy, weapon, upgrade, and wave definitions should live in data files whenever possible.
If behavior differences become too large to express with numbers alone, introduce a behavior layer.

### 6) Start simple, split when repetition appears
Do not build a generic engine prematurely.
Split into registries, behaviors, or extra systems when repeated patterns clearly appear.

---

## Preferred Layering

Use this mental model when placing code:

### Core
Responsibilities:
- boot game
- run main loop
- gather input
- manage scene transitions
- initialize shared services

Typical modules:
- `Game`
- `GameLoop`
- `SceneManager`
- `Input`

### Scenes
Responsibilities:
- control flow per screen/state
- orchestrate systems
- manage UI mode transitions

Typical modules:
- `TitleScene`
- `PlayScene`
- `ResultScene`

### Domain / Systems
Responsibilities:
- movement
- attacks
- collision
- damage
- spawn
- experience
- level-up
- upgrades
- camera
- render preparation

### Data
Responsibilities:
- enemy definitions
- weapon definitions
- upgrade definitions
- wave definitions
- constants and balance values

### Presentation
Responsibilities:
- canvas rendering
- HUD
- level-up UI
- result UI
- DOM overlays

---

## Preferred Directory Layout

```text
src/
├─ main.js
├─ core/
│  ├─ Game.js
│  ├─ GameLoop.js
│  ├─ SceneManager.js
│  ├─ Input.js
│  └─ GameConfig.js
├─ scenes/
│  ├─ TitleScene.js
│  ├─ PlayScene.js
│  └─ ResultScene.js
├─ state/
│  ├─ createWorld.js
│  ├─ createUiState.js
│  └─ createSessionState.js
├─ entities/
│  ├─ createPlayer.js
│  ├─ createEnemy.js
│  ├─ createProjectile.js
│  ├─ createPickup.js
│  └─ createEffect.js
├─ systems/
│  ├─ movement/
│  │  ├─ PlayerMovementSystem.js
│  │  └─ EnemyMovementSystem.js
│  ├─ combat/
│  │  ├─ WeaponSystem.js
│  │  ├─ ProjectileSystem.js
│  │  ├─ CollisionSystem.js
│  │  ├─ DamageSystem.js
│  │  └─ DeathSystem.js
│  ├─ progression/
│  │  ├─ ExperienceSystem.js
│  │  ├─ LevelSystem.js
│  │  └─ UpgradeSystem.js
│  ├─ spawn/
│  │  └─ SpawnSystem.js
│  ├─ camera/
│  │  └─ CameraSystem.js
│  └─ render/
│     └─ RenderSystem.js
├─ behaviors/
│  ├─ weaponBehaviors/
│  │  ├─ targetProjectile.js
│  │  ├─ orbit.js
│  │  └─ areaBurst.js
│  └─ weaponBehaviorRegistry.js
├─ data/
│  ├─ enemyData.js
│  ├─ weaponData.js
│  ├─ upgradeData.js
│  ├─ waveData.js
│  └─ constants.js
├─ managers/
│  ├─ EntityManager.js
│  └─ AssetManager.js
├─ renderer/
│  ├─ CanvasRenderer.js
│  └─ draw/
│     ├─ drawPlayer.js
│     ├─ drawEnemy.js
│     ├─ drawProjectile.js
│     └─ drawEffect.js
├─ ui/
│  ├─ hud/
│  │  └─ HudView.js
│  ├─ levelup/
│  │  └─ LevelUpView.js
│  ├─ result/
│  │  └─ ResultView.js
│  └─ dom/
│     └─ mountUI.js
├─ utils/
│  ├─ random.js
│  ├─ clamp.js
│  ├─ weightedPick.js
│  └─ ids.js
└─ math/
   └─ Vector2.js
```

This is a target boundary map, not a requirement to create every file immediately.
Split only when the responsibility boundary becomes useful.

---

## Dependency Rules

### Allowed
- Scene → System
- Scene → Manager
- Scene → UI state
- System → Data
- System → EntityManager / shared services
- RenderSystem → Renderer
- Renderer → read-only render data

### Conditionally allowed
- System → `world` read access
- System → writes only within its own responsibility
- System → writes to `events`, `spawnQueue`, `destroyQueue`

### Forbidden
- regular systems calling renderer directly
- renderer changing gameplay state
- entities calling systems directly
- systems freely mutating each other’s internals
- managers owning gameplay rules
- scenes accumulating gameplay calculations over time

Decision shortcut:
- gameplay rule → `system`
- state storage → `entity` or `manager`
- output → `renderer` or `ui`
- flow control → `scene`

---

## State Model

Keep state split into four categories.

### 1) World state
Real-time combat state.

```js
const world = {
  time: 0,
  deltaTime: 0,
  elapsedTime: 0,
  killCount: 0,
  playMode: 'playing',

  player: null,
  enemies: [],
  projectiles: [],
  pickups: [],
  effects: [],

  spawnQueue: [],
  destroyQueue: [],
  events: {
    hits: [],
    deaths: [],
    pickupCollected: [],
    levelUpRequested: [],
    spawnRequested: [],
  },
};
```

### 2) UI state
Overlay and presentation state such as HUD, level-up menu, result screen.

### 3) Session state
Options, best record, unlocks. Keep minimal in MVP.

### 4) Frame event state
Transient facts recorded and consumed within the frame.

Important rules:
- do not pass a giant `gameContext` everywhere by default
- pass only the slices each system actually needs
- limit who can write which state

---

## Standard Frame Pipeline

`PlayScene` should preserve a stable update order:

1. update input
2. update game time
3. process spawn rules
4. move player
5. move enemies
6. trigger weapons / request attacks
7. move projectiles
8. detect collisions
9. apply damage
10. process death and drops
11. collect XP
12. check level-up
13. flush spawn / destroy queues
14. update camera
15. render

Use this mental model:

**detect → record → apply → cleanup**

A stable order prevents timing bugs around death, deletion, and level-up.

---

## Spawn / Destroy Lifecycle Rules

### Never delete immediately during iteration
Do not repeatedly `splice` from active arrays during iteration.
Queue destruction in `destroyQueue`.

### Prefer queued creation
Enemies, projectiles, pickups, and effects should usually be written to `spawnQueue` and flushed later in the frame.

### Mark pending destruction early
Use flags like `pendingDestroy` or `isAlive = false` so later systems in the same frame do not treat dead objects as active.

### Centralize death side effects
Kill count, XP drops, death effects, and sounds should not be triggered redundantly in multiple places.

### Pending-destroy objects are not normal objects
Once marked for removal, other systems should stop treating them as valid active entities.

---

## System Contract Standard

When adding or editing systems, define the contract first.

General form:

```js
system.update({
  dt,
  input,
  world,
  data,
  services,
});
```

Prefer narrower real usage:

```js
playerMovementSystem.update({
  input,
  player: world.player,
  deltaTime: world.deltaTime,
});
```

Examples:

### `PlayerMovementSystem`
- input: `input`, `player`, `deltaTime`
- reads: position, move speed, input direction
- writes: player position, facing direction
- outputs: none

### `EnemyMovementSystem`
- input: `player`, `enemies`, `deltaTime`
- reads: player position, enemy position, enemy speed
- writes: enemy position
- outputs: none

### `WeaponSystem`
- input: `player`, `enemies`, `weaponState`, `deltaTime`
- reads: enemy list, cooldowns, weapon data
- writes: weapon internal state
- outputs: attack spawn requests

### `CollisionSystem`
- input: `player`, `enemies`, `projectiles`, `pickups`
- reads: positions, radii, alive state
- writes: direct HP mutation is forbidden
- outputs: `events.hits`, `events.pickupCollected`

### `DamageSystem`
- input: `events.hits`
- reads: attack power, target HP, defense values
- writes: target HP, hit state, death state
- outputs: `events.deaths`

### `ExperienceSystem`
- input: `events.deaths`, `events.pickupCollected`
- reads: XP values, magnet radius
- writes: player XP, pickup state
- outputs: pickup spawn requests, level-up candidate events

### `LevelSystem`
- input: player XP / current level
- reads: level table
- writes: player level, `playMode`
- outputs: level-up UI open request

### `UpgradeSystem`
- input: player state, owned weapons, upgrade data
- reads: `upgradeData`, current levels
- writes: selected upgrade results
- outputs: player / weapon stat changes

### `SpawnSystem`
- input: `elapsedTime`, `waveData`, player position, camera range
- reads: current wave rules
- writes: direct insertion into arrays is forbidden
- outputs: enemy spawn requests

### `RenderSystem`
- input: world state, camera state
- reads: render-relevant entity data
- writes: gameplay mutation is forbidden
- outputs: renderer calls

---

## Extension Rules

Introduce extension points only when needed.

### New weapon pattern
Use when weapon behaviors clearly diverge.

Preferred response:
- `behaviorId`
- `weaponBehaviorRegistry`
- `weaponBehaviors/*`

### New enemy pattern
Use when enemies diverge beyond simple stat changes.

Preferred response:
- `enemyBehaviorId`
- enemy behavior functions or dedicated system

### New status effects
Use when DOT, slow, stun, buffs, debuffs begin to accumulate.

Preferred response:
- `StatusEffectSystem`
- `statusEffects/`

### Performance optimization
Use only after real pressure appears.

Preferred response:
- object pool
- spatial hash / grid
- partitioning helpers

---

## Data Rules

Prefer content work in `data/*`.

### General rules
- `id` values are strings
- document unit expectations in field names or comments
- keep source data free of runtime-derived values
- do not accumulate temporary implementation flags into static data

### Unit conventions
- `cooldown`: seconds
- `moveSpeed`: pixels per second
- `projectileSpeed`: pixels per second
- `range`: pixels
- `radius`: pixels
- `rotationSpeed`: radians per second
- `spawnPerSecond`: count per second

### Validation recommended
Validate where practical during initialization:
- no duplicate `id`
- referenced ids exist
- `maxLevel >= 1`
- `spawnPerSecond >= 0`
- interval ranges are valid

---

## UI / Rendering Boundary

### Canvas should handle
- player
- enemies
- projectiles
- pickups
- effects
- camera-following world objects

### HTML / CSS / DOM should handle
- title menu
- HUD elements
- level-up card selection UI
- pause menu
- result screen
- debug panel

Rules:
- UI shows state and forwards input
- UI does not own gameplay rules
- renderer remains read-only in relation to gameplay

---

## Browser-Specific Rules

Because this project runs on the web, remember:
- clamp abnormally large `deltaTime`
- consider `devicePixelRatio`
- watch focus loss when interacting with DOM
- manage browser-default key conflicts
- update canvas / camera / UI layout on resize
- if asset loading exists, do not enter dependent scenes before ready

---

## Working Rules for Agents

### When adding a feature
1. identify whether the responsibility belongs to `scene`, `system`, `entity`, `data`, `renderer`, or `ui`
2. if the feature spans multiple responsibilities, split it first
3. prefer the smallest change that preserves boundaries

### When modifying existing code
1. identify the existing boundary before editing
2. avoid fast hacks that push logic across layers
3. add an event or queue if direct mutation would blur responsibilities

### When refactoring
1. preserve behavior first
2. split by responsibility before splitting by size
3. if `PlayScene` grows, move calculations into systems

### When adding content
1. prefer `data/*`
2. introduce behaviors only when numeric configuration is no longer enough

### When editing UI
1. avoid direct world mutation from UI code
2. let scenes or systems own state transitions

---

## Forbidden Patterns

Do not introduce these patterns:
- renderer calculating damage
- entities directly finding and mutating other entities
- scenes steadily accumulating gameplay rules
- immediate insertion without `spawnQueue`
- repeated delete-during-iteration patterns
- dumping all context into every function by default
- one system silently owning multiple unrelated gameplay responsibilities
- turning static data into a storage place for runtime flags

---

## Recommended Build Order

If the project is being assembled from scratch or a large feature pass is underway, prefer this order:

1. player movement
2. simple enemy chase
3. basic rendering
4. first automatic weapon
5. projectile processing
6. enemy death
7. XP pickups
8. level-up entry
9. 3-choice upgrade UI
10. time-based spawn increase
11. result screen
12. debug UI
13. second weapon pattern
14. upgrade data expansion
15. difficulty tuning

---

## Pre-Change Checklist

Before making changes, ask:
- which layer owns this responsibility?
- can this be solved with data instead of new logic?
- is `PlayScene` taking on too much calculation?
- is renderer or UI starting to own gameplay logic?
- are spawn / destroy effects being applied too early?
- would an event or queue make this safer?
- does this really need a new file, or just a cleaner boundary?

---

## Definition of a Good Change

A good change in this project usually has these properties:
- the game is still playable after the change
- responsibility boundaries are clearer, not blurrier
- the change is small and local when possible
- new content can be extended through data or obvious hooks
- update order and lifecycle rules remain intact

---

## Final Reminder

The goal is **not** to build the most abstract architecture.
The goal is to build a **stable, playable combat loop** that can grow without turning into a tangled scene script.

Keep this rule in mind:

> Scene coordinates flow, Systems apply rules, Entities hold state, Data defines content, Renderer/UI present results.
