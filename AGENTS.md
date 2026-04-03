# AGENTS.md (AI Agent Project Guide)

이 문서는 이 프로젝트에 참여하는 AI Agent가 **설계 방향을 유지하면서 코드 생성, 수정, 리팩터링, 기능 추가**를 수행할 수 있도록 만든 **단일 진실의 원천(Single Source of Truth)**이다. 기존 `AI_AGENT_PROJECT_GUIDE.md`의 상세 내용과 규칙을 하나로 통합하였다.

---

## 1. Project Purpose & Phase
This project is an **HTML / JavaScript vampire-survivors-like game**.
The goal has moved from MVP to **Phase 2 (Expansion)**: adding Meta-progression, Bosses, complex Synergies, and Save/Load, while maintaining a stable combat loop based on strict responsibilities.

`AGENTS.md`는 **규범 문서**다. 현재 구현 상태, 씬 목록, 세부 파이프라인 구성처럼 자주 변하는 사실관계는 `docs/architecture-current.md`에 기록하고, 여기에는 **지속해서 강제할 규칙과 계약**만 남긴다.

---

## 2. 최우선 행동 원칙 (AI Agent Core Rules)

1. **책임 분리를 엄격히 유지한다**
   - **Scene**: 상태 진입/종료, 프레임 처리 순서, 화면 흐름만 담당. 전투(게임) 규칙 계산 절대 금지.
   - **Application Service**: use-case 조립과 쓰기 orchestration만 담당. `Scene`/`View` 구현을 직접 import하지 말고, 필요한 화면 전환/표시 객체는 scene/bootstrap 경계에서 주입받는다.
   - **System**: 한 가지의 게임 규칙(이동, 충돌, 스폰, 렌더준비 등)만 책임을 진다.
   - **Entity**: 데이터를 담는 얇은 상태 객체로 유지. (메서드에 복잡한 규칙 내장 금지)
   - **Renderer / UI**: 데이터 출력을 담당. 게임 규칙이나 월드 상태(`world`)를 직접 수정하는 것 금지.
2. **데이터 중심 확장을 우선한다**
   - 적/무기/업그레이드 등은 `src/data/` 확장을 1순위로 고려한다.
3. **변경 및 부작용의 최소화**
   - 관련 없는 파일을 무분별하게 건드리지 않고, 확장이 필요하다면 새로운 behavior나 handler를 등록하는 패턴을 쓴다.
4. **module-level static state 금지 (R-시리즈)**
   - 시스템 객체가 module scope에 SpatialGrid, 버퍼 배열 등을 선언하지 않는다.
   - **상태를 가지는 시스템**은 `createXxxSystem()` factory 함수로 생성하고, 상태는 클로저 내부에 보유한다.
   - 상태 없는 시스템은 singleton으로 둘 수 있지만, module-level static state를 새로 도입하면 안 된다.
5. **테스트 전용 메서드 금지 (R-시리즈)**
   - `_testWithData` 등 테스트를 위한 우회 메서드를 프로덕션 코드에 노출하지 않는다.
6. **아키텍처 경계는 edit-time + verify-time 이중 가드로 유지한다**
   - edit-time: `lint:eslint`의 `no-restricted-imports` 규칙으로 `domain -> presentation/browser`, `scene -> systems`, `app -> scenes(session bootstrap 제외)`, `app -> sessionFacade`, compatibility wrapper direct import, internal `sceneLoaders` direct import를 막는다.
   - verify-time: `check:cycles`, `check:boundaries`, `check:architecture-docs`가 import cycle, resolved import 경계, 문서 drift를 최종 판정한다.
   - 새 compatibility wrapper를 추가하거나 disposition이 바뀌면 `docs/compatibility-wrappers.md`와 관련 스크립트 snapshot을 함께 갱신한다.
   - browser debug/runtime hook 구현은 `src/adapters/browser/runtimeHooks.js`가 소유하고, `src/core/runtimeHooks.js`는 호환 re-export shim으로만 유지한다.
7. **씬 전환 wiring은 bootstrap scene factory가 소유한다**
   - `Scene`/`title runtime`/`play runtime` 내부 모듈은 `src/scenes/sceneLoaders.js`를 직접 import하지 않는다.
   - 다음 씬 생성은 `bootstrapBrowserGame()`이 주입한 `game.sceneFactory` 경로를 통해 수행한다.
   - `src/scenes/sceneLoaders.js`는 테스트/호환용 facade로만 유지하고, overlay lazy import는 별도 loader module이 소유한다.

---

## 3. Architecture Changes Log
| Change | Before | After |
|--------|--------|-------|
| **R-05** | `CollisionSystem` singleton + module-level `_grid` | `createCollisionSystem()` factory |
| **R-06** | `EnemyMovementSystem` singleton + module-level `_grid` | `createEnemyMovementSystem()` factory |
| **R-14** | `DeathSystem`이 `services.session.meta.currency` 직접 수정 | `world.events.currencyEarned` 이벤트 발행 → `PipelineBuilder` 핸들러가 수정 |
| **R-15** | `spawnQueue.push({ type, config })` 리터럴 직접 작성 | `spawnEnemy/Pickup/Effect/Projectile()` 팩토리 함수 사용 (`src/state/spawnRequest.js`) |
| **R-16** | `isLive/isDead/getLiveEnemies` 세 곳에 분산 구현 | `src/utils/entityUtils.js` 단일 소스. `compact.js`, `weaponBehaviorUtils.js`는 re-export |
| **R-17** | `Game.js`에서 `validateGameData({ upgradeData, weaponData, waveData })` — import 없이 사용 | `this.gameData`(이미 로드된 데이터) 재사용 |
| **R-18** | `SynergySystem`이 `synergyData`를 직접 import + DI 이중 접근 | 직접 import 완전 제거. `data.synergyData` DI 강제 |
| **R-19** | `PlayScene._showLevelUpUI()` → `UpgradeSystem.applyUpgrade()` 직접 호출 | `world.pendingUpgrade` 기록 → `UpgradeApplySystem`(priority 101)이 적용 |
| **R-20** | `PlayScene.js`에서 `world.playMode = 'playing'` 직접 대입 | `transitionPlayMode(world, PlayMode.PLAYING)` 사용 |
| **R-21** | `WorldTickSystem`이 이벤트 큐 초기화 안 함 | 프레임 시작 시 `EVENT_TYPES` 루프로 모든 이벤트 큐 초기화 |
| **R-22** | `InputState.debug = false` — bool 직접 할당 | `InputState.actions = Set<string>`. `isAction('debug')` API 사용 |
| **R-23** | `EFFECT_DEFAULTS.duration = 0.4` vs `EFFECT_DEFAULTS_SHAPE.maxLifetime = 0.5` 불일치 | 두 값 모두 `0.5`로 통일 |
| **R-28** | 전투/스폰/보상 시스템이 `Math.random()` 직접 호출 | `world.rng` 주입을 통해 gameplay randomness를 일원화 |
| **R-29** | 엔티티에 `_shootTimer`, `_phaseFlags` 같은 숨은 슬롯 저장 | `behaviorState`, `bossPhaseState` 같은 명시 슬롯 사용 |
| **R-30** | 성능 프로파일은 수동 확인만 가능 | `profile:check`를 로컬 `verify`와 CI 기준선에 포함 |

---

## 4. Standard Frame Pipeline (PlayScene)
`PlayContext.buildPipeline()`은 `PipelineBuilder`가 팩토리 시스템 인스턴스를 만들고, `SYSTEM_REGISTRY`의 상태 없는 시스템을 함께 등록해 파이프라인을 구성한다.

구체 priority와 현재 등록 순서는 `docs/architecture-current.md`를 기준으로 본다.
여기서는 아래 불변 규칙만 강제한다.

- 프레임 시작 메타/이벤트 큐 초기화는 가장 앞쪽 코어 시스템이 담당한다.
- 상태를 가지는 시스템은 `PipelineBuilder`가 팩토리 인스턴스로 생성해 등록한다.
- 상태 없는 시스템만 `SYSTEM_REGISTRY`에 singleton으로 등록한다.
- 이벤트 소비 시스템(`EventRegistry.asSystem`) 이후 구간은 이벤트를 읽지 않는다.
- 씬이 직접 처리하던 pending 상태(`pendingUpgrade`, run-start event 등)는 가능한 한 파이프라인 안의 전용 시스템이 소비한다.

---

## 5. 시스템 계약 구조

### 이벤트 흐름 (R-14 이후)
```
전투 시스템          world.events.*         인프라 핸들러 (PipelineBuilder)
─────────────────────────────────────────────────────────────────
DeathSystem     →  currencyEarned       →  earnCurrency(session, amount)
DeathSystem     →  deaths               →  bossPhaseHandler, soundHandler
LevelSystem     →  levelUpRequested     →  soundHandler
```

**전투/진행 시스템은 `session`을 직접 참조하지 않는다. (R-14)**

### pendingUpgrade 흐름 (R-19)
```
PlayScene._showLevelUpUI()
  → world.pendingUpgrade = selectedUpgrade   (씬: 기록만)
  → transitionPlayMode(world, PlayMode.PLAYING)

UpgradeApplySystem.update() [priority 101]
  → world.pendingUpgrade 소비
  → UpgradeSystem.applyUpgrade(player, upgrade, data.synergyData)
  → world.pendingUpgrade = null
```

### SpawnRequest 표준 (R-15)
```js
// 금지 — 리터럴 직접 작성
spawnQueue.push({ type: 'enemy', config: { enemyId: 'zombie', x, y } });

// 권장 — 팩토리 함수 사용
import { spawnEnemy, spawnPickup, spawnEffect } from '../../state/spawnRequest.js';
spawnQueue.push(spawnEnemy({ enemyId: 'zombie', x, y }));
```

### 엔티티 생사 판정 (R-16)
```js
// 금지 — 인라인 필터 패턴
enemies.filter(e => e.isAlive && !e.pendingDestroy)

// 권장 — entityUtils 사용
import { isLive, isDead, getLiveEnemies } from '../../utils/entityUtils.js';
getLiveEnemies(enemies)
```

---

## 6. 개발 및 확장 상세 규칙

### 6.1 테스트 작성 규칙
- 픽스처는 반드시 `tests/fixtures/index.js`에서 import
- factory 시스템: 각 테스트 케이스에서 `createXxxSystem()` 호출해 독립 인스턴스 사용
- DI 주입 패턴: `data: { synergyData: makeSynergyData(), ... }` 형태로 주입
- `makeWorldWithData()` 픽스처를 활용해 world + data 묶음 생성

### 6.2 세션 및 상태 (`sessionState`) 규칙
- **System은 session에 직접 접근하지 않는다** (R-14)
- session 수정은 PipelineBuilder에 등록된 이벤트 핸들러가 담당
- `updateSessionBest()` → `saveSession()` 체인은 PlayResultHandler에서만 호출
- `src/app/*`는 `src/state/sessionFacade.js`를 직접 import하지 않는다. 실제 쓰기 소유권은 `src/app/session/*` 서비스에 있다.
- 시작 무기 선택 저장은 공용 `startLoadoutRuntime` 정규화 경로를 통해서만 수행한다. UI가 기본 시작 무기 ID를 하드코딩하면 안 된다.

### 6.3 무기 동작(Weapon/Behavior) 추가 규칙
- `src/behaviors/weaponBehaviors/`에 별도 파일 생성
- `weaponBehaviorRegistry.js`에 2줄 추가
- `WeaponSystem.js` 직접 수정 금지

### 6.4 시너지 (`SynergySystem`) 규칙
- `synergyData`는 반드시 `data.synergyData`로 DI됨 (직접 import 금지)
- `UpgradeSystem.applyUpgrade(player, upgrade, synergyData)` — synergyData 명시적 전달 필수

### 6.5 컨텍스트 (`PlayContext`) / 파이프라인 규칙
- factory 시스템(`createXxxSystem()`)은 PipelineBuilder가 인스턴스를 생성함
- `SYSTEM_REGISTRY`에는 **상태 없는 singleton 시스템만** `{ system, priority }` 형태로 등록한다.
- 상태를 가지는 factory 시스템은 `PipelineBuilder`에서 직접 생성하고 `pipeline.register()` 한다.
- browser runtime service(`nowSeconds`, `createAudioContext` 등)는 `PlayContext`/system이 직접 browser adapter를 import하지 않고 bootstrap/adapters 경계에서 주입한다.

### 6.6 이벤트 (`EventRegistry`) 규칙
- 새 이벤트 타입은 `src/data/constants/events.js`의 `EVENT_TYPES`에 추가
- EventRegistry와 자동 동기화됨 (루프 기반)
- `EventRegistry.asSystem`(priority 105) 이후 시스템은 이벤트를 읽어서는 안 됨
- WorldTickSystem(priority 0)이 프레임 시작 시 이벤트 큐를 초기화함

### 6.7 새 규칙 요약
```
R-22: InputState.actions Set 사용 (bool 직접 할당 금지)
R-23: EFFECT_DEFAULTS.duration = 0.5 (entityDefaults.maxLifetime와 통일)
R-24: spawnRequest 팩토리는 config를 그대로 전달한다. (destructuring 필드 유실 금지)
R-25: 엔티티 객체에 _ 시스템 내부 상태 저장 금지 (synergyState 등 전용 슬롯 사용)
R-26: GameDataLoader의 JSON clone 시 behaviorState 등 함수 필드 복원 필수
R-27: 프로덕션 시스템은 enemy.enemyDataId를 참조한다. (enemyId는 테스트 전용)
R-28: gameplay randomness는 world.rng를 통해 주입한다. (전투/스폰/보상 계층의 Math.random 직접 호출 금지)
R-29: 적의 임시 타이머/페이즈 상태는 behaviorState, bossPhaseState 등 명시 슬롯에 둔다.
R-30: 성능 예산 검증은 profile:check를 SSOT로 삼고 verify/CI에 포함한다.
```

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
> 작업 중 설계 충돌이 발견되거나, 위 규칙으로 설명할 수 없는 기능적 확장이 필요할 경우:
> 1. 규칙 자체가 바뀌면 `AGENTS.md`를 갱신한다.
> 2. 현재 구현 사실만 바뀌면 `docs/architecture-current.md`를 갱신한다.
