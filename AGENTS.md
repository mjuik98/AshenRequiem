# AGENTS.md

> **한국어 상세 가이드**: 상세 아키텍처 규칙, 폴더 구조, 금지 패턴은 **`AI_AGENT_PROJECT_GUIDE.md`**를 참조하세요.

---

## Purpose
This project is an **HTML / JavaScript vampire-survivors-like MVP**.
The goal is a **stable, playable combat loop**.

## Architecture Changes Log
| Change | Before | After |
|--------|--------|-------|
| P1-① SpawnSystem | singleton object | class — `new SpawnSystem()` |
| P1-② PlayScene pipeline | in `update()` | extracted to `_runGamePipeline()` |
| P1-③ EliteBehaviorSystem | `systems/movement/` | `systems/combat/` |
| P2-④ Enemy pooling | `createEnemy()` | `ObjectPool` with `resetEnemy()` |
| P2-⑤ Camera state | `PlayScene.this.camera` | `world.camera` |
| P3-⑨ StatusEffect | switch/if in System | `statusEffectRegistry` handlers |

## Standard Frame Pipeline
`PlayScene._runGamePipeline()`:
1. clear events
2. update time
3. SpawnSystem (instance)
4. Player movement
5. Enemy movement
6. EliteBehaviorSystem
7. WeaponSystem
8. ProjectileSystem
9. CollisionSystem (uses `world.camera`)
10. StatusEffectSystem
11. DamageSystem
12. DeathSystem
13. ExperienceSystem
14. LevelSystem
15. FlushSystem (with enemy pool)
16. CameraSystem -> `world.camera`
17. RenderSystem

## Validation & Tests
```bash
node scripts/validateData.js
node --experimental-vm-modules tests/DamageSystem.test.js
node --experimental-vm-modules tests/ExperienceSystem.test.js
node --experimental-vm-modules tests/SpawnSystem.test.js
```
