# Level-Up Reroll And Banish Design

Date: 2026-03-21

## Goal

레벨업 / 상자 보상 선택 UI에 뱀파이어 서바이버, TFT 계열의 의사결정 수단을 추가한다.

- 기본 제공 없음
- 메타 상점으로 `리롤`, `봉인` 사용 횟수를 확장
- `리롤`은 카드별 1장 교체
- `봉인`은 2단계 방식이며 `upgrade id` 단위로 이번 런 전체에서 제외
- 후보 풀이 고갈되면 `회복`, `골드` fallback 사용
- 현재 보이는 3장 안에서는 일반 카드와 fallback 카드 모두 중복되지 않음

## Chosen Approach

추천안은 `카드 액션형`이다.

- 각 카드 하단에 `리롤`
- 상단 액션 바에 `봉인 모드`
- 봉인 모드 활성화 후 카드 클릭 시 해당 `upgrade id`를 런 전체에서 제외
- 리롤/봉인 모두 현재 선택지 배열만 국소 갱신

이 방식은 기존 `pendingLevelUpChoices` 구조를 유지하면서도 UI 이해도가 높다. 전체 3장을 갈아엎는 방식보다 선택 맥락이 유지되고, 모바일에서도 실수 클릭 위험이 낮다.

## State Model

### Session Meta-Progression

`session.meta.permanentUpgrades`에 아래 항목을 추가한다.

- `reroll_charge`
- `banish_charge`

두 업그레이드의 기본값은 `0`이다.

### World Runtime State

`world`에 아래 런 전용 상태를 추가한다.

- `runRerollsRemaining: number`
- `runBanishesRemaining: number`
- `banishedUpgradeIds: string[]`
- `levelUpActionMode: 'select' | 'banish'`

초기값은 런 시작 시 세션의 영구 업그레이드 레벨에서 계산한다.

## Data Changes

### Permanent Upgrade Data

메타 상점 업그레이드를 추가한다.

- `reroll_charge`
  - 이름 예시: `전술 재편`
  - 설명: `레벨업 보상에서 카드 1장을 다시 뽑을 수 있는 횟수 +1`
- `banish_charge`
  - 이름 예시: `추방의 인장`
  - 설명: `레벨업 보상에서 카드 1종을 이번 런 전체에서 봉인할 수 있는 횟수 +1`

### Upgrade Data

fallback 카드 1종을 추가한다.

- `stat_gold`
  - 타입: `stat`
  - 효과: 고정 골드 획득
  - 설명은 구체 수치 표기

`stat_heal`과 함께 fallback 풀에 포함된다.

## Upgrade Selection Rules

### Base Pool

`UpgradeSystem`은 기존 후보 풀 생성 규칙에 아래 조건을 추가한다.

- `banishedUpgradeIds`에 포함된 `upgrade.id`는 후보에서 제외
- 현재 화면에 이미 노출 중인 카드 id는 새 카드 생성 시 제외

### Card Reroll

카드별 리롤은 아래 절차로 동작한다.

1. 리롤 대상 카드의 슬롯 인덱스를 받는다.
2. 나머지 두 카드의 `id`를 제외 목록으로 구성한다.
3. 일반 후보 풀에서 새 카드 1장을 뽑는다.
4. 일반 후보가 없으면 fallback 풀 `stat_heal`, `stat_gold`에서 중복 없이 1장을 뽑는다.
5. 성공 시 해당 슬롯만 교체하고 `runRerollsRemaining`을 1 차감한다.

### Banish

봉인은 아래 절차로 동작한다.

1. `봉인 모드` 버튼으로 `levelUpActionMode = 'banish'` 전환
2. 카드 클릭 시 해당 `upgrade.id`를 `banishedUpgradeIds`에 추가
3. 즉시 그 카드 슬롯을 새 카드로 교체
4. 교체 규칙은 카드별 리롤과 동일
5. 성공 시 `runBanishesRemaining`을 1 차감하고 `levelUpActionMode = 'select'`로 복귀

`upgrade id` 단위 봉인이므로 동일 무기의 다른 강화 카드나 다른 장신구 카드는 그대로 남는다.

### Fallback Rules

fallback 풀은 아래 두 카드로 구성한다.

- `stat_heal`
- `stat_gold`

규칙:

- 현재 3장 안에서 중복 불가
- 일반 후보가 남아 있으면 fallback보다 일반 후보를 우선
- 일반 후보가 부족할 때만 fallback으로 남은 슬롯을 채움
- `stat_heal`, `stat_gold`만 남은 경우에도 서로 중복 없이 채우고, 둘 다 소진되면 마지막 수단으로 기존 `stat_heal` 반복 허용 여부를 구현 단계에서 명시 테스트로 결정

권장 기본값은 다음과 같다.

- `stat_gold` 고정 수치: `+25`

## UI Design

### Level-Up Header

상단에 현재 행동 상태와 남은 횟수를 함께 표시한다.

- `리롤 2`
- `봉인 1`

`봉인 모드` 활성화 시 시각적으로 강한 상태 전환을 준다.

- 버튼 활성 상태 강조
- 안내 문구: `봉인할 카드를 선택하세요`

### Card Actions

각 카드 하단:

- `선택`
- `리롤`

상단 액션 바:

- `봉인 모드`
- 필요 시 `취소`

`리롤` 버튼은 해당 카드만 교체한다.

`봉인 모드`에서는 카드 본문 클릭이 선택이 아니라 봉인 대상으로 해석된다.

## File Responsibilities

- `src/data/permanentUpgradeData.js`
  - 메타 상점용 `reroll_charge`, `banish_charge`
- `src/data/upgradeData.js`
  - `stat_gold` fallback 카드
- `src/state/createWorld.js`
  - 런 전용 리롤/봉인 상태
- `src/scenes/PlayScene.js`
  - 레벨업 UI에 런 상태와 액션 콜백 전달
- `src/scenes/play/PlayUI.js`
  - LevelUpView 인터페이스 확장 연결
- `src/ui/levelup/LevelUpView.js`
  - 카드별 리롤 버튼, 봉인 모드 UI, 액션 이벤트
- `src/systems/progression/UpgradeSystem.js`
  - 봉인 제외, 카드별 리롤 슬롯 교체, fallback 중복 방지

## Testing

### UpgradeSystem

- 봉인된 `upgrade id`는 후보 풀에서 제외
- 카드별 리롤 시 다른 두 카드와 중복되지 않음
- 리롤 결과는 봉인된 카드가 나오지 않음
- fallback `회복`, `골드`는 현재 선택지와 중복되지 않음
- 후보 고갈 시 `회복`, `골드`가 채워짐

### UI Source / View

- 카드 하단 `리롤` 버튼 존재
- 상단 `봉인 모드` 버튼 존재
- 봉인 모드 안내 문구 존재
- 남은 횟수 표기 존재

### Meta Progression

- 새 세션에서 리롤/봉인 영구 업그레이드 기본값은 0
- 영구 업그레이드 레벨이 런 시작 잔여 횟수로 반영됨

## Risks

- 카드별 리롤은 전체 선택지 배열을 국소 교체해야 하므로 현재 `LevelUpView`가 단순 일회성 렌더만 하는 구조보다 상태 보유가 늘어난다.
- fallback 중복 금지 규칙이 강할수록 후보 고갈 상황에서 예외 처리가 필요하다.
- `봉인 모드`는 선택 클릭과 충돌할 수 있으므로 UI 상태 표시가 약하면 오작동처럼 느껴질 수 있다.

## Recommended Next Step

이 사양 승인 후 구현 계획은 아래 순서로 자른다.

1. 메타 상점 업그레이드와 월드 상태 추가
2. `UpgradeSystem`의 봉인/카드별 리롤/fallback 규칙 추가
3. `LevelUpView` 액션 UI 추가
4. `PlayScene` 연결
5. 회귀 테스트 및 빌드 검증
