# ESC Loadout Modal Redesign

Date: 2026-03-21
Project: Ashen Requiem
Scope: ESC pause modal redesign for weapons/accessories layout and interaction

## 1. Goal

Redesign the ESC pause modal so the player's current loadout is easier to scan, feels more rewarding, and communicates weapon/accessory relationships without relying on hover-only tooltip discovery.

The redesign must improve all of the following:

- one-glance readability
- weapon/accessory relationship visibility
- perceived reward and progression feedback
- small-screen and lower-resolution usability
- visual consistency across weapons, accessories, empty slots, and locked slots

This spec intentionally excludes:

- combat rule changes
- synergy calculation changes
- save/load behavior changes
- scene/system responsibility changes outside the existing pause UI flow

## 2. Recommended Approach

Replace the separate `무기` and `장신구` tabs with a single `로드아웃` tab built around a master-detail layout.

Why:

- it removes the current context split between weapons and accessories
- it lets the player understand loadout relationships in one screen
- it reduces hover dependence by moving critical information into a persistent detail panel
- it adapts more cleanly to smaller screens than the current split card languages
- it can be implemented in the UI layer without touching combat logic

Visual direction:

- structure: tactical dashboard
- mood: dark metal panel with relic-like brass accents
- emphasis states: rare, synergy-active, and evolution-ready get stronger accent treatment

## 3. Current Problems

The current pause UI creates four practical UX issues:

1. Weapons and accessories live in separate tabs, so the player cannot easily understand their relationships.
2. Weapons and accessories use different card languages, which weakens visual consistency.
3. Important connection information is mostly hidden in tooltips, so the player must hover to reason about builds.
4. The current layout is serviceable on desktop but does not scale elegantly when width gets tight.

## 4. Target Player Flow

When the player opens ESC:

1. The modal opens on the `로드아웃` tab by default.
2. The left side shows the full current loadout in one list.
3. The right side shows detail for the currently selected item.
4. The player can switch selection across weapons, accessories, empty slots, and locked slots.
5. The detail panel explains what the selected item does, how strong it is now, and what it connects to.
6. The player closes the modal with `ESC` or the resume button without losing context.

Design rule:

- move from hover-first discovery to selection-first understanding

## 5. Layout Structure

### 5.1 Desktop

Use a two-column master-detail layout inside the existing pause panel:

- header: paused badge, survival time, kills, level, HP
- body left: loadout list
- body right: selected item detail panel
- footer: resume and forfeit actions

The left list contains both weapons and accessories in one unified presentation. Empty and locked slots remain visible in the same visual system.

### 5.2 Small Screens

When width is constrained:

- keep the header, but reduce spacing density
- collapse the body into a vertical stack
- show the loadout list first
- render the selected detail panel directly below it
- keep `스탯` and `사운드` as separate tabs if needed
- do not reintroduce separate weapon/accessory tabs

## 6. Information Hierarchy

The redesign should answer the following questions in order:

1. What is this item?
2. How strong is it right now?
3. What does it connect to?
4. What is the next power spike?

This ordering applies both to list cards and to the detail panel.

## 7. Loadout Card System

Weapons and accessories should share the same base card frame and spacing rhythm.

Shared card structure:

- left: icon
- center: name and one-line role/effect summary
- right: level or state badge
- bottom assist row: connection/evolution/progression signal

State vocabulary:

- default
- selected
- rare
- synergy-active
- evolution-ready
- empty slot
- locked slot

Rules:

- `selected` uses stronger border and background emphasis
- `rare` adds a subtle metal accent or top-edge marker
- `synergy-active` uses a separate connection color family
- `evolution-ready` gets the strongest highlight state
- `empty slot` uses the same frame with inactive treatment
- `locked slot` uses the same frame with lock state and unlock hint

Important constraint:

- do not keep separate visual systems for weapon cards vs accessory cards

## 8. Detail Panel

The detail panel replaces tooltip-first understanding with persistent, selection-driven explanation.

Detail panel sections:

- header: item name, type, rarity/evolution badges
- role summary: one or two lines describing purpose
- current power block: level, key values, and progress
- linked items block: related weapons/accessories
- synergy block: active synergies and inactive synergies
- evolution block: requirements, current completion state, and result item
- guidance block: next likely power spike or progression hint

Reading rule:

- the detail panel should support in-run decision making, not encyclopedia browsing

## 9. Visual Language

Base look:

- dark, low-gloss panel surfaces
- minimal chrome
- readable contrast first

Accent rules:

- primary accent: aged brass / old gold
- rare/evolution emphasis: copper-tinted gold or blood-warm metal
- link/synergy emphasis: pale teal or frost-blue
- danger/low HP: keep existing red warning behavior

Texture direction:

- avoid generic frosted glass styling
- prefer restrained metal-panel framing with small highlight edges

Consistency rule:

- every card state, detail block, and badge should look like part of the same equipment system

## 10. Tabs And Interaction Rules

Tab changes:

- remove separate `무기` and `장신구` tabs
- add one unified `로드아웃` tab
- keep `스탯` and `사운드`

Selection behavior:

- default selection should be the first equipped weapon, or a stable fallback if none exists
- clicking a loadout card updates the detail panel
- keyboard focus should also be able to move selection
- hover may still show lightweight tooltip support, but core information must remain readable without hover

Optional enhancement if implementation cost stays low:

- make linked item chips in the detail panel selectable targets that jump focus to that item

## 11. Data And Dependency Use

The redesign must stay within UI responsibilities and reuse existing data passed to `PauseView`.

Expected data sources:

- `player.weapons`
- `player.accessories`
- `player.activeSynergies`
- `data.weaponData`
- `data.accessoryData`
- `data.synergyData`
- `data.weaponEvolutionData`
- existing derived indexes already built in `PauseView`

Do not introduce:

- direct combat system reads
- session mutation from UI
- new rule logic in the scene layer

## 12. File-Level Design

Primary files expected to change:

- `src/ui/pause/PauseView.js`
- `src/ui/pause/pauseViewSections.js`
- `src/ui/pause/pauseTooltipContent.js`

Recommended implementation shape:

- move tab rendering to support `loadout`, `stats`, `sound`
- add a selected-item state inside `PauseView`
- render a unified loadout list section
- render a dedicated detail panel section
- reduce tooltip scope so tooltips become supplementary rather than required
- refactor CSS to define shared card primitives instead of separate weapon/accessory visual systems

## 13. Responsive And Accessibility Notes

Responsive goals:

- no overlapping content at narrow widths
- keep list scanning fast on desktop and mobile
- allow footer buttons to stack vertically when needed

Accessibility goals:

- preserve dialog semantics
- keep keyboard navigation usable for card selection
- ensure selected state is visually distinct without relying only on color
- avoid hover-only disclosure for critical information

## 14. Test And Verification Scope

Minimum verification for implementation:

- ESC open/close flow still works
- loadout tab renders without errors
- weapons, accessories, empty slots, and locked slots all render
- card selection updates the detail panel correctly
- responsive layout remains readable at smaller widths
- tooltip behavior, if retained, does not conflict with the new detail panel

Testing note:

- this is primarily a UI-layer redesign, so verification should focus on render correctness and interaction behavior rather than combat outcomes

## 15. Out Of Scope Follow-Ups

Possible later follow-up work, not part of this redesign:

- richer item art or icon system
- animated relationship lines between linked items
- codex-style build history or run recap inside pause
- controller-specific focus ring and navigation polish

## 16. Recommendation Summary

Use a unified loadout tab with a master-detail layout.

Keep the structure tactical and fast to read, then add reward and atmosphere through restrained relic-like accents instead of large ornamental UI changes.

This gives the project a cleaner pause-flow UX while staying consistent with the AGENTS architecture constraints:

- UI handles presentation only
- data is reused rather than re-authored
- scene/system responsibilities remain intact
