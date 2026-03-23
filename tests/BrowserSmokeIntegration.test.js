import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { getScenarioIds, SCENARIOS } from '../scripts/browser-smoke/scenarios.js';

console.log('\n[BrowserSmokeIntegration]');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

await test('preview 기반 smoke wrapper 모듈을 제공한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  assert.equal(typeof smokeWrapper.runSmokeAgainstPreview, 'function');
  assert.equal(typeof smokeWrapper.buildCommandInvocation, 'function');
  assert.equal(typeof smokeWrapper.waitForServer, 'function');
  assert.equal(typeof smokeWrapper.stopChildProcess, 'function');
  assert.equal(typeof smokeWrapper.waitForChildExit, 'function');
});

await test('smoke wrapper는 Windows npm 실행을 shell 없이 cmd 경유로 정규화한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const invocation = smokeWrapper.buildCommandInvocation('npm.cmd', ['run', 'build'], {
    platform: 'win32',
    comspec: 'C:\\Windows\\System32\\cmd.exe',
  });

  assert.equal(invocation.command, 'C:\\Windows\\System32\\cmd.exe');
  assert.deepEqual(invocation.args.slice(0, 3), ['/d', '/s', '/c']);
  assert.equal(invocation.args[3].includes('npm.cmd run build'), true);
  assert.equal(invocation.shell, false);
});

await test('package.json은 smoke 실행과 전체 verify 스크립트를 노출한다', async () => {
  const pkg = await import('../package.json', { with: { type: 'json' } });
  assert.equal(typeof pkg.default.scripts['test:smoke'], 'string');
  assert.equal(typeof pkg.default.scripts.verify, 'string');
});

await test('browser smoke scenario registry는 title codex/settings 흐름을 포함한다', async () => {
  assert.equal(typeof SCENARIOS.title_codex, 'object', 'title_codex 시나리오가 등록되지 않음');
  assert.equal(typeof SCENARIOS.title_settings, 'object', 'title_settings 시나리오가 등록되지 않음');
  const ids = getScenarioIds({ includeExperimental: true });
  assert.equal(ids.includes('title_codex'), true);
  assert.equal(ids.includes('title_settings'), true);
  assert.equal(SCENARIOS.title_codex.stepNames.includes('accessory'), true, 'title_codex 시나리오가 장신구 도감 흐름을 포함하지 않음');
});

await test('smoke wrapper child 종료 helper는 close 이벤트와 timeout 모두 처리한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');

  const closingChild = new EventEmitter();
  setTimeout(() => {
    closingChild.emit('close', 0);
  }, 10);
  const closedCode = await smokeWrapper.waitForChildExit(closingChild, 100);
  assert.equal(closedCode, 0);

  const hangingChild = new EventEmitter();
  const startedAt = Date.now();
  const timeoutCode = await smokeWrapper.waitForChildExit(hangingChild, 30);
  const elapsedMs = Date.now() - startedAt;
  assert.equal(timeoutCode, null);
  assert.equal(elapsedMs < 250, true, `timeout helper가 너무 오래 대기함: ${elapsedMs}ms`);
});

console.log(`\nBrowserSmokeIntegration: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
