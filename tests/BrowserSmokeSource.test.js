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

test('runner는 runtime hook snapshot 또는 debug host를 사용한다', () => {
  assert.equal(
    runnerSource.includes('render_game_to_text') || runnerSource.includes('__ASHEN_RUNTIME__'),
    true,
    'runner가 runtime hook snapshot을 사용하지 않음',
  );
});

test('scenario 정의는 title/play/pause/result 흐름 이름을 가진다', () => {
  assert.equal(scenariosSource.includes('title_to_play'), true, 'title_to_play 시나리오가 없음');
  assert.equal(scenariosSource.includes('pause_overlay'), true, 'pause_overlay 시나리오가 없음');
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
