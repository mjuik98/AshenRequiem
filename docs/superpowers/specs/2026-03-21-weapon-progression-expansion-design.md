# Weapon Progression Expansion Design

Date: 2026-03-21

## Goal

무기 성장 구조를 데이터 테이블형으로 재설계하고, 신규 무기 역할군을 추가해 전투 선택지를 넓힌다.

- 무기 업그레이드 카드는 무기당 1종만 유지
- `damage + multishot`처럼 같은 무기에서 서로 다른 카드가 따로 뜨는 구조 제거
- 각 무기는 레벨업 시 미리 정의된 2개 특성이 번갈아 상승
- 기본 무기와 진화 무기의 최종 레벨을 `7`로 상향
- 진화 조건도 기반 무기 `Lv.7`로 상향
- 역할 공백 메우기형 신규 무기 6종 추가

## Chosen Approach

추천안은 `데이터 테이블형 무기 성장표`이다.

- `upgradeData`에는 무기당 `weapon_upgrade` 카드 1종만 남긴다.
- 실제 성장 내용은 별도 progression 데이터에서 `다음 레벨` 기준으로 읽는다.
- 레벨업 카드의 설명은 현재 무기 레벨에 맞는 `이번 상승치`만 출력한다.
- `UpgradeSystem`은 일반 카드 id가 아니라 `weaponId + 현재 레벨`을 기준으로 다음 성장 항목을 적용한다.

이 방식은 현재처럼 `부메랑 +`, `부메랑 다중 투척`이 동시에 후보에 오르는 문제를 제거하면서도, 새로운 무기를 늘릴 때 UI 규칙과 코드 분기를 단순하게 유지한다.

## Progression Model

### Weapon Upgrade Card Rules

무기 레벨업 카드 규칙은 아래로 통일한다.

- 각 무기는 `weapon_upgrade` 카드 1종만 가진다.
- 현재 레벨이 `1`일 때 카드를 선택하면 무기는 `2`가 된다.
- 레벨 `2~7`에서 적용될 실제 상승치는 progression 데이터에 정의한다.
- 카드 텍스트는 항상 다음 레벨에서 오를 특성만 보여준다.

예시:

- `부메랑 +`
  - Lv.2: 데미지 +2
  - Lv.3: 동시 투척 +1
  - Lv.4: 데미지 +2
  - Lv.5: 관통 +1
  - Lv.6: 데미지 +3
  - Lv.7: 동시 투척 +1

### Level Cap

- 기본 무기: `maxLevel = 7`
- 진화 무기: `maxLevel = 7`
- `UpgradeSystem`은 `owned.level >= maxLevel`이면 더 이상 해당 무기 업그레이드 카드를 후보에 넣지 않는다.

### Evolution Requirement

- 진화 조건은 기반 무기 `Lv.7` 달성으로 변경한다.
- 진화 레시피의 장신구 요구사항은 그대로 유지한다.
- 툴팁/도감/일시정지 UI의 `Lv.MAX` 문구는 새 `maxLevel` 기준을 반영해야 한다.

## New Weapon Roles

### Goal

현재 무기 풀의 빈 역할은 `직선 지속 화력`, `설치형 지속 제어`, `반사형 다중 타격`이다. 신규 무기는 이 공백을 우선 채운다.

### Recommended New Weapons

#### Direct Line Damage

- `태양 광선`
  - 짧은 지속의 직선 관통 레이저
  - 성장 축: `데미지 ↔ 길이/폭`

- `관통 창`
  - 느리지만 강한 직선 관통 투사체
  - 성장 축: `데미지 ↔ 관통 수 ↔ 속도`

#### Ground Control

- `화염 지대`
  - 바닥에 화염 장판 생성, 지속 피해 중심
  - 성장 축: `DPS ↔ 반경 ↔ 지속시간`

- `독성 늪`
  - 감속 + 지속 피해 장판
  - 성장 축: `지속시간 ↔ 감속 강도 ↔ 반경`

#### Ricochet Damage

- `수정 파편`
  - 벽/적 충돌 후 튕기는 반사탄
  - 성장 축: `데미지 ↔ 반사 횟수 ↔ 파편 수`

- `성광 탄환`
  - 읽기 쉬운 안정형 반사탄
  - 성장 축: `데미지 ↔ 반사 횟수 ↔ 명중 안정성`

## Behavior Design

### New behaviorId

신규 behavior는 3개만 추가한다.

- `laserBeam`
  - `태양 광선` 전용
  - 발사 순간 직선 히트 영역을 만들고 짧은 레이저 이펙트를 남긴다.

- `groundZone`
  - `화염 지대`, `독성 늪` 공용
  - 지정 위치에 지속시간 있는 장판 오브젝트를 생성하고 주기적으로 적에게 효과를 적용한다.

- `ricochetProjectile`
  - `수정 파편`, `성광 탄환` 공용
  - 충돌 후 남은 반사 횟수 기준으로 진행 방향을 갱신한다.

### Reused behaviorId

- `관통 창`은 새 behavior를 만들지 않고 기존 `targetProjectile`을 재사용한다.
- 차이는 `weaponData`의 `pierce`, `projectileSpeed`, `radius`, `spread` 값으로 만든다.

## Data Model

### Weapon Data

`src/data/weaponData.js`는 아래 역할만 가진다.

- 무기 기본 스펙
- `behaviorId`
- `maxLevel`
- 신규 behavior가 읽을 정적 설정값

무기별 레벨업 progression은 여기서 분리한다.

### Weapon Progression Data

신규 파일 `src/data/weaponProgressionData.js`를 둔다.

권장 구조:

```js
export const weaponProgressionData = {
  boomerang: [
    { level: 2, damageDelta: 2 },
    { level: 3, projectileCountDelta: 1 },
    { level: 4, damageDelta: 2 },
    { level: 5, pierceDelta: 1 },
    { level: 6, damageDelta: 3 },
    { level: 7, projectileCountDelta: 1 },
  ],
};
```

규칙:

- 항목 하나가 다음 레벨 1회의 증가분을 의미
- 레벨은 `2~maxLevel`까지만 정의
- 설명 생성과 실제 적용은 같은 데이터에서 읽는다

### Upgrade Data

`upgradeData`는 아래처럼 단순화한다.

- `weapon_new`
- 무기당 1개의 `weapon_upgrade`
- 장신구 관련 항목
- fallback 카드

제거 대상:

- `up_magic_bolt_multishot`
- `up_boomerang_multishot`
- 같은 무기의 별도 특수 강화 카드 전반

## Runtime Rules

### Choice Generation

`UpgradeSystem._buildAvailablePool()`은 다음 규칙을 따른다.

- 무기를 보유 중이고 현재 레벨이 `maxLevel` 미만이면 해당 무기의 `weapon_upgrade` 카드 1종만 후보로 넣는다.
- progression 데이터의 다음 레벨 항목 유무가 없으면 후보에서 제외한다.
- 별도 multishot 카드 후보는 더 이상 만들지 않는다.

### Upgrade Apply

`UpgradeSystem.applyUpgrade()`의 `weapon_upgrade`는 아래 절차로 바뀐다.

1. 보유 무기 조회
2. 현재 레벨 확인
3. progression 데이터에서 `nextLevel = owned.level + 1` 항목 조회
4. 그 항목의 delta를 무기에 적용
5. 무기 레벨을 `nextLevel`로 갱신

### Upgrade Description

레벨업 카드 설명은 progression 데이터에서 빌드한다.

예시:

- `부메랑 동시 투척 +1`
- `마법탄 데미지 +1`
- `연쇄 번개 연쇄 수 +1`

이 설명은 현재 레벨에 따라 바뀌므로 고정 문자열로 두지 않는다.

## File Responsibilities

- `src/data/weaponData.js`
  - 기본 무기 스펙과 신규 무기 6종 정의
- `src/data/weaponProgressionData.js`
  - 무기별 `Lv.2~7` 성장표
- `src/data/upgradeData.js`
  - 무기당 단일 업그레이드 카드만 유지
- `src/systems/progression/UpgradeSystem.js`
  - 다음 레벨 성장표 조회, 설명 생성, 적용
- `src/systems/progression/WeaponEvolutionSystem.js`
  - `Lv.7` 진화 기준 반영
- `src/ui/pause/pauseTooltipContent.js`
  - 진화 조건 `Lv.MAX` 문구가 새 레벨 캡을 반영
- `src/data/weaponEvolutionData.js`
  - 레시피 구조는 유지, 설명/주석은 새 레벨 기준으로 정리
- `src/behaviors/weaponBehaviors/`
  - `laserBeam`, `groundZone`, `ricochetProjectile`
- `src/behaviors/weaponBehaviors/weaponBehaviorRegistry.js`
  - 신규 behavior 등록

## Testing

### Progression Tests

- 무기당 업그레이드 카드가 1종만 후보에 등장한다
- 기존 multishot 전용 카드가 후보에서 제거된다
- 같은 무기 카드 선택 시 다음 레벨 progression 항목이 정확히 적용된다
- 레벨업 설명이 현재 레벨 기준으로 바뀐다
- `Lv.7` 도달 후 더 이상 후보에 등장하지 않는다

### Evolution Tests

- 기반 무기 `Lv.6`에서는 진화하지 않는다
- 기반 무기 `Lv.7` + 요구 장신구 충족 시 진화한다

### New Weapon Tests

- `laserBeam`이 직선형 공격을 생성한다
- `groundZone`이 장판 오브젝트를 생성한다
- `ricochetProjectile`이 반사 카운트를 가진 투사체를 생성한다
- `관통 창`은 기존 `targetProjectile`로 동작하면서 관통형 스펙을 가진다

### Source/UI Tests

- Pause tooltip의 진화 조건 설명이 `Lv.MAX` 기준으로 유지된다
- 레벨업 카드 설명이 고정 문자열이 아니라 progression 기반임을 검증한다

## Risks

- progression 설명 생성과 실제 적용이 서로 다른 데이터를 읽으면 곧바로 불일치가 생긴다. 반드시 단일 데이터 소스여야 한다.
- `groundZone`과 `ricochetProjectile`은 Projectile/Collision/Damage 흐름과 맞물리므로 구현 시 기존 시스템 책임을 침범하지 않도록 주의해야 한다.
- `Lv.7`로 레벨 캡이 올라가면 진화 타이밍이 뒤로 밀리므로, 기존 웨이브 압력과 보상 빈도는 플레이 테스트가 필요하다.

## Recommended Next Step

이 사양 승인 후 구현은 아래 순서로 자른다.

1. progression 데이터 구조와 레벨 7 회귀 테스트 추가
2. `UpgradeSystem`의 후보 생성/적용/설명 로직 전환
3. `WeaponEvolutionSystem`의 `Lv.7` 기준 반영
4. 신규 behavior 3종과 무기 6종 추가
5. 전체 테스트와 브라우저 스모크로 밸런스/런타임 검증
