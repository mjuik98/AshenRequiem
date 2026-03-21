Original prompt: 1. 장신구 레벨업 시 선형적으로 밸런스 변경 (30% -> 36% 이런 느낌보다는10% -> 20% 으로 변경 요청)
2. 적이 죽었을 때 효과음 조정 (적의 수가 많아지니까 빈도 수가 너무 과함)
3. ESC 모달에서 사운드 조절할 수 있게 변경
4. ESC 모달에서 무기/장신구의 툴팁이 표시되지 않는 버그 수정 요청
5. ESC 모달에서 스크롤이 작동하지 않는 버그 수정 요청
6. ESC 모달에서 스탯에 골드 관련도 추가
7. 투사체 지속시간 관련된 장신구 및 상점에 추가
8. 레벨업 시 보상 선택에서 텍스트 "효과 강화" -> "~~ 증가 10%"이런 식으로 상세하게 변경 요청
9. ESC 모달에서 전투 포기 버튼 추가 및 갱신 코드 추가
10. 보스 5분마다 등장하게 변경 요청 (6번째 보스 격파 시 게임 승리)

- 2026-03-21: 장신구 선형 밸런싱, 투사체 지속시간 장신구/영구 업그레이드, 상세 업그레이드 설명, ESC 오디오 패널/전투 포기/골드 스탯, 적 사망 SFX throttle, 5분 주기 보스 및 6보스 승리 흐름 구현.
- 2026-03-21: `tests/DeathSystem.test.js`를 실제 `bossData` 기반으로 정리해 보스 개수 하드코딩 의존을 제거.
- 2026-03-21: `node scripts/validateData.js`, `node scripts/runTests.js`, `npm run build` 재검증 통과.
- 2026-03-21: 로컬 dev/serve 서버는 세션 내부에서는 기동되지만 현재 실행 환경의 포트 격리 때문에 별도 프로세스/브라우저에서 접속 검증을 재현하지 못함.
- 2026-03-21: ESC 모달 폭 확대, 카드 본문 1줄 요약화, 메인메뉴 버튼 제거, 스탯에 투사체 크기/범위·지속시간 추가, 백틱 디버그 패널 제거.
- 2026-03-21: `tests/PauseAndInputSource.test.js` 추가 후 red-green으로 회귀 검증. 전체 테스트 23개 및 빌드 재통과.
- 2026-03-21: `CodexView` 스크롤 불가 원인을 `#ui-container`의 `pointer-events:none` 상속으로 확인. `.cx-root`에 `pointer-events:auto`를 추가하고 `tests/TitleAndCodexSource.test.js`에 회귀 테스트를 추가. 전체 테스트와 빌드 재통과.
- 2026-03-21: `CodexView` 무기 도감의 진화 무기 잠금 판정이 `weaponsUsedAll`만 보던 문제를 수정. `evolvedWeapons`도 별도로 읽어 진화 무기 카드를 해금 상태로 렌더링하고 발견 수 카운트에도 반영. 전체 테스트와 빌드 재통과.
- 2026-03-21: 레벨업 리롤/봉인 1차 구현 완료. `reroll_charge`/`banish_charge` 메타 업그레이드, `runRerollsRemaining`/`runBanishesRemaining`/`banishedUpgradeIds` 월드 상태, `stat_gold` fallback, `UpgradeApplySystem`의 `currencyEarned` 이벤트 발행, `LevelSystem`의 봉인 후보 제외를 추가.
- 2026-03-21: `LevelUpView`를 설정 객체 기반으로 확장해 `남은 리롤`, `남은 봉인`, `봉인 모드`, 카드별 `리롤` 버튼을 렌더링하도록 변경. `PlayScene`에 카드 선택/카드별 리롤/봉인 모드 토글/카드 봉인 핸들러를 추가하고 `UpgradeSystem.replaceChoiceAtIndex()`는 현재 슬롯 id까지 제외하도록 수정.
- 2026-03-21: 신규 테스트 `tests/UpgradeApplySystem.test.js`, `tests/LevelUpSource.test.js`, `tests/WorldState.test.js` 추가. `node scripts/validateData.js`, `node scripts/runTests.js`, `npm run build` 모두 통과.
- 2026-03-21: Playwright로 `http://127.0.0.1:4176/`에서 타이틀 → 시작 무기 선택 → 게임 진입까지 smoke 검증. `.playwright-cli/page-2026-03-21T09-50-39-414Z.png` 기준 HUD/전장 렌더 정상. 다만 레벨업 오버레이는 결정적으로 재현할 수 있는 디버그 훅이 없어 브라우저에서 실동작까지는 아직 미확인.
- 2026-03-21: Playwright smoke 중 타이틀 하단에 `디버그: \`` 안내가 남아 있는 것을 발견해 `TitleScene`에서도 디버그 힌트를 제거. 전체 테스트/빌드 재통과.
- 2026-03-21: 남은 UI/콘텐츠 확장 반영. `PauseView` 무기 카드는 이름/아이콘/태그/레벨만 남기도록 간소화했고, 장신구 카드는 `현재 레벨` 설명만 노출하도록 변경. `ResultView`의 강화 상점 버튼은 제거하고 `메인 화면으로` 버튼으로 교체해 `TitleScene` 복귀로 연결.
- 2026-03-21: `enemyData`에 보스 6종(`boss_lich`, `boss_warden`, `boss_broodmother`, `boss_titan`, `boss_seraph`, `boss_abyss_eye`) 추가, `bossData`를 5분 간격 6종 순차 등장 구조로 교체. `waveData`는 12개 구간으로 세분화해 후반 `spawnPerSecond`와 `eliteChance`를 크게 증가시킴.
- 2026-03-21: `unlockData`를 8개 보상으로 확장. `chain_lightning`, `coin_pendant`, `wind_crystal`, `greed_amulet` 해금 조건 추가. `PlayResultHandler`/`UnlockEvaluator` 회귀 테스트도 함께 갱신.
- 2026-03-21: 신규 테스트 `tests/ResultAndProgressionSource.test.js` 추가. `node scripts/validateData.js`, `node scripts/runTests.js`, `npm run build` 모두 통과.
- TODO: 브라우저에서 ESC 모달의 사운드 탭, 툴팁, 스크롤, 전투 포기 흐름을 실제 입력으로 확인하고 필요 시 후속 보정.
- TODO: 브라우저에서 실제 레벨업 상황을 만들어 카드별 리롤/봉인 모드 UX와 잔여 횟수 소모가 기대대로 보이는지 수동 또는 자동 확인.
