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
- 2026-03-21: `subscreenTheme`에 공통 `renderSubscreenHeader()` / `renderSubscreenFooter()` helper를 추가하고 `CodexView`/`SettingsView`/`MetaShopView`가 공통 서브스크린 셸 마크업을 직접 재사용하도록 정리. `sceneNavigation`에는 `change()` / `load()`를 추가해 `TitleScene`의 shop 포함 모든 서브화면 전환을 같은 가드 경계로 통일.
- 2026-03-21: Playwright로 `http://127.0.0.1:4177/`에서 `Meta Shop`/`Codex`/`Settings` 진입과 `Escape` 복귀를 smoke 확인. 모바일 뷰포트(390x844)에서 `Meta Shop`의 `.ms-root` 스크롤 높이 `2407px`, wheel 입력 후 `scrollTop`이 `0 -> 500`으로 변해 실제 스크롤 동작도 확인. 콘솔 에러/경고 없음.
- 2026-03-21: 신규 helper/source 회귀 테스트(`tests/SubscreenTheme.test.js`, `tests/SceneNavigation.test.js`, `tests/SceneInfrastructureSource.test.js`, `tests/TitleAndCodexSource.test.js`) 갱신 후 `node scripts/runTests.js`, `npm run build` 재검증 통과.
- 2026-03-21: Playwright로 실제 전투 중 레벨업 오버레이를 재현해 `남은 리롤 2`, `남은 봉인 1` 노출을 확인. 가운데 카드 리롤 후 `마법탄 + -> 골드 획득`으로 교체되고 `남은 리롤 2 -> 1` 감소 확인, 봉인 모드에서 `골드 획득` 카드 클릭 후 `남은 봉인 1 -> 0` 감소와 카드 교체도 확인.
- 2026-03-21: Playwright 실제 입력으로 레벨업 종료 후 전투 중 `Escape` 장입 상태(`keyboard.down`)를 유지해 ESC 일시정지 모달 표시를 확인. `.pv-overlay` DOM 상태가 `display:flex`, `aria-hidden=false`로 바뀌고 무기/장신구/스탯/사운드 탭, `전투 포기`, `재개` 버튼 렌더도 함께 확인. 짧은 `press Escape`만으로는 poll 기반 입력 프레임과 어긋나 검증이 흔들릴 수 있음.
- 2026-03-21: Playwright로 ESC 모달 추가 실검증 완료. 무기 카드 hover 시 `.pv-tooltip`이 `display:block`으로 열리고 상세 스탯/시너지/진화 조건 텍스트가 렌더됨. `사운드` 탭에서 `masterVolume 80 -> 72`, `soundEnabled ON -> OFF`를 변경했고 `ashenRequiem_session.options`에도 같은 값이 저장되는 것을 확인. 모바일 축소(390x600)에서는 `.pv-panel`의 `scrollHeight 739`, `clientHeight 558`, wheel 입력 후 `scrollTop 0 -> 181`로 실제 내부 스크롤 확인. `전투 포기` 클릭 후 결과 화면 `☠ GAME OVER`와 `⌂ 메인 화면으로`/`다시 시작` 버튼 노출도 확인.
- 2026-03-21: 장신구 툴팁은 별도 런에서 리롤 10회를 주고 장신구 선택지를 재현하려 했지만 이번 시도한 첫 레벨업 풀에서는 장신구 카드가 뜨지 않아 브라우저 hover 검증까지는 미도달.
- 2026-03-21: 구조 정리 추가 반영. `PauseView`는 `src/ui/pause/pauseViewSections.js`, `src/ui/pause/pauseTooltipContent.js`로 렌더/tooltip 빌더를 분리했고, `ResultView`/`PauseView` 액션 버튼은 `src/ui/shared/actionButtonTheme.js` 공통 토큰을 사용하도록 변경. `PlayScene`의 레벨업 선택/리롤/봉인 로직은 `src/scenes/play/levelUpController.js`로 이동.
- 2026-03-21: `src/core/runtimeHooks.js`를 추가하고 `Game`에서 `window.advanceTime(ms)` / `window.render_game_to_text()`를 등록하도록 변경. Playwright로 `http://127.0.0.1:4177/`에서 훅 존재를 확인했고, 실제 플레이 진입 후 `elapsedTime`이 `1.8474 -> 2.8474`로 증가해 `advanceTime(1000)` 반영도 확인.
- 2026-03-21: 새 source 테스트 `tests/UiStructureSource.test.js` 추가, `tests/LevelUpSource.test.js`를 controller 위임 구조에 맞게 갱신. `node scripts/runTests.js` 39개 PASS, `npm run build` 통과.
- TODO: 브라우저에서 실제 장신구 획득 런을 만든 뒤 `PauseView` 장신구 카드 hover tooltip까지 최종 확인하고 필요 시 후속 보정.

- 2026-03-21: 타이틀 종료 버튼 활성화 작업 시작. 종료 버튼 source 회귀 테스트를 먼저 추가해 red 확인 예정.
- 2026-03-21: TitleScene Quit 버튼을 활성화. window.close() 시도 후 차단 시 라이브 메시지 폴백을 추가하고 비활성 스타일/문구를 제거.
- 2026-03-21: 종료 버튼 변경 후 source 회귀 테스트와 전체 테스트(39/39), 빌드 통과 확인. 정적 서버 기반 Playwright smoke는 현재 소스와 다른 타이틀 UI가 렌더되어 Quit 클릭 검증 근거로 사용하지 않음.
- 2026-03-21: 레벨업 리롤 버튼을 카드 내부에서 카드 하단 외부로 옮기는 작업 시작. source 테스트를 먼저 갱신해 red 확인 예정.
- 2026-03-21: LevelUpView를 카드 래퍼 + 하단 풋터 액션 구조로 변경. 리롤 버튼을 카드 외부 아래로 이동.
- 2026-03-21: PauseView 시너지 보너스 포맷터 누락 버그 수정 시작. source 회귀 테스트를 먼저 추가해 red 확인 예정.
- 2026-03-21: pauseTooltipContent의 formatWeaponSynergyBonus를 export하고 PauseView가 재사용하도록 수정. 정의되지 않은 _formatSynergyBonus 호출 제거.
- 2026-03-21: 무기 progression/Lv.7 테스트를 새 구조 기준으로 갱신. 개별 테스트 RED 확인 중.
- 2026-03-21: 신규 weapon behavior/무기 테스트 추가. 레지스트리, spawn config, projectile runtime 동작 RED 확인 예정.
