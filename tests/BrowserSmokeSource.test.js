import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import {
  projectPathExists,
  readOptionalProjectSource,
} from './helpers/sourceInspection.js';

const runnerPath = '../scripts/browser-smoke/runDeterministicSmoke.mjs';
const scenariosPath = '../scripts/browser-smoke/scenarios.js';
const scenarioRunnersPath = '../scripts/browser-smoke/smokeScenarioRunners.mjs';
const titleScenariosPath = '../scripts/browser-smoke/smokeTitleScenarios.mjs';
const playScenariosPath = '../scripts/browser-smoke/smokePlayScenarios.mjs';
const cliPathsPath = '../scripts/browser-smoke/smokeCliPaths.mjs';
const cliRunnerPath = '../scripts/browser-smoke/smokeCliRunner.mjs';
const cliParsersPath = '../scripts/browser-smoke/smokeCliParsers.mjs';
const sessionTransportPath = '../scripts/browser-smoke/smokeSessionTransport.mjs';

const runnerExists = projectPathExists(runnerPath);
const scenariosExists = projectPathExists(scenariosPath);
const scenarioRunnersExists = projectPathExists(scenarioRunnersPath);
const titleScenariosExists = projectPathExists(titleScenariosPath);
const playScenariosExists = projectPathExists(playScenariosPath);
const cliPathsExists = projectPathExists(cliPathsPath);
const cliRunnerExists = projectPathExists(cliRunnerPath);
const cliParsersExists = projectPathExists(cliParsersPath);
const sessionTransportExists = projectPathExists(sessionTransportPath);
const runnerSource = readOptionalProjectSource(runnerPath);
const scenariosSource = readOptionalProjectSource(scenariosPath);
const scenarioRunnersSource = readOptionalProjectSource(scenarioRunnersPath);
const titleScenariosSource = readOptionalProjectSource(titleScenariosPath);
const playScenariosSource = readOptionalProjectSource(playScenariosPath);
const cliTransportSource = readOptionalProjectSource('../scripts/browser-smoke/smokeCliTransport.mjs');
const smokeSource = `${runnerSource}\n${scenarioRunnersSource}\n${titleScenariosSource}\n${playScenariosSource}`;

console.log('\n[BrowserSmokeSource]');

test('deterministic browser smoke runner 파일이 존재한다', () => {
  assert.equal(runnerExists, true, 'runDeterministicSmoke.mjs 파일이 아직 없음');
  assert.equal(scenariosExists, true, 'scenarios.js 파일이 아직 없음');
  assert.equal(scenarioRunnersExists, true, 'smokeScenarioRunners.mjs 파일이 아직 없음');
  assert.equal(titleScenariosExists, true, 'smokeTitleScenarios.mjs 파일이 아직 없음');
  assert.equal(playScenariosExists, true, 'smokePlayScenarios.mjs 파일이 아직 없음');
  assert.equal(cliPathsExists, true, 'smokeCliPaths.mjs 파일이 아직 없음');
  assert.equal(cliRunnerExists, true, 'smokeCliRunner.mjs 파일이 아직 없음');
  assert.equal(cliParsersExists, true, 'smokeCliParsers.mjs 파일이 아직 없음');
  assert.equal(sessionTransportExists, true, 'smokeSessionTransport.mjs 파일이 아직 없음');
});

test('runner는 안정된 debug host만 사용하고 scene 내부 슬롯에 직접 접근하지 않는다', () => {
  assert.equal(
    smokeSource.includes('__ASHEN_DEBUG__'),
    true,
    'runner가 안정된 debug host를 사용하지 않음',
  );
  assert.equal(
    smokeSource.includes('sceneManager.currentScene._ui'),
    false,
    'runner가 scene 내부 슬롯에 직접 접근하면 안 됨',
  );
});

test('scenario 정의는 title/play/pause/result 흐름 이름을 가진다', () => {
  assert.equal(scenariosSource.includes('title_to_play'), true, 'title_to_play 시나리오가 없음');
  assert.equal(scenariosSource.includes('title_loadout_accessibility'), true, 'title_loadout_accessibility 시나리오가 없음');
  assert.equal(scenariosSource.includes('title_meta_shop'), true, 'title_meta_shop 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_overlay'), true, 'pause_overlay 시나리오가 없음');
  assert.equal(scenariosSource.includes('levelup_overlay'), true, 'levelup_overlay 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_layout'), true, 'pause_layout 시나리오가 없음');
  assert.equal(scenariosSource.includes('result_screen'), true, 'result_screen 시나리오가 없음');
  assert.equal(scenariosSource.includes('title_settings_persist'), true, 'title_settings_persist 시나리오가 없음');
  assert.equal(scenariosSource.includes('combat_pressure'), true, 'combat_pressure 시나리오가 없음');
  assert.equal(scenariosSource.includes('boss_readability'), true, 'boss_readability 시나리오가 없음');
  assert.equal(scenariosSource.includes("'accessory'"), true, 'title_codex 시나리오가 accessory step을 포함하지 않음');
});

test('combat pressure smoke는 HUD guidance surface를 검증한다', () => {
  assert.equal(
    smokeSource.includes('hud-threat-chip'),
    true,
    'combat pressure smoke가 threat chip을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('hud-objective-chip'),
    true,
    'combat pressure smoke가 objective chip을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('hud-boss-chip'),
    true,
    'combat pressure smoke가 boss chip을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('hud-stage-chip'),
    true,
    'combat pressure smoke가 stage chip을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('hud-guidance-note'),
    true,
    'combat pressure smoke가 contextual guidance note를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('boss-hud'),
    true,
    'boss readability smoke가 boss HUD surface를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('openBossReadabilityOverlay'),
    true,
    'boss readability smoke가 debug host boss helper를 사용하지 않음',
  );
});

test('browser smoke 산출물은 output/web-game 또는 output/playwright 아래로 제한된다', () => {
  assert.equal(
    smokeSource.includes('output/web-game/') || smokeSource.includes('output/playwright/'),
    true,
    'runner 산출물 경로가 output 하위로 고정되지 않음',
  );
});

test('정적 루트 서빙 호환을 위해 favicon.svg를 프로젝트 루트에도 둔다', () => {
  assert.equal(
    projectPathExists('../favicon.svg'),
    true,
    'repo root에 favicon.svg가 없어 http://localhost:8000/favicon.svg가 404가 됨',
  );
});

test('runner는 ashen-smoke 세션을 정리해 Playwright daemon 누수를 남기지 않는다', () => {
  assert.equal(
    runnerSource.includes('cleanupSmokeSessionProcesses'),
    true,
    'runner가 stale smoke session 정리 helper를 포함하지 않음',
  );
  assert.equal(
    runnerSource.includes('SMOKE_SESSION_PREFIX'),
    true,
    'runner가 smoke session prefix를 기준으로 cleanup하지 않음',
  );
  assert.equal(
    runnerSource.includes("from './smokeCliTransport.mjs'"),
    true,
    'runner가 Playwright transport helper를 별도 모듈로 분리하지 않음',
  );
  assert.equal(
    runnerSource.includes("from './smokeScenarioRunners.mjs'"),
    true,
    'runner가 scenario runner 모듈을 별도 파일로 분리하지 않음',
  );
  assert.equal(
    scenarioRunnersSource.includes("from './smokeTitleScenarios.mjs'"),
    true,
    'scenario runner registry가 title smoke 모듈을 별도 파일로 분리하지 않음',
  );
  assert.equal(
    scenarioRunnersSource.includes("from './smokePlayScenarios.mjs'"),
    true,
    'scenario runner registry가 play smoke 모듈을 별도 파일로 분리하지 않음',
  );
  assert.equal(
    cliTransportSource.includes("from './smokeCliPaths.mjs'"),
    true,
    'smoke transport가 cli path resolver를 별도 파일로 분리하지 않음',
  );
  assert.equal(
    cliTransportSource.includes("from './smokeCliRunner.mjs'"),
    true,
    'smoke transport가 cli runner를 별도 파일로 분리하지 않음',
  );
  assert.equal(
    cliTransportSource.includes("from './smokeCliParsers.mjs'"),
    true,
    'smoke transport가 cli parser를 별도 파일로 분리하지 않음',
  );
  assert.equal(
    cliTransportSource.includes("from './smokeSessionTransport.mjs'"),
    true,
    'smoke transport가 session facade를 별도 파일로 분리하지 않음',
  );
});

test('title codex smoke는 장신구 탭 점프와 상세 힌트를 검증한다', () => {
  assert.equal(
    smokeSource.includes('cx-tab-progress'),
    true,
    'title codex smoke가 통합 탭 진행도 훅을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('cx-discovery-strip'),
    false,
    'title codex smoke가 제거된 상단 진행 strip 계약에 의존하면 안 됨',
  );
  assert.equal(
    smokeSource.includes('cx-tab-accessory'),
    true,
    'title codex smoke가 장신구 탭 활성 상태를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('cx-discovery-hint'),
    true,
    'title codex smoke가 미발견 장신구 상세 힌트를 확인하지 않음',
  );
});

test('title meta shop/settings smoke는 저장 결과를 localStorage와 화면 상태로 검증한다', () => {
  assert.equal(
    smokeSource.includes('ashenRequiem_session'),
    true,
    'meta shop/settings smoke가 세션 저장 결과를 localStorage로 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('.ms-root'),
    true,
    'title meta shop smoke가 메타 상점 루트를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('.sv-root'),
    true,
    'title settings smoke가 설정 화면 루트를 확인하지 않음',
  );
});

test('result screen smoke는 현재 결과 UI 계약을 검증한다', () => {
  assert.equal(
    smokeSource.includes('.result-title'),
    true,
    'result screen smoke가 결과 타이틀 DOM을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('DEFEAT'),
    true,
    'result screen smoke가 현재 패배 결과 타이틀을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('.result-title-btn'),
    true,
    'result screen smoke가 메인 화면 버튼을 확인하지 않음',
  );
});

test('level up smoke는 레벨 진행, 요약 텍스트, 승격된 관계 힌트를 검증한다', () => {
  assert.equal(
    smokeSource.includes('openLevelUpOverlay'),
    true,
    'level up smoke가 debug host level-up overlay helper를 사용하지 않음',
  );
  assert.equal(
    smokeSource.includes('.card-progression'),
    true,
    'level up smoke가 레벨 진행 라인을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('.card-summary'),
    true,
    'level up smoke가 요약 텍스트를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('noLegacyComparison'),
    true,
    'level up smoke가 레거시 비교 블록 부재를 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('.card-discovery-chip'),
    true,
    'level up smoke가 도감 신규 칩을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('.card-priority-hint'),
    true,
    'level up smoke가 승격된 관계 힌트를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('hasPromotedRelationHint'),
    true,
    'level up smoke가 진화/시너지 priority hint를 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('.levelup-stage'),
    true,
    'level up smoke가 dialog 패널 루트를 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('focusInsideDialog'),
    true,
    'overlay smoke들이 dialog 초기 포커스를 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('tabMovesWithinDialog'),
    true,
    'overlay smoke들이 dialog 내부 Tab 순환을 검증하지 않음',
  );
});

test('deterministic smoke runner는 session transport close 경로로 세션을 정리한다', () => {
  const deterministicSmokeSource = readOptionalProjectSource('../scripts/browser-smoke/runDeterministicSmoke.mjs');
  const sessionTransportSource = readOptionalProjectSource('../scripts/browser-smoke/smokeSessionTransport.mjs');

  assert.equal(
    sessionTransportSource.includes('async close()'),
    true,
    'session transport가 명시적 close API를 제공하지 않음',
  );
  assert.equal(
    /transport\.close\?\.\(\)/.test(deterministicSmokeSource),
    true,
    'deterministic smoke runner가 transport close 경로를 호출하지 않음',
  );
});

test('title loadout accessibility smoke는 작은 뷰포트와 키보드 진입을 검증한다', () => {
  assert.equal(
    smokeSource.includes('title_loadout_accessibility'),
    true,
    'loadout accessibility smoke 시나리오가 등록되지 않음',
  );
  assert.equal(
    smokeSource.includes('.sl-panel'),
    true,
    'loadout accessibility smoke가 시작 로드아웃 패널을 측정하지 않음',
  );
  assert.equal(
    smokeSource.includes('.sl-actions'),
    true,
    'loadout accessibility smoke가 sticky action 영역을 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('scrollTop'),
    true,
    'loadout accessibility smoke가 내부 스크롤 도달 가능성을 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('transport.resize'),
    true,
    'loadout accessibility smoke가 작은 뷰포트 resize를 수행하지 않음',
  );
  assert.equal(
    smokeSource.includes("transport.press('Escape')") || smokeSource.includes('transport.press("Escape")'),
    true,
    'loadout accessibility smoke가 ESC 닫기 키보드 경로를 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('data-preset-id'),
    true,
    'loadout accessibility smoke가 quick start preset을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('sl-advanced-summary'),
    true,
    'loadout accessibility smoke가 고급 설정 요약을 확인하지 않음',
  );
});

test('pause/result smoke는 dialog keyboard 계약을 검증한다', () => {
  assert.equal(
    smokeSource.includes('.pv-panel'),
    true,
    'pause smoke가 pause dialog 패널을 확인하지 않음',
  );
  assert.equal(
    smokeSource.includes('escapeResumes'),
    true,
    'pause smoke가 Escape resume 동작을 검증하지 않음',
  );
  assert.equal(
    smokeSource.includes('.result-card'),
    true,
    'result smoke가 result dialog 패널을 확인하지 않음',
  );
});

summary();
