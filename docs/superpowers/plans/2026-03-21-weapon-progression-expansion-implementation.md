# Weapon Progression Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 무기 업그레이드를 데이터 테이블형 레벨 7 구조로 재설계하고, 역할 공백 메우기형 신규 무기 6종과 신규 behavior 3종을 추가한다.

**Architecture:** `upgradeData`는 무기당 단일 업그레이드 카드만 남기고, 실제 상승치와 설명은 `weaponProgressionData`가 단일 소스로 제공한다. `UpgradeSystem`은 다음 레벨 progression 항목만 적용하며, 진화 기준은 `Lv.7`로 상향한다. 신규 무기는 `laserBeam`, `groundZone`, `ricochetProjectile` behavior를 추가하고 `targetProjectile` 재사용 무기 1종을 함께 도입한다.

**Tech Stack:** Vanilla JS, 기존 data-driven combat systems, custom Node source/runtime tests, Vite build, Playwright CLI smoke

---

## Chunk 1: Progression Data And Level-7 Rules

### Task 1: failing test로 레벨 7 progression 구조 고정

**Files:**
- Modify: `tests/UpgradeSystem.test.js`
- Modify: `tests/WeaponEvolution.test.js`
- Modify: `tests/SlotSystem.test.js`

- [ ] `UpgradeSystem.test.js`에 같은 무기에서 multishot 전용 카드가 별도 후보로 등장하지 않아야 한다는 실패 테스트를 추가한다.
- [ ] `UpgradeSystem.test.js`에 무기 업그레이드 1회 선택 시 현재 레벨 기준 다음 progression 항목만 적용된다는 실패 테스트를 추가한다.
- [ ] `WeaponEvolution.test.js`에 기반 무기 `Lv.6`에서는 진화하지 않고 `Lv.7`에서만 진화한다는 실패 테스트를 추가한다.
- [ ] `SlotSystem.test.js`의 기존 multishot 전용 카드 테스트를 progression 기반 기대값으로 바꾸고 RED를 확인한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/UpgradeSystem.test.js`
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/WeaponEvolution.test.js`

### Task 2: progression data 파일 추가

**Files:**
- Create: `src/data/weaponProgressionData.js`
- Modify: `src/data/weaponData.js`

- [ ] `src/data/weaponProgressionData.js`에 기존 기본/진화 무기의 `Lv.2~7` 성장표를 정의한다.
- [ ] 각 무기의 성장표는 번갈아 오르는 2개 특성을 중심으로 구성하고, 필요 시 1개 보조 특성을 섞는다.
- [ ] `src/data/weaponData.js`의 모든 기본/진화 무기 `maxLevel`을 `7`로 올린다.
- [ ] 데이터가 설명 생성과 적용의 단일 소스가 되도록 export helper(`getWeaponProgressionForLevel` 등)를 추가한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/UpgradeSystem.test.js`

### Task 3: UpgradeSystem을 progression 기반으로 전환

**Files:**
- Modify: `src/data/upgradeData.js`
- Modify: `src/systems/progression/UpgradeSystem.js`

- [ ] `src/data/upgradeData.js`에서 무기별 중복 강화 카드(`*_multishot`류)를 제거하고 무기당 단일 `weapon_upgrade` 카드만 남긴다.
- [ ] `UpgradeSystem._buildAvailablePool()`이 무기당 단일 카드만 후보로 넣도록 수정한다.
- [ ] `UpgradeSystem.applyUpgrade()`가 현재 레벨 기준 다음 progression 항목만 적용하도록 바꾼다.
- [ ] 카드 description은 progression 데이터에서 동적으로 계산되도록 `UpgradeSystem` 또는 data helper를 정리한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/UpgradeSystem.test.js`
- [ ] Expected: PASS

### Task 4: 진화 기준을 Lv.7로 상향

**Files:**
- Modify: `src/systems/progression/WeaponEvolutionSystem.js`
- Modify: `src/ui/pause/pauseTooltipContent.js`
- Modify: `src/data/weaponEvolutionData.js`

- [ ] `WeaponEvolutionSystem`이 weapon definition의 `maxLevel`을 그대로 읽어 `Lv.7` 기준으로 진화 판정을 하도록 유지/정리한다.
- [ ] 툴팁의 `Lv.MAX` 관련 문구와 주석을 새 레벨 캡 기준으로 점검한다.
- [ ] 테스트가 `Lv.7` 기준으로 GREEN이 되도록 맞춘다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/WeaponEvolution.test.js`

## Chunk 2: New Behaviors And New Weapons

### Task 5: 신규 behavior failing test 추가

**Files:**
- Create: `tests/WeaponBehaviorExpansion.test.js`

- [ ] `laserBeam`이 직선형 공격 생성 데이터를 만든다는 실패 테스트를 작성한다.
- [ ] `groundZone`이 장판 오브젝트 spawn request를 만든다는 실패 테스트를 작성한다.
- [ ] `ricochetProjectile`이 반사 횟수 정보를 가진 투사체를 spawn한다는 실패 테스트를 작성한다.
- [ ] `관통 창`이 새 behavior 없이 `targetProjectile` 기반으로 동작한다는 최소 회귀 테스트를 작성한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/WeaponBehaviorExpansion.test.js`

### Task 6: 신규 behavior 구현

**Files:**
- Create: `src/behaviors/weaponBehaviors/laserBeam.js`
- Create: `src/behaviors/weaponBehaviors/groundZone.js`
- Create: `src/behaviors/weaponBehaviors/ricochetProjectile.js`
- Modify: `src/behaviors/weaponBehaviors/weaponBehaviorRegistry.js`
- Modify: `src/state/spawnRequest.js`

- [ ] `laserBeam`을 구현한다. Scene/system 책임을 넘지 않고 spawn request만 생성해야 한다.
- [ ] `groundZone`를 구현한다. 장판형 effect/projectile spawn 규칙을 data-driven 옵션으로 받게 만든다.
- [ ] `ricochetProjectile`을 구현한다. 반사 횟수, 탐색 여부 등은 무기 데이터로 넘긴다.
- [ ] `weaponBehaviorRegistry`에 2줄 패턴으로 behavior 등록을 추가한다.
- [ ] 필요 시 `spawnRequest` factory가 신규 config 필드를 그대로 전달하는지 검증한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/WeaponBehaviorExpansion.test.js`

### Task 7: 신규 무기 6종 데이터 추가

**Files:**
- Modify: `src/data/weaponData.js`
- Modify: `src/data/upgradeData.js`
- Modify: `src/data/unlockData.js`
- Modify: `src/ui/title/StartLoadoutView.js`

- [ ] `태양 광선`, `관통 창`, `화염 지대`, `독성 늪`, `수정 파편`, `성광 탄환`을 weapon data에 추가한다.
- [ ] 각 무기의 `weapon_new` 카드와 progression 항목을 연결한다.
- [ ] 필요한 경우 해금 데이터와 타이틀/도감 노출 텍스트를 맞춘다.
- [ ] `관통 창`은 `targetProjectile`, 나머지는 설계한 behavior를 사용하게 연결한다.
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/UpgradeSystem.test.js`
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' tests/WeaponBehaviorExpansion.test.js`

## Chunk 3: Integration And Verification

### Task 8: 관련 UI/source 기대값 정리

**Files:**
- Modify: `tests/ResultAndProgressionSource.test.js`
- Modify: `tests/TitleAndCodexSource.test.js`
- Modify: `tests/LevelUpSource.test.js`

- [ ] 무기 업그레이드 설명이 progression 기반으로 바뀐 구조와 레벨 7 진화를 반영하는 source 테스트가 필요하면 추가한다.
- [ ] 신규 무기 노출과 도감/타이틀 텍스트가 바뀌는 부분이 있으면 최소 회귀 테스트를 보강한다.
- [ ] 관련 source 테스트를 실행해 GREEN을 확인한다.

### Task 9: 전체 검증

**Files:**
- Modify: `progress.md`

- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' scripts/runTests.js`
- [ ] Expected: 39개 이상 PASS, 0 FAIL
- [ ] Run: `'/mnt/c/Program Files/nodejs/node.exe' node_modules/vite/bin/vite.js build`
- [ ] Expected: build success
- [ ] 가능하면 Playwright로 레벨업 선택지에서 무기당 단일 업그레이드 카드만 뜨는지 smoke 검증한다.
- [ ] `progress.md`에 레벨 7, progression data, 신규 behavior 3종, 신규 무기 6종 반영 내용을 기록한다.

### Task 10: 구현 단위 커밋 정리

**Files:**
- Modify: 구현된 파일 일체

- [ ] Chunk 1 완료 후 관련 파일만 add하여 커밋한다.
- [ ] Chunk 2 완료 후 신규 behavior/무기 추가분만 add하여 커밋한다.
- [ ] Chunk 3 완료 후 검증/문서 변경을 add하여 커밋한다.
- [ ] Commit message 예시:
  - `feat: add level-7 weapon progression tables`
  - `feat: add laser zone and ricochet weapons`
  - `test: cover progression-driven weapon upgrades`
