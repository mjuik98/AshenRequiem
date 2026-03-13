# Vamplike

> HTML / JavaScript 기반의 뱀서라이크(Vampire Survivors-like) 프로젝트입니다.  
> 빠르게 **플레이 가능한 전투 루프**를 만들되, 이후 기능 확장에도 버티는 구조를 목표로 합니다.

## 프로젝트 소개

이 프로젝트는 브라우저 환경에서 동작하는 뱀서라이크 스타일 게임을 만드는 것을 목표로 합니다.
초기 단계에서는 과한 시스템화보다 **재미를 검증할 수 있는 MVP**를 우선하고, 구조는 그 MVP가 무너지지 않을 정도로만 단단하게 유지하는 방향을 채택합니다.

핵심 목표는 아래 루프가 자연스럽게 돌아가는 상태를 만드는 것입니다.

**이동 → 자동 공격 → 적 처치 → 경험치 획득 → 레벨업 선택 → 점점 강해지는 압박을 버티기**

---

## MVP 목표

현재 MVP에서 우선하는 범위는 다음과 같습니다.

- 플레이어 이동
- 적 추적 이동
- 자동 공격 1~2종
- 적 처치
- 경험치 드랍 및 획득
- 레벨업 시 3개 선택지 제공
- 시간 경과에 따른 적 증가
- 사망 시 결과 화면 표시

반대로 아래 항목은 MVP에서 기본적으로 후순위입니다.

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

---

## 설계 방향

이 프로젝트는 처음부터 범용 엔진을 만드는 대신, 아래 원칙을 지키며 작게 시작합니다.

### 1. Scene는 흐름만 담당
Scene는 화면 전환, 상태 진입/종료, 시스템 호출 순서 같은 **흐름 제어**를 담당합니다.
전투 규칙, 충돌 계산, 데미지 처리 같은 실제 게임 규칙은 Scene 안에 쌓지 않습니다.

### 2. System은 게임 규칙 담당
실제 게임 로직은 System 단위로 분리합니다.
예를 들어 이동, 충돌, 데미지, 스폰, 경험치, 레벨업은 각각 독립된 책임을 갖도록 설계합니다.

### 3. Entity는 상태 중심
플레이어, 적, 투사체, 픽업 같은 월드 오브젝트는 무거운 클래스보다 **얇은 상태 객체**에 가깝게 유지합니다.

### 4. Renderer는 출력만 담당
렌더러와 UI는 화면에 무엇을 보여줄지만 알고, 왜 그 상태가 되었는지는 몰라야 합니다.
즉, 렌더링 계층은 게임 규칙을 직접 바꾸지 않습니다.

### 5. Data 중심 확장
적, 무기, 업그레이드, 웨이브는 가능한 한 데이터 정의로 추가할 수 있게 설계합니다.
복잡한 동작 차이가 생겼을 때만 behavior나 전용 시스템으로 확장합니다.

---

## 기술 방향

이 프로젝트는 브라우저 환경을 전제로 하며, 표현 계층을 아래처럼 나눕니다.

- **Canvas**: 플레이어, 적, 투사체, 이펙트 등 월드 렌더링
- **DOM / HTML UI**: HUD, 레벨업 선택지, 결과 화면, 디버그 UI

이 분리는 게임 월드 렌더링과 인터페이스 구성을 분리해서, 개발 속도와 유지보수성을 함께 확보하기 위한 선택입니다.

---

## 아키텍처 개요

전체 구조는 아래처럼 생각하면 됩니다.

```text
Core
 ├─ 게임 시작
 ├─ 메인 루프
 ├─ 입력 처리
 └─ 씬 전환

Scenes
 ├─ TitleScene
 ├─ PlayScene
 └─ ResultScene

Systems
 ├─ 이동
 ├─ 공격
 ├─ 충돌
 ├─ 데미지
 ├─ 스폰
 ├─ 경험치
 ├─ 레벨업
 └─ 렌더 준비

Entities
 ├─ Player
 ├─ Enemy
 ├─ Projectile
 ├─ Pickup
 └─ Effect

Presentation
 ├─ Canvas Renderer
 └─ DOM UI
```

핵심은 다음 한 줄로 요약할 수 있습니다.

> **Scene는 흐름을 조립하고, System은 규칙을 처리하고, Entity는 상태를 담고, Renderer/UI는 결과를 보여준다.**

---

## 추천 디렉토리 구조

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

이 구조는 처음부터 모든 파일을 반드시 다 만들라는 뜻이 아닙니다.  
**작게 시작하고, 반복과 충돌이 보일 때 분리하는 것**이 기본 원칙입니다.

---

## 플레이 씬의 프레임 흐름 예시

전투 루프에서는 대체로 아래 순서가 기준이 됩니다.

```text
Input
→ Time Update
→ Spawn
→ Player Move
→ Enemy Move
→ Weapon Trigger
→ Projectile Move
→ Collision Detect
→ Damage Apply
→ Death / Drop
→ Experience Collect
→ Level Check
→ Flush Spawn/Destroy
→ Camera Update
→ Render
```

이 순서를 고정해두면 생성/삭제, 충돌/데미지, 사망/드랍 처리의 꼬임을 줄이기 쉽습니다.

---

## 개발 원칙

### 이런 방향을 지향합니다

- 플레이 가능한 결과를 빠르게 만든다
- 책임 분리가 드러나는 구조를 유지한다
- 데이터 추가만으로 콘텐츠를 늘릴 수 있게 한다
- 과설계보다 점진적 분리를 택한다
- 브라우저 환경에 맞는 단순하고 명확한 구조를 선호한다

### 이런 패턴은 피합니다

- Scene에 전투 계산이 계속 누적되는 구조
- Renderer가 충돌/데미지/AI를 직접 다루는 구조
- System끼리 서로 내부 상태를 마구 수정하는 구조
- Manager가 게임 규칙까지 소유하는 구조
- 배열 순회 중 즉시 삭제해서 상태가 꼬이는 처리
- 신규 무기/적 추가 시 로직 분기문만 계속 늘어나는 구조

---

## 향후 확장 방향

MVP가 안정화되면 아래 방향으로 확장할 수 있습니다.

- 더 다양한 무기와 투사체 패턴
- 업그레이드 시너지
- 엘리트 / 보스 적
- 상태이상 시스템
- 오브젝트 풀링 최적화
- 사운드 및 연출 강화
- 저장/불러오기
- 메타 진행 요소

다만 이 프로젝트는 **확장 가능성 자체보다, 먼저 재미와 루프를 검증하는 것**을 우선합니다.

---

## 협업 문서

이 저장소에는 사람을 위한 README 외에도, AI 에이전트 작업 기준을 담은 문서를 둘 수 있습니다.

- `README.md`: 사람을 위한 프로젝트 소개 문서
- `AGENTS.md`: AI Agent용 작업 규칙 및 아키텍처 계약 문서

즉, README는 프로젝트를 이해하기 위한 입구이고, AGENTS 문서는 실제 수정 작업 시 지켜야 할 내부 규약에 가깝습니다.

---

## 현재 상태

이 README는 현재 프로젝트의 **방향성과 아키텍처 기준**을 설명하기 위한 문서입니다.
실행 방법, 빌드 방법, 스크린샷, 데모 링크, 실제 키 조작 방식 등은 프로젝트 구현이 진행되면서 저장소 상태에 맞게 추가하면 됩니다.

아래 섹션은 추후 보강하기 좋습니다.

- 스크린샷 / GIF
- 플레이 방법
- 개발 환경 및 실행 방법
- TODO / Roadmap
- 라이선스

---

## 요약

이 프로젝트는 **HTML / JavaScript 기반 뱀서라이크 MVP**를 빠르게 만드는 것이 목표입니다.
핵심 철학은 단순합니다.

- **플레이 가능한 루프를 먼저 만든다**
- **Scene / System / Entity / Renderer의 책임을 섞지 않는다**
- **데이터 중심으로 확장한다**
- **작게 시작하고 필요할 때 분리한다**

이 방향을 유지하면, 작은 MVP로 시작해도 이후 기능 추가와 리팩터링이 훨씬 덜 고통스러워집니다.
