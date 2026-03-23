import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';

const runnerPath = new URL('../scripts/browser-smoke/runDeterministicSmoke.mjs', import.meta.url);
const scenariosPath = new URL('../scripts/browser-smoke/scenarios.js', import.meta.url);

const runnerExists = existsSync(runnerPath);
const scenariosExists = existsSync(scenariosPath);
const runnerSource = runnerExists ? readFileSync(runnerPath, 'utf8') : '';
const scenariosSource = scenariosExists ? readFileSync(scenariosPath, 'utf8') : '';

console.log('\n[BrowserSmokeSource]');

test('deterministic browser smoke runner 파일이 존재한다', () => {
  assert.equal(runnerExists, true, 'runDeterministicSmoke.mjs 파일이 아직 없음');
  assert.equal(scenariosExists, true, 'scenarios.js 파일이 아직 없음');
});

test('runner는 안정된 debug host만 사용하고 scene 내부 슬롯에 직접 접근하지 않는다', () => {
  assert.equal(
    runnerSource.includes('__ASHEN_DEBUG__'),
    true,
    'runner가 안정된 debug host를 사용하지 않음',
  );
  assert.equal(
    runnerSource.includes('sceneManager.currentScene._ui'),
    false,
    'runner가 scene 내부 슬롯에 직접 접근하면 안 됨',
  );
});

test('scenario 정의는 title/play/pause/result 흐름 이름을 가진다', () => {
  assert.equal(scenariosSource.includes('title_to_play'), true, 'title_to_play 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_overlay'), true, 'pause_overlay 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_layout'), true, 'pause_layout 시나리오가 없음');
  assert.equal(scenariosSource.includes('result_screen'), true, 'result_screen 시나리오가 없음');
});

test('browser smoke 산출물은 output/web-game 또는 output/playwright 아래로 제한된다', () => {
  assert.equal(
    runnerSource.includes('output/web-game/') || runnerSource.includes('output/playwright/'),
    true,
    'runner 산출물 경로가 output 하위로 고정되지 않음',
  );
});

summary();
