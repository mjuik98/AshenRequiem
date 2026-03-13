# AI Agent Project Guide
## 뱀서라이크 프로젝트 아키텍처 및 구현 지침

이 문서는 이 프로젝트에 참여하는 AI Agent가 **설계 방향을 유지하면서 코드 생성, 수정, 리팩터링, 기능 추가**를 수행할 수 있도록 만든 기준 문서다.
본 프로젝트는 **HTML / JavaScript 기반 뱀서라이크 MVP**를 목표로 하며, 핵심 방향은 **빠르게 플레이 가능한 루프를 구현하되, 구조가 무너지지 않도록 최소한의 경계와 계약을 유지하는 것**이다.
이 문서는 업로드된 설계 문서의 핵심 원칙을 바탕으로, AI가 실제 작업 지침으로 바로 사용할 수 있게 재구성한 것이다.

---

## 1. 프로젝트 목표

이 프로젝트의 MVP 목표는 아래 루프가 안정적으로 성립하는 것이다.

**이동 → 공격 → 처치 → 성장 → 압박 증가 → 사망 또는 생존 기록**

MVP에 포함되는 핵심 범위:

- 플레이어 이동
- 적 추적 이동
- 자동 공격 1~2종
- 적 처치
- 경험치 드랍 및 획득
- 레벨업 시 3개 선택지 제공
- 시간 경과에 따른 적 증가
- 사망 시 결과 화면 표시

MVP 단계에서는 아래 항목을 기본적으로 후순위로 둔다.

- 세이브 / 로드
- 메타 진행
- 로컬라이징
- 복잡한 상태이상 시스템
- 고급 AI
- 고급 오브젝트 풀링
- 보스 연출
- 정교한 애니메이션 프레임워크
- 복잡한 장비 슬롯 시스템
- 네트워크 동기화

이 범위 정의는 업로드된 설계 문서의 MVP 기준과 일치한다.

---

## 2. AI Agent의 최우선 행동 원칙

AI Agent는 작업 시 아래 우선순위를 반드시 따른다.

1. **플레이 가능한 루프를 우선한다**
   - 구조를 위해 기능 구현을 지나치게 늦추지 않는다.
   - 과설계보다 작동하는 MVP를 우선한다.

2. **책임 분리를 유지한다**
   - Scene는 흐름 제어만 담당한다.
   - System은 게임 규칙만 담당한다.
   - Entity는 상태 보관 중심으로 유지한다.
   - Renderer는 출력만 담당한다.

3. **데이터와 로직을 분리한다**
   - 적, 무기, 업그레이드, 웨이브는 가능한 한 데이터 정의로 확장한다.
   - 복잡한 동작이 생길 때만 behavior 또는 전용 시스템으로 분리한다.

4. **변경 범위를 최소화한다**
   - 기존 구조를 깨지 않고, 필요한 모듈만 수정한다.
   - 관련 없는 파일을 광범위하게 건드리지 않는다.

5. **직접 참조보다 계약을 우선한다**
   - 각 모듈은 무엇을 읽고, 무엇을 쓰며, 무엇을 출력하는지 명확해야 한다.
   - 가능한 한 필요한 데이터만 전달한다.

이 원칙들은 원문 설계서의 Scene/System/Entity/Renderer 분리 원칙과 “작게 시작하고 필요할 때 분리”라는 해석 원칙을 기반으로 한다.

---

## 3. 핵심 아키텍처 원칙

### 3.1 Scene는 흐름만 담당한다
Scene는 다음만 담당한다.

- 상태 진입 / 종료
- 시스템 호출 순서 조합
- 씬 전환
- UI 오버레이 상태 제어

Scene는 다음을 직접 계산하지 않는다.

- 전투 판정
- 데미지 계산
- 충돌 계산
- 스폰 규칙
- 렌더링 세부 동작

### 3.2 Entity는 상태 객체 중심으로 둔다
Entity는 가능한 한 얇은 상태 객체로 유지한다.

권장 예시:
- `createPlayer()`
- `createEnemy(enemyId)`
- `createProjectile(config)`
- `createPickup(config)`

Entity 내부에 과도한 규칙 로직을 넣지 않는다.

### 3.3 System은 한 가지 책임만 가진다
각 시스템은 한 가지 책임에 집중한다.

예:
- 이동은 이동만
- 충돌은 충돌만
- 데미지는 데미지만
- 스폰은 스폰만

### 3.4 Renderer는 게임 규칙을 몰라야 한다
Renderer는 무엇을 그릴지만 알고, 왜 그런 상태가 되었는지는 몰라야 한다.

### 3.5 처음에는 단순하게, 반복이 보일 때 분리한다
처음부터 범용 엔진을 만들지 않는다.
실제 중복, 충돌, 버그 패턴이 보일 때 구조를 추가한다.

위 원칙들은 업로드된 설계 문서의 핵심 설계 원칙을 작업 지침으로 재정리한 것이다.

---

## 4. 권장 계층 구조

프로젝트는 아래 계층 구조를 기준으로 유지한다.

### 4.1 Core 계층
역할:
- 게임 시작
- 메인 루프 실행
- 입력 수집
- 씬 전환
- 공용 서비스 생성

대표 모듈:
- `Game`
- `GameLoop`
- `SceneManager`
- `Input`

### 4.2 Scene 계층
역할:
- 화면 흐름
- 현재 상태 전이
- 시스템 호출 순서 정의
- UI 상태 제어

대표 모듈:
- `TitleScene`
- `PlayScene`
- `ResultScene`

### 4.3 Domain / Systems 계층
역할:
- 이동
- 공격
- 충돌
- 데미지
- 스폰
- 경험치
- 레벨업
- 업그레이드
- 카메라
- 렌더 준비

### 4.4 Data 계층
역할:
- 적 정의
- 무기 정의
- 업그레이드 정의
- 웨이브 정의
- 기본 수치 / 상수 정의

### 4.5 Presentation 계층
역할:
- Canvas 렌더링
- HUD
- 레벨업 UI
- 결과 UI
- DOM 기반 오버레이

이 계층 분리는 원문 설계서의 core / scenes / entities / systems / data / renderer 구분 및 HTML/Canvas 분리 전략을 확장해 정리한 것이다.

---

## 5. 권장 폴더 구조

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

이 구조는 업로드된 문서의 최소 시작안과 확장 목표안을 실제 작업용 구조로 통합한 제안이다. 핵심은 **처음부터 모든 파일을 만들라는 뜻이 아니라, 이 책임 경계를 기준으로 점진적으로 분리하라는 것**이다.

---

## 6. 모듈별 역할과 책임

### 6.1 `core/`
책임:
- 게임 실행 진입점
- 루프 구동
- 입력 접근
- 씬 전환
- 전역 서비스 초기화

금지:
- 전투 규칙을 직접 소유하는 것

### 6.2 `scenes/`
책임:
- 상태 진입 / 종료
- 프레임 처리 순서 제어
- UI 상태 전환
- 게임 모드 전환

금지:
- 충돌, 데미지, 스폰 등의 구체 계산

### 6.3 `entities/`
책임:
- 런타임 상태 보관
- 생성 시 기본값 세팅
- 타입별 초기 수치 구성

금지:
- 다른 시스템 직접 호출
- 렌더링 세부 지식 내장
- 전투 규칙 다수 포함

### 6.4 `systems/`
책임:
- 실제 게임 규칙 처리
- 상태 변경
- 이벤트 기록
- spawn / destroy 요청 기록

금지:
- 서로의 내부 구현 세부사항에 강하게 결합되는 것
- 렌더러 직접 호출 남발

### 6.5 `data/`
책임:
- 정적 콘텐츠 정의
- 밸런스 수치 보관
- 확장 포인트 제공

금지:
- 런타임 파생 상태 저장
- 구현 중 임시 상태 누적

### 6.6 `renderer/`
책임:
- Canvas 기반 출력
- 레이어 순서 유지
- 카메라 반영
- draw helper 호출

금지:
- 데미지 계산
- AI 판단
- 충돌 판정
- 레벨업 규칙 처리

### 6.7 `ui/`
책임:
- HUD 표시
- 레벨업 선택 UI
- 결과 화면
- DOM 이벤트를 Scene 또는 Input 계층으로 전달

금지:
- 게임 규칙 직접 수정

이 책임 정의는 원문 설계서의 폴더별 책임과 금지 규칙을 AI 작업 기준으로 다시 구조화한 것이다.

---

## 7. 의존성 규칙

### 7.1 허용
- Scene → System 호출
- Scene → Manager 접근
- Scene → UI 상태 제어
- System → Data 참조
- System → EntityManager 접근
- RenderSystem → Renderer 호출
- Renderer → 읽기 전용 렌더 데이터 접근

### 7.2 조건부 허용
- System → `world` 읽기
- System → 자신의 책임 범위 상태만 쓰기
- System → 이벤트 큐 / spawnQueue / destroyQueue 기록

### 7.3 금지
- 일반 System이 Renderer를 직접 호출하는 것
- Renderer가 전투 규칙을 변경하는 것
- Entity가 다른 System을 직접 호출하는 것
- System끼리 무분별하게 서로 내부 상태를 수정하는 것
- Manager가 전투 규칙을 소유하는 것
- Scene에 계산 로직이 계속 누적되는 것

의존성이 애매하면 아래 기준으로 판단한다.

- 게임 규칙이면 `system`
- 상태 저장이면 `entity` 또는 `manager`
- 출력이면 `renderer` 또는 `ui`
- 흐름 제어면 `scene`

이 의존성 규칙은 원문 설계 문서의 허용 / 조건부 허용 / 금지 규칙을 그대로 계승한다.

---

## 8. 상태 관리 기준

상태는 아래 네 종류로 나눈다.

### 8.1 월드 상태 (`world`)
전투 중 실시간으로 변하는 상태를 담는다.

예시:
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

### 8.2 UI 상태 (`uiState`)
HUD, 레벨업 오버레이, 결과 화면 등 표현 상태를 담는다.

### 8.3 세션 상태 (`sessionState`)
옵션, 최고 기록, 잠금 해제 정보 같은 세션/영속 후보 상태를 담는다.
MVP에서는 최소화한다.

### 8.4 프레임 이벤트 상태 (`world.events`)
한 프레임 내에서 기록되고 소비되는 사실 이벤트를 담는다.

중요 원칙:
- `gameContext`를 모든 시스템에 통째로 넘기지 않는다.
- 필요한 하위 참조만 잘라서 전달한다.
- 누가 어떤 상태를 쓸 수 있는지 제한한다.

이 상태 관리 구조와 `world` / `gameContext` 사용 규칙은 업로드된 설계 문서의 월드 모델 예시와 보강 규칙을 따른다.

---

## 9. 프레임 데이터 흐름 표준

`PlayScene`의 기본 프레임 순서는 아래와 같이 유지한다.

1. 입력 갱신
2. 게임 시간 갱신
3. 스폰 처리
4. 플레이어 이동
5. 적 이동
6. 무기 발동 및 공격 생성 요청
7. 투사체 이동
8. 충돌 판정
9. 데미지 적용
10. 사망 처리 및 드랍 생성 요청
11. 경험치 흡수 처리
12. 레벨업 여부 확인
13. 생성 큐 / 삭제 큐 반영
14. 카메라 갱신
15. 렌더링

한 프레임 안에서는 다음 순서를 유지한다.

**감지 → 기록 → 적용 → 정리**

이 업데이트 순서는 업로드된 설계 문서의 표준 프레임 순서를 기반으로 하며, 충돌/삭제/레벨업 타이밍 문제를 줄이는 핵심 규칙이다.

---

## 10. 생성 / 삭제 라이프사이클 규칙

AI Agent는 엔티티 생성 / 삭제를 다룰 때 아래 규칙을 반드시 지킨다.

### 10.1 순회 중 즉시 삭제 금지
배열 순회 중 `splice` 또는 직접 삭제를 남발하지 않는다.
삭제 대상은 `destroyQueue`에 넣는다.

### 10.2 생성도 큐 기반을 우선
새 적, 새 투사체, 새 픽업은 가능하면 `spawnQueue`에 기록하고 프레임 후반에 반영한다.

### 10.3 삭제 대기 엔티티는 즉시 비활성화
`pendingDestroy = true` 또는 `isAlive = false` 같은 플래그로 같은 프레임 후속 처리에서 제외한다.

### 10.4 사망 후처리 책임 집중
처치 수 증가, 경험치 드랍, 이펙트 생성, 사망 사운드 등은 여러 곳에서 중복 처리하지 않고 한 곳에서만 트리거한다.

### 10.5 삭제 예정 객체는 정상 객체처럼 취급하지 않는다
`pendingDestroy`가 설정된 객체는 다른 시스템에서 일반 오브젝트처럼 다루지 않는다.

이 규칙은 원문 설계서의 생성 / 삭제 라이프사이클 규칙을 그대로 반영한다.

---

## 11. 시스템 계약 표준

AI Agent가 시스템을 새로 만들거나 수정할 때는 반드시 아래 형태로 계약을 먼저 생각한다.

### 공통 형식
```js
system.update({
  dt,
  input,
  world,
  data,
  services,
});
```

실제 구현에서는 가능하면 아래처럼 필요한 데이터만 잘라서 전달한다.

```js
playerMovementSystem.update({
  input,
  player: world.player,
  deltaTime: world.deltaTime,
});
```

### 예시 계약

#### `PlayerMovementSystem`
- 입력: `input`, `player`, `deltaTime`
- 읽기: 위치, 이동 속도, 입력 방향
- 쓰기: 플레이어 위치, 방향
- 출력: 없음

#### `EnemyMovementSystem`
- 입력: `player`, `enemies`, `deltaTime`
- 읽기: 플레이어 위치, 적 위치, 적 속도
- 쓰기: 적 위치
- 출력: 없음

#### `WeaponSystem`
- 입력: `player`, `enemies`, `weaponState`, `deltaTime`
- 읽기: 적 목록, 쿨다운, 무기 데이터
- 쓰기: 무기 내부 상태
- 출력: `spawnQueue`에 공격 생성 요청

#### `CollisionSystem`
- 입력: `player`, `enemies`, `projectiles`, `pickups`
- 읽기: 위치, 반지름, 생존 상태
- 쓰기: 직접 체력 수정 금지
- 출력: `events.hits`, `events.pickupCollected`

#### `DamageSystem`
- 입력: `events.hits`
- 읽기: 공격력, 대상 체력, 방어 값
- 쓰기: 대상 체력, 피격 상태, 사망 상태
- 출력: `events.deaths`

#### `ExperienceSystem`
- 입력: `events.deaths`, `events.pickupCollected`
- 읽기: 경험치 값, 흡수 반경
- 쓰기: 플레이어 경험치, 픽업 상태
- 출력: 픽업 스폰 요청, 레벨업 후보 이벤트

#### `LevelSystem`
- 입력: 플레이어 경험치 / 현재 레벨
- 읽기: 레벨 테이블
- 쓰기: 플레이어 레벨, `playMode`
- 출력: 레벨업 UI 오픈 요청

#### `UpgradeSystem`
- 입력: 플레이어 상태, 보유 무기, 업그레이드 데이터
- 읽기: `upgradeData`, 현재 보유 레벨
- 쓰기: 선택 결과 반영
- 출력: 플레이어 / 무기 수치 갱신

#### `SpawnSystem`
- 입력: `elapsedTime`, `waveData`, 플레이어 위치, 카메라 범위
- 읽기: 현재 웨이브 규칙
- 쓰기: 직접 배열 삽입 금지
- 출력: 적 생성 요청

#### `RenderSystem`
- 입력: 월드 상태, 카메라 상태
- 읽기: 엔티티 렌더 정보
- 쓰기: 게임 규칙 상태 수정 금지
- 출력: Renderer 호출

이 시스템 계약 표준은 원문 설계 문서의 계약 예시와 설계 원칙을 기반으로 한다.

---

## 12. 확장 포인트 기준

AI Agent는 아래 경우에 확장 포인트를 사용한다.

### 12.1 새 무기 패턴
조건:
- 무기 동작 패턴이 2~3개 이상 뚜렷하게 분리될 때

대응:
- `behaviorId`
- `weaponBehaviorRegistry`
- `weaponBehaviors/*`

### 12.2 새 적 패턴
조건:
- 단순 추적형 이상으로 서로 다른 이동 / 공격 패턴이 생길 때

대응:
- `enemyBehaviorId`
- 적 전용 시스템 또는 behavior 함수

### 12.3 새 상태 이상 / 효과
조건:
- 도트, 슬로우, 스턴, 버프/디버프 등 지속 효과가 늘어날 때

대응:
- `StatusEffectSystem`
- `statusEffects/`
- 프레임 단위 effect tick 처리

### 12.4 성능 최적화
조건:
- 오브젝트 수 증가로 충돌, 생성/삭제 비용 문제가 현실화될 때

대응:
- Object Pool
- Spatial Hash / Grid
- Partitioner

확장 포인트는 원문 설계 문서의 “처음에는 단순하게, 반복이 보일 때 분리” 원칙에 따라 도입한다.

---

## 13. 데이터 설계 원칙

AI Agent는 콘텐츠 추가 시 가능한 한 데이터 중심으로 작업한다.

### 13.1 공통 규칙
- `id`는 문자열
- 수치 필드는 단위 명시
- 기본값이 있으면 문서화
- 런타임 파생값은 데이터 원본에 섞지 않음

### 13.2 단위 규약
- `cooldown`: 초
- `moveSpeed`: 초당 픽셀
- `projectileSpeed`: 초당 픽셀
- `range`: 픽셀
- `radius`: 픽셀
- `rotationSpeed`: 초당 라디안
- `spawnPerSecond`: 초당 개수

### 13.3 검증 권장
초기화 단계에서 가능한 경우 아래를 검증한다.

- 모든 `id`가 중복되지 않는가
- 참조하는 `weaponId`가 실제 존재하는가
- `maxLevel >= 1` 인가
- `spawnPerSecond >= 0` 인가
- `from < to` 가 성립하는가

이 데이터 설계 기준과 단위 규약은 업로드된 설계 문서의 데이터 중심 설계 장을 기반으로 한다.

---

## 14. UI / 렌더링 경계

### Canvas가 담당할 것
- 플레이어
- 적
- 투사체
- 픽업
- 이펙트
- 카메라 이동이 필요한 월드 오브젝트

### HTML / CSS / DOM이 담당할 것
- 타이틀 메뉴
- HUD 일부
- 레벨업 카드 선택 UI
- 일시정지 메뉴
- 결과 화면
- 디버그 패널

### 규칙
- UI는 상태를 보여주고 입력을 전달한다.
- UI가 게임 규칙을 직접 계산하지 않는다.
- Renderer는 읽기 전용 표현 계층을 유지한다.

이 분리는 원문 설계 문서의 HTML / Canvas UI 전략을 반영한다.

---

## 15. 웹 환경 특화 규칙

AI Agent가 브라우저 기반 구현을 수정할 때는 아래를 고려한다.

- 비정상적으로 큰 `deltaTime`에 상한을 둔다.
- `devicePixelRatio` 대응을 고려한다.
- 키 입력 포커스가 DOM으로 넘어가는 문제를 고려한다.
- 화살표 키 / 스페이스바 등 브라우저 기본 동작과 충돌하는 입력을 관리한다.
- 리사이즈 시 캔버스 / 카메라 / UI 배치를 함께 갱신한다.
- 에셋 로드가 실제로 생기면 로드 완료 전 Scene 진입을 막는다.

이 규칙들은 업로드된 설계 문서의 웹 환경 특화 주의점을 정리한 것이다.

---

## 16. AI Agent가 작업할 때 따라야 할 수정 규칙

### 16.1 새 기능 추가 시
- 먼저 이 기능이 `scene`, `system`, `entity`, `data`, `renderer`, `ui` 중 어디 책임인지 판별한다.
- 책임이 둘 이상 섞이면 기능을 쪼갠다.

### 16.2 기존 코드 수정 시
- 기존 책임 경계를 먼저 파악한다.
- 경계를 무너뜨리는 빠른 임시 수정은 피한다.
- 필요한 경우 이벤트 또는 큐를 추가한다.

### 16.3 리팩터링 시
- 동작 보존을 우선한다.
- 거대한 파일을 줄일 때는 “기능 단위 분리”보다 “책임 단위 분리”를 우선한다.
- `PlayScene`이 커질수록 Scene에서 계산을 빼고 System으로 옮긴다.

### 16.4 데이터 추가 시
- 가능한 한 `data/*`에 추가한다.
- 동작 차이가 수치 차이만으로 해결되지 않으면 behavior를 검토한다.

### 16.5 UI 수정 시
- UI가 직접 월드 상태를 조작하지 않게 한다.
- 상태 변경은 Scene 또는 System이 담당한다.

---

## 17. 금지 패턴

AI Agent는 아래 패턴을 만들지 않는다.

- Renderer가 데미지를 계산하는 것
- Entity가 다른 Entity를 직접 찾아 수정하는 것
- Scene가 전투 규칙을 계속 직접 계산하는 것
- `spawnQueue` 없이 배열에 즉시 삽입하는 것
- 순회 중 `splice` 삭제를 남발하는 것
- `upgradeData`에 구현 전용 임시 플래그를 계속 누적하는 것
- `gameContext` 전체를 무분별하게 모든 함수에 전달하는 것
- 한 시스템이 여러 시스템 책임을 동시에 가져가는 것

이 금지 패턴은 업로드된 설계 문서의 경고 신호와 금지 항목을 반영한다.

---

## 18. 구현 순서 권장안

AI Agent가 프로젝트를 처음부터 세팅하거나 대규모 기능을 이어 붙일 때는 아래 순서를 우선 고려한다.

1. 플레이어 이동
2. 적 단순 추적
3. 기본 렌더링
4. 자동 공격 1종
5. 투사체 처리
6. 적 사망
7. 경험치 픽업
8. 레벨업 진입
9. 업그레이드 3선택 UI
10. 시간 기반 스폰 증가
11. 결과 화면
12. 디버그 UI
13. 두 번째 무기 패턴
14. 업그레이드 데이터 확장
15. 난이도 조정

이 구현 순서 권장안은 업로드된 설계 문서의 단계별 구현 순서를 바탕으로 한다.

---

## 19. 작업 전 체크리스트

AI Agent는 작업 전에 아래를 확인한다.

- 이 변경은 어느 계층의 책임인가?
- 이 기능은 데이터 추가로 끝낼 수 있는가?
- Scene가 계산을 떠안고 있지는 않은가?
- Renderer / UI가 규칙을 직접 처리하고 있지는 않은가?
- spawn / destroy를 즉시 반영하고 있지는 않은가?
- 상태를 직접 수정하기보다 이벤트 또는 큐로 표현하는 편이 더 안전한가?
- 새 파일 분리가 필요한가, 아니면 기존 파일에서 책임 유지가 가능한가?

---

## 20. 최종 요약

이 프로젝트에서 AI Agent가 반드시 기억해야 할 핵심은 아래 다섯 가지다.

1. **Scene는 흐름만 관리한다**
2. **System은 한 가지 책임만 가진다**
3. **Entity는 상태 보관 중심으로 둔다**
4. **데이터와 로직을 분리한다**
5. **생성 / 삭제 / 이벤트 흐름을 명확히 한다**

가장 중요한 목표는 **완벽한 구조를 만드는 것**이 아니라,
**빠르게 검증 가능한 전투 루프를 안정적으로 구현하는 것**이다.

다만 기능이 커질수록 구조가 무너지지 않게 하려면,
이 문서의 경계와 계약을 작업 기준으로 유지해야 한다.
