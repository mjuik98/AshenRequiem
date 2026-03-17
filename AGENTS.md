# AGENTS.md (AI Agent Project Guide)

이 문서는 이 프로젝트에 참여하는 AI Agent가 **설계 방향을 유지하면서 코드 생성, 수정, 리팩터링, 기능 추가**를 수행할 수 있도록 만든 **단일 진실의 원천(Single Source of Truth)**이다. 기존 `AI_AGENT_PROJECT_GUIDE.md`의 상세 내용과 규칙을 하나로 통합하였다.

---

## 1. Project Purpose & Phase
This project is an **HTML / JavaScript vampire-survivors-like game**.
The goal has moved from MVP to **Phase 2 (Expansion)**: adding Meta-progression, Bosses, complex Synergies, and Save/Load, while maintaining a stable combat loop based on strict responsibilities.

---

## 2. 최우선 행동 원칙 (AI Agent Core Rules)

1. **책임 분리를 엄격히 유지한다**
   - **Scene**: 상태 진입/종료, 프레임 처리 순서, 화면 흐름만 담당. 전투(게임) 규칙 계산 절대 금지.
   - **System**: 한 가지의 게임 규칙(이동, 충돌, 스폰, 렌더준비 등)만 책임을 진다.
   - **Entity**: 데이터를 담는 얇은 상태 객체로 유지. (메서드에 복잡한 규칙 내장 금지)
   - **Renderer / UI**: 데이터 출력을 담당. 게임 규칙이나 월드 상태(`world`)를 직접 수정하는 것 금지.
2. **데이터 중심 확장을 우선한다**
   - 적/무기/업그레이드 등은 `src/data/` 확장을 1순위로 고려한다.
3. **변경 및 부작용의 최소화**
   - 관련 없는 파일을 무분별하게 건드리지 않고, 확장이 필요하다면 새로운 behavior나 handler를 등록하는 패턴을 쓴다.

---

## 3. Architecture Changes Log
| Change | Before | After |
|--------|--------|-------|
| P1-① SpawnSystem | singleton object | class — `new SpawnSystem()` |
| P1-② PlayScene pipeline | in `update()` | extracted to `_runGamePipeline()` |
| P1-③ EliteBehaviorSystem | `systems/movement/` | `systems/combat/` |
| P2-④ Enemy pooling | `createEnemy()` | `ObjectPool` with `resetEnemy()` |
| P2-⑤ Camera state | `PlayScene.this.camera` | `world.camera` |
| P3-⑥ CollisionSystem 테스트 | 미존재 | `tests/CollisionSystem.test.js` 추가 |
| P3-⑦ UpgradeSystem 테스트 | 미존재 | `tests/UpgradeSystem.test.js` 추가 |
| P3-⑧ StatusEffectSystem 테스트 | 미존재 | `tests/StatusEffectSystem.test.js` 추가 |
| P3-⑨ StatusEffect | switch/if in System | `statusEffectRegistry` handlers |
| P3-⑩ AssetManager | 미존재 (canvas 직접 그리기만 사용) | `src/managers/AssetManager.js` 최소 인터페이스 |
| P3-⑪ createSessionState | 기본 객체 리터럴, localStorage 없음 | localStorage 연동 + updateSessionBest() 추가 |
| P-① WeaponSystem 리팩터링 | if/else behaviorId 분기 | `weaponBehaviorRegistry` 위임 패턴 |
| P-② 무기 동작 파일 분리 | WeaponSystem 내부 인라인 | `behaviors/weaponBehaviors/*.js` |
| P-③ SynergySystem 추가 | 미존재 | `systems/progression/SynergySystem.js` |
| P-④ 테스트 자동화 | 개별 node 실행 | `npm test` → `scripts/runTests.js` |
| P-⑤ Vite 빌드 도입 | 없음 (bare ES module) | `vite.config.js` |
| P-⑥ PlayContext 도입 | PlayScene이 pool·service 직접 소유 | `src/core/PlayContext.js` 컨테이너 분리 |
| P-⑦ Pipeline.js 도입 | `_runGamePipeline()` 수동 호출 | `src/core/Pipeline.js` — priority 기반 등록/실행 |
| P-⑧ EventRegistry 추가 | EventBusHandler 단일 파일 | `src/systems/event/EventRegistry.js` — 타입별 핸들러 등록 |
| P-⑨ BossPhaseSystem 추가 | 미존재 | `src/systems/spawn/BossPhaseSystem.js` |
| P-⑩ PipelineProfiler 추가 | 미존재 | `src/systems/debug/PipelineProfiler.js` |
| P-⑪ SoundSystem 추가 | 미존재 | `src/systems/sound/SoundSystem.js` |
| P-⑫ WeaponSystem 테스트 | 미존재 | `tests/WeaponSystem.test.js` 추가 |
| P-⑬ DeathSystem 테스트 | 미존재 | `tests/DeathSystem.test.js` 추가 |
| P-⑭ 무기 행동 추가 | targetProjectile/orbit/areaBurst 3종 | boomerang, chainLightning 추가 (registry 2줄) |
| Q-① EliteBehaviorSystem stub | src/systems/movement/EliteBehaviorSystem.js 존재 | 파일 삭제 (re-export stub 제거) |
| Q-② SpatialGrid 구버전 | src/utils/SpatialGrid.js 미사용 중복 | 파일 삭제 (managers/ 버전 사용) |
| Q-③ validateData KNOWN_WEAPON_BEHAVIORS | 'boomerang','chainLightning' 누락 | 목록 동기화 수정 |
| Q-④ createEnemy dead branch | Dummy fallback 후 if (!data) 데드코드 | fallback 제거, 명확한 null 반환 |
| Q-⑤ validateUpgradeData type 버그 | u.type === 'weapon' (항상 false) | weapon_new/weapon_upgrade로 수정 |
| P0-① validateData 자동 동기화 | KNOWN_WEAPON_BEHAVIORS 하드코딩 | getRegisteredBehaviorIds() import |
| P0-② SynergySystem 데이터 경로 | upgradeData 인자 | synergyData.js 직접 import |
| P1-① 공용 테스트 픽스처 | 각 .test.js 내 중복 선언 | tests/fixtures/index.js 통합 |
| P1-② SynergySystem 테스트 | 미존재 | tests/SynergySystem.test.js 추가 |
| P1-② BossPhaseSystem 테스트 | 미존재 | tests/BossPhaseSystem.test.js 추가 |
| P1-③ sessionState v2 | v1 (best+options만) | v2 + meta{currency, permanentUpgrades} |
| P2-① drawBehaviorRegistry | drawProjectile.js 분기 | drawBehaviorRegistry 위임 패턴 |
| P2-② GLOW_THRESHOLD | RenderSystem.js 하드코딩 | constants.js RENDER.GLOW_THRESHOLD |
| P2-③ npm run profile | 미존재 | scripts/profile.js 헤드리스 시뮬레이션 |
| P2-④ EventRegistry 자동화 | clearAll 수동 나열 | EVENT_TYPES 루프 |

---

## 4. Standard Frame Pipeline (PlayScene)
`PlayContext.buildPipeline()` → `Pipeline` 인스턴스에 등록된 순서 (priority 오름차순):

| Priority | System |
|----------|--------|
| 10  | SpawnSystem (instance) |
| 20  | PlayerMovementSystem |
| 30  | EnemyMovementSystem |
| 35  | EliteBehaviorSystem |
| 40  | WeaponSystem |
| 50  | ProjectileSystem |
| 60  | CollisionSystem |
| 65  | StatusEffectSystem |
| 70  | DamageSystem |
| 75  | BossPhaseSystem |
| 80  | DeathSystem |
| 90  | ExperienceSystem |
| 100 | LevelSystem |
| 105 | EventRegistry (asSystem) |
| 110 | FlushSystem (instance) |
| 120 | CameraSystem |
| 130 | RenderSystem |

프레임 안에서의 실행 순서는 **"감지 → 기록 → 적용 → 업데이트/정리"**의 흐름을 띤다. (예: `destroyQueue` 사용, 배열을 돌며 즉시 삭제 `splice` 금지)

Pipeline context 구조:
```js
{ world, input, data, services }
// services: { projectilePool, effectPool, enemyPool, pickupPool, soundSystem, canvas }
```

---

## 5. 시스템 계약 구조 (System Contract)

각 System은 `update({ dt, input, world, data, services })` 혹은 구조분해할당된 매개변수를 받는다.
System 안으로 전체 `PlayContext` 객체를 보내지 않고 **필요한 상태 필드만 분해해서** 쓰는 것이 권장된다. (예: `world.player`, `world.deltaTime` 등)

* **상태 관리**: 
  - `world`: 프레임 간 런타임 게임 상태 (player, enemies, projectiles 등)
  - `world.events`: 프레임 내 단발성 이벤트 기록 (hits, deaths, levelUpRequested 등) - `EventRegistry`가 프레임 후반(105)에 소비/클리어함
  - `uiState`: 프레임과 무관한 UI 연동 (오버레이, 결과창 등)
  - `sessionState`: 런 종료 후나 재시작 시 유지되는 기록 (최고기록 등)
* **금지 패턴**:
  - 생성/삭제 즉시 반영 금지 (배열 순회 도중 삭제 X). `spawnQueue`, `pendingDestroy=true`를 활용한다.
  - Renderer가 충돌로 체력을 깎거나, Entity 내부 메서드에 복잡한 전투 스크립트를 짜는 것 금지.

---

## 6. 개발 및 확장 상세 규칙 (AI Extensions)

### 6.1 테스트 작성 & 검증 규칙
- 단위 테스트 실행: `npm test` (또는 `node --experimental-vm-modules scripts/runTests.js`)
- 데이터 무결성 검증: `npm run validate`
- 새 System이나 주요 로직을 추가할 때는 **반드시 같은 이름의 `.test.js` 파일을 `tests/` 에 함께 추가**한다.
- 모듈화/의존성 격리를 위해 테스트 픽스처(`makeEnemy`, `makePlayer` 등)는 각 `.test.js` 안에서 자체 선언한다 (공용 fixture 파일 지양).
- 테스트 실행 전 import 실패 등 환경 문제가 있으면 가급적 에러를 삼키고(`process.exit(0)`) 깔끔하게 스킵하도록 작성한다.

### 6.2 세션 및 상태 (`sessionState`) 규칙
- 게임 런이 완전히 종료되었을 때는 반드시 `updateSessionBest()` 처리 후 `saveSession()` (localStorage 저장) 순서로 체인 호출한다.
- `session.last`는 이번 판의 임시 결과용이며, 영구저장하지 않는다.
- `session.best`는 각 기록 축(예: 최다 킬, 최장 생존)별 독립된 수치이므로 한 런의 결과로 덮어쓰지 않고 각 필드별로 갱신판정을 한다.

### 6.3 무기 동작(Weapon/Behavior) 추가 규칙
- 새로운 투사체나 무기 패턴(예: boomerang)을 만들 때는 `src/behaviors/weaponBehaviors/` 에 별도 파일을 생성한다.
- `src/behaviors/weaponBehaviorRegistry.js` 에 해당 모듈을 import하고 `registry.set('newBehaviorId', fn)` 2줄을 추가한다.
- **`WeaponSystem.js` 코드는 직접 분기문(if/switch)을 넣거나 수정하지 않는다** (레지스트리 위임 패턴 준수).
- 발동 함수 시그니처: `({ weapon, player, enemies, spawnQueue, events? }) => boolean`
  - 발동 성공 시 `true`를 반환해 쿨다운을 소모시킨다.
  - 실패 시 `false`를 반환하면 WeaponSystem이 해당 무기 쿨다운을 0으로 만들어 다음 프레임에 곧바로 재시도를 유도한다.
- `chainLightning`처럼 즉발/관통 데미지면 투사체 없이 `events.hits` 큐에 직접 `Math.random()` 기반의 범위 내 적을 타격판정으로 밀어넣어도 좋다.
- `ProjectileSystem`단에서 특수한 이동/충돌 로직 분기가 필요하다면 해당 behavior 파일 최상단 주석에 가이드 코드를 명시하여 추적 가능하게 둔다.

### 6.4 시너지 (`SynergySystem`) 규칙
- 시너지 로직 추가 시, `SynergySystem.applyAll()` 은 `UpgradeSystem.applyUpgrade()` 적용 직후에 호출된다.
- 시너지 데이터 정의는 `upgradeData.js`와 분리된 `src/data/synergyData.js`에서 독립적으로 관리한다.
- 시너지는 특정 업그레이드 해제/삭제 시 처리가 꼬이는 것을 방지하기 위해 **매번 전체 조건을 재조사하고 완전 덮어씌우기(재계산) 연산 방식**을 택한다.

### 6.5 컨텍스트 (`PlayContext`) / 파이프라인 규칙
- 전역 Pool(오브젝트 리용)이나 Service(사운드 등) 객체 생성 및 부착은 오직 `PlayContext.create()` 안에서만 수행한다.
- 파이프라인 등록 및 순서 변경은 오직 `PlayContext.buildPipeline()` 함수 안에서만 수행한다.
- 런타임 도중 특정 시스템 실행을 막고 싶다면 `PlayContext.setSystemEnabled(system, false)` 를 쓴다.

### 6.6 이벤트 (`EventRegistry`) 규칙
- 이벤트 핸들링 추가 시 `EventRegistry.register('eventType', handlerFn)` 로 등록한다.
- 컴포넌트나 시스템에서 발생한 일은 가급적 다른 시스템을 직접 부르지 않고 `world.events.{type}.push(...)` 로 큐잉한다.
- `EventRegistry.clearAll(events)` 와 `EventRegistry.processAll(events)` 는 파이프라인에서 순위(현재 기준 105) 맞춰 자동 처리되므로, 각 시스템 안에서 임의로 큐를 비우지 않는다.

### 6.7 데이터 중심 설계 원칙
- **Id는 문자열**: `enemyId`, `weaponId` 등은 문자열로 식별.
- **단위 규약**: 속도(초당 픽셀), 쿨다운(초), 시간(초) 등 일관된 단위 체계 유지.
- 런타임 필드(`pendingDestroy`, 변동된 체력값)와 정적 데이터(`maxHp`, `baseDamage`)를 데이터 객체 내에 혼합하지 않는다.

### 6.8 폴더 구조 스냅샷(권장)
```text
src/
├─ core/       (Game, Pipeline, PlayContext 등 근간 흐름)
├─ scenes/     (상태 별 Scene: Title, Play, Result 등)
├─ entities/   (Player, Enemy 얇은 상태 객체 생성기)
├─ systems/    (combat/ movement/ progression/ spawn/ camera/ render/)
├─ behaviors/  (weaponBehaviors/ 등 구현 위임 모듈)
├─ data/       (상수, 무기/적/파도 데이터)
├─ renderer/   (Canvas 및 그래픽/오디오 출력부)
└─ ui/         (DOM 기반 UI 제어, 이벤트 후크)
```

---
> 작업 중 설계 충돌이 발견되거나, 위 규칙으로 설명할 수 없는 기능적 확장이 필요할 경우, 문서를 최신화하고 AGENTS.md(현재 문서)에 변경 로그를 남긴 후 실행한다.
