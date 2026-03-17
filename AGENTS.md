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
| P3-⑥ CollisionSystem 테스트 | 미존재 | `tests/CollisionSystem.test.js` 추가 |
| P3-⑦ UpgradeSystem 테스트 | 미존재 | `tests/UpgradeSystem.test.js` 추가 |
| P3-⑧ StatusEffectSystem 테스트 | 미존재 | `tests/StatusEffectSystem.test.js` 추가 |
| P3-⑨ AssetManager | 미존재 (canvas 직접 그리기만 사용) | `src/managers/AssetManager.js` 최소 인터페이스 |
| P3-⑩ createSessionState | 기본 객체 리터럴, localStorage 없음 | localStorage 연동 + updateSessionBest() 추가 |
| P-① WeaponSystem 리팩터링 | if/else behaviorId 분기 | `weaponBehaviorRegistry` 위임 패턴 |
| P-② 무기 동작 파일 분리 | WeaponSystem 내부 인라인 | `behaviors/weaponBehaviors/*.js` |
| P-③ SynergySystem 추가 | 미존재 | `systems/progression/SynergySystem.js` |
| P-④ 테스트 자동화 | 개별 node 실행 | `npm test` → `scripts/runTests.js` |
| P-⑤ Vite 빌드 도입 | 없음 (bare ES module) | `vite.config.js` |

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
node --experimental-vm-modules tests/CollisionSystem.test.js
node --experimental-vm-modules tests/UpgradeSystem.test.js
node --experimental-vm-modules tests/StatusEffectSystem.test.js
```

## AI Agent Rules Extensions

### 테스트 작성 규칙
- 새 System을 추가할 때는 반드시 같은 이름의 `.test.js` 파일을 `tests/`에 함께 추가한다.
- 테스트는 실제 import가 실패해도 `process.exit(0)`으로 스킵하고 에러를 내지 않는다.
- 테스트 픽스처(makeEnemy, makePlayer 등)는 각 테스트 파일에서 자체 선언하며, 공통 fixtures 파일을 만들지 않는다. (의존성 최소화)

### sessionState 갱신 규칙
- 런 종료는 반드시 `updateSessionBest()` → `saveSession()` 순서로 처리한다.
- `session.last`는 런 결과 임시 보관용이며 localStorage에 저장하지 않는다.
- `session.best`는 각 항목별 독립 최고값이다. (킬 수 최고 런과 생존 시간 최고 런이 달라도 됨)

### 무기 동작 추가 규칙
- 새 무기 패턴 추가 시 `src/behaviors/weaponBehaviors/` 아래 파일 생성
- `weaponBehaviorRegistry.js`에 `registry.set('newBehaviorId', fn)` 한 줄 추가
- **WeaponSystem.js는 수정하지 않는다** — 레지스트리만 수정
- behavior 함수 시그니처: `({ weapon, player, enemies, spawnQueue }) => boolean`
  - `true`: 발동 성공 (쿨다운 정상 소비)
  - `false`: 발동 실패 (WeaponSystem이 쿨다운 0으로 초기화 → 즉시 재시도)

### SynergySystem 사용 규칙
- `SynergySystem.applyAll()` 호출 시점: `UpgradeSystem.applyUpgrade()` 직후
- 시너지 정의는 `upgradeData.js` 안에 `requires[]` 배열로 작성
- 시너지는 매번 전체 재계산 방식 — 부분 취소 없음

### 테스트 규칙 (기존 규칙 보강)
- `npm test` 로 전체 테스트 실행 (scripts/runTests.js)
- `npm run validate` 로 데이터 무결성 검증 (scripts/validateData.js)
- `pretest` 훅이 validate를 자동 실행하므로 npm test 전에 별도 실행 불필요
