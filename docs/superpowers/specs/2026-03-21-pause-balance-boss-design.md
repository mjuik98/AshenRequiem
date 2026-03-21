# Pause, Balance, and Boss Expansion Design

**Date:** 2026-03-21

## Goal

Handle the approved gameplay/UI bundle while preserving the project's existing responsibility boundaries:

- linearize accessory progression across all accessory types
- reduce enemy death SFX spam under high-enemy-count combat
- add quick audio controls to the ESC pause modal
- fix ESC modal tooltip and scroll bugs
- add gold-related stats to the ESC modal
- add projectile lifetime progression through both run-time accessory and meta shop upgrade
- replace vague level-up text with concrete per-upgrade delta text
- add a forfeit button in the ESC modal that ends the run as a defeat result
- spawn bosses every 5 minutes and end the run in victory after the 6th boss kill

## Constraints From AGENTS.md

- `Scene` handles state transitions and UI flow, not combat rule calculations.
- `System` handles one gameplay rule each and should not reach into session directly.
- `Renderer/UI` must not mutate `world` directly.
- Data-driven expansion is preferred for accessories, upgrades, and boss timing.
- Factory/singleton split must remain intact.
- Session writes remain centralized in infrastructure/result handling flows.

## Scope Breakdown

### 1. Accessory and Upgrade Balance

Accessory progression will be normalized so each accessory grows with a clearly linear level pattern instead of uneven percentage jumps such as `30% -> 36%`.

Design decisions:

- all accessories, including flat-value accessories, will be rebalanced into linear level growth
- percent-based accessories will follow clearer per-level increments
- flat-value accessories will also follow consistent per-level additive growth
- upgrade presentation text will be generated from actual data rather than hardcoded `"효과 강화"`

This keeps balance tuning centralized in `src/data/accessoryData.js` and avoids embedding balance logic inside UI code.

### 2. Projectile Lifetime Stat Expansion

A new projectile lifetime stat will be introduced in two places:

- a run-time accessory in `accessoryData`
- a permanent meta upgrade in `permanentUpgradeData`

Design decisions:

- the player entity gains a dedicated projectile lifetime multiplier/stat field
- weapon behavior / projectile spawn helpers apply the stat when creating projectiles with bounded lifetimes
- orbit/area-burst/projectile behaviors should use the same player stat input where lifetime exists

This is handled as a stat extension, not as special-case UI logic.

### 3. ESC Modal Expansion

The pause modal remains a combat-focused information modal, not a full settings screen.

Approved direction:

- add a lightweight `Sound` tab
- the tab contains only:
  - master volume
  - BGM volume
  - SFX volume
  - BGM toggle
  - SFX toggle

Additional pause-modal changes:

- add a `forfeit` action button
- display gold-related stats in the stats tab
- fix tooltip rendering for weapon/accessory entries while paused
- fix scroll interaction inside the modal

Non-goal:

- do not turn pause modal into a full settings replacement

### 4. Forfeit Flow

Forfeit is treated as a defeat and ends at the result screen.

Responsibility split:

- `PauseView` emits intent only
- `PlayScene` handles the transition request
- result processing receives the run outcome and shows defeat result UI

This preserves the `View emits / Scene transitions` boundary.

### 5. Death SFX Frequency Reduction

Enemy death audio should stay responsive but stop overwhelming the mix when many enemies die together.

Design decision:

- implement rate limiting / batching in sound event handling, not in combat systems

Why:

- `DeathSystem` should continue publishing combat events only
- sound cadence is an output concern, so the throttling belongs beside sound playback registration

### 6. Boss Cadence and Victory Condition

Bosses will spawn at exact 5-minute intervals:

- 300s
- 600s
- 900s
- 1200s
- 1500s
- 1800s

After the 6th boss is defeated, the run ends in victory.

Design decisions:

- boss schedule remains data-driven through `bossData`
- boss kill counting for the current run is stored on `world`, not session
- victory is expressed as run outcome data, then rendered by result UI

This avoids abusing player death flow to represent victory.

## State Flow

### Pause Audio Flow

1. `PauseView` reads current session option values passed from the scene.
2. User changes slider/toggle in the `Sound` tab.
3. `PauseView` sends updated option values through scene callbacks.
4. `PlayScene` updates `session.options`, saves session, and reapplies sound system volume/toggle settings immediately.

### Forfeit Flow

1. User clicks `전투 포기` in `PauseView`.
2. `PauseView` calls its forfeit callback without mutating `world`.
3. `PlayScene` marks run outcome as defeat and transitions out of paused play.
4. Result handling processes and displays defeat result screen.

### Boss Victory Flow

1. Boss dies through normal combat death pipeline.
2. Boss kill progress for the current run increments on `world`.
3. When boss kill count reaches 6, gameplay transitions to ended/victory result flow.
4. `ResultView` renders victory-specific title/message while result processing still updates persistent stats.

## File Responsibilities

### Data Layer

- `src/data/accessoryData.js`
  - rebalance existing accessory values
  - add projectile lifetime accessory
  - export helpers for concrete level-up text where appropriate
- `src/data/permanentUpgradeData.js`
  - add projectile lifetime permanent upgrade
  - apply the new permanent stat to player construction
- `src/data/upgradeData.js`
  - register the new accessory option
  - replace vague accessory-upgrade descriptions with generated concrete delta text
- `src/data/bossData.js`
  - change boss schedule to 5-minute cadence through 6 bosses

### State / Scene Layer

- `src/state/createWorld.js`
  - add per-run boss kill count and run outcome state
- `src/scenes/PlayScene.js`
  - connect pause audio callbacks
  - connect forfeit action
  - pass run outcome into result UI

### System Layer

- `src/systems/progression/UpgradeSystem.js`
  - apply new projectile lifetime stat from accessory/meta sources
- relevant projectile/weapon behavior helpers
  - scale projectile lifetime consistently when spawning bounded-lifetime projectiles
- `src/systems/sound/soundEventHandler.js`
  - reduce death SFX frequency without changing combat event emission
- boss end-condition handling
  - end run on 6th boss kill through world/result flow, not session mutation inside combat systems

### UI Layer

- `src/ui/pause/PauseView.js`
  - add `Sound` tab using approved quick-audio layout
  - fix tooltip availability in pause modal
  - fix scroll interaction in modal
  - add gold-related stats
  - add forfeit button
- `src/ui/levelup/LevelUpView.js`
  - display concrete delta text supplied by data/upgrade helpers
- `src/ui/result/ResultView.js`
  - render victory vs defeat result states

## Key Risks

### Scroll and Tooltip Interaction

`#ui-container` uses `pointer-events: none` globally with opt-in interactive children. Pause modal currently mixes scrollable container logic, hover/focus tooltip logic, and button-only pointer enablement. Fix must ensure:

- modal scroll works on desktop mouse wheel and trackpad
- tooltip targets remain interactive
- overlay does not unintentionally leak clicks to gameplay canvas

### Projectile Lifetime Coverage

Different weapon behaviors create projectiles/effects in different ways. The new stat must only affect bounded projectile lifetime mechanics and must not accidentally alter:

- infinite/non-projectile behavior
- area effects that use unrelated duration semantics unless explicitly intended

### Victory Flow Separation

The current result path is defeat-oriented. Victory should be added as a result outcome, not hacked through `dead` semantics if that would blur state meaning. If introducing a separate ended/victory world state is too invasive, the minimal acceptable fallback is:

- keep transition handling centralized in scene flow
- carry explicit `runOutcome` data so result rendering does not guess from play mode alone

## Testing Strategy

Add or update tests for:

- accessory linear upgrade application
- projectile lifetime stat application from run-time and permanent upgrades
- generated upgrade descriptions for accessory level-ups
- death SFX throttling behavior
- boss schedule at 300-second cadence
- victory after 6th boss defeat
- forfeit action producing defeat result flow

Manual verification will also be needed for:

- pause modal scroll behavior
- tooltip visibility in pause modal
- live audio slider/toggle application during pause

## Recommended Implementation Approach

Use a hybrid approach:

- data-driven changes for balance, new progression stats, and boss cadence
- localized UI changes for the pause modal and result screen
- scene-owned transition handling for forfeit and run outcome routing

This best matches the project's architecture and minimizes cross-layer leakage.
