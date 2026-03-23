import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';

const runnerPath = new URL('../scripts/browser-smoke/runDeterministicSmoke.mjs', import.meta.url);
const scenariosPath = new URL('../scripts/browser-smoke/scenarios.js', import.meta.url);
const scenarioRunnersPath = new URL('../scripts/browser-smoke/smokeScenarioRunners.mjs', import.meta.url);
const titleScenariosPath = new URL('../scripts/browser-smoke/smokeTitleScenarios.mjs', import.meta.url);
const playScenariosPath = new URL('../scripts/browser-smoke/smokePlayScenarios.mjs', import.meta.url);
const cliPathsPath = new URL('../scripts/browser-smoke/smokeCliPaths.mjs', import.meta.url);
const cliRunnerPath = new URL('../scripts/browser-smoke/smokeCliRunner.mjs', import.meta.url);
const cliParsersPath = new URL('../scripts/browser-smoke/smokeCliParsers.mjs', import.meta.url);
const sessionTransportPath = new URL('../scripts/browser-smoke/smokeSessionTransport.mjs', import.meta.url);

const runnerExists = existsSync(runnerPath);
const scenariosExists = existsSync(scenariosPath);
const scenarioRunnersExists = existsSync(scenarioRunnersPath);
const titleScenariosExists = existsSync(titleScenariosPath);
const playScenariosExists = existsSync(playScenariosPath);
const cliPathsExists = existsSync(cliPathsPath);
const cliRunnerExists = existsSync(cliRunnerPath);
const cliParsersExists = existsSync(cliParsersPath);
const sessionTransportExists = existsSync(sessionTransportPath);
const runnerSource = runnerExists ? readFileSync(runnerPath, 'utf8') : '';
const scenariosSource = scenariosExists ? readFileSync(scenariosPath, 'utf8') : '';
const scenarioRunnersSource = scenarioRunnersExists ? readFileSync(scenarioRunnersPath, 'utf8') : '';
const titleScenariosSource = titleScenariosExists ? readFileSync(titleScenariosPath, 'utf8') : '';
const playScenariosSource = playScenariosExists ? readFileSync(playScenariosPath, 'utf8') : '';
const cliTransportSource = existsSync(new URL('../scripts/browser-smoke/smokeCliTransport.mjs', import.meta.url))
  ? readFileSync(new URL('../scripts/browser-smoke/smokeCliTransport.mjs', import.meta.url), 'utf8')
  : '';
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
  assert.equal(scenariosSource.includes('pause_overlay'), true, 'pause_overlay 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_layout'), true, 'pause_layout 시나리오가 없음');
  assert.equal(scenariosSource.includes('result_screen'), true, 'result_screen 시나리오가 없음');
  assert.equal(scenariosSource.includes("'accessory'"), true, 'title_codex 시나리오가 accessory step을 포함하지 않음');
});

test('browser smoke 산출물은 output/web-game 또는 output/playwright 아래로 제한된다', () => {
  assert.equal(
    smokeSource.includes('output/web-game/') || smokeSource.includes('output/playwright/'),
    true,
    'runner 산출물 경로가 output 하위로 고정되지 않음',
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

summary();
