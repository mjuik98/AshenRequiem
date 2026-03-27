import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  getOutputRootForRun,
  getScenarioIds,
  resolveScenarioArtifactDir,
  SCENARIOS,
} from '../scripts/browser-smoke/scenarios.js';
import { readProjectSource } from './helpers/sourceInspection.js';

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
  assert.equal(typeof smokeWrapper.runSmokeCli, 'function');
  assert.equal(typeof smokeWrapper.buildCommandInvocation, 'function');
  assert.equal(typeof smokeWrapper.waitForServer, 'function');
  assert.equal(typeof smokeWrapper.stopChildProcess, 'function');
  assert.equal(typeof smokeWrapper.waitForChildExit, 'function');
});

await test('smoke runner는 process/diagnostics helper 모듈로 분리된다', async () => {
  const processHelpers = await import('../scripts/browser-smoke/smokeProcessUtils.mjs');
  const diagnostics = await import('../scripts/browser-smoke/smokeDiagnostics.mjs');
  const cliPaths = await import('../scripts/browser-smoke/smokeCliPaths.mjs');
  const cliRunner = await import('../scripts/browser-smoke/smokeCliRunner.mjs');
  const cliParsers = await import('../scripts/browser-smoke/smokeCliParsers.mjs');
  const sessionTransport = await import('../scripts/browser-smoke/smokeSessionTransport.mjs');
  const cliTransport = await import('../scripts/browser-smoke/smokeCliTransport.mjs');
  const titleScenarios = await import('../scripts/browser-smoke/smokeTitleScenarios.mjs');
  const playScenarios = await import('../scripts/browser-smoke/smokePlayScenarios.mjs');
  const scenarioRegistry = await import('../scripts/browser-smoke/smokeScenarioRunners.mjs');

  assert.equal(typeof processHelpers.buildCommandInvocation, 'function');
  assert.equal(typeof processHelpers.waitForChildExit, 'function');
  assert.equal(typeof processHelpers.stopChildProcess, 'function');
  assert.equal(typeof diagnostics.createSmokeLogger, 'function');
  assert.equal(typeof diagnostics.getActiveHandleSummary, 'function');
  assert.equal(typeof cliPaths.resolveWindowsPlaywrightCliPath, 'function');
  assert.equal(typeof cliPaths.buildPlaywrightInvocation, 'function');
  assert.equal(typeof cliRunner.runPlaywrightCliCommand, 'function');
  assert.equal(typeof cliParsers.parseEvalResult, 'function');
  assert.equal(typeof cliParsers.parseSnapshotPath, 'function');
  assert.equal(typeof sessionTransport.createPlaywrightSessionTransport, 'function');
  assert.equal(typeof cliTransport.runPlaywrightCliCommand, 'function');
  assert.equal(typeof cliTransport.createPlaywrightSessionTransport, 'function');
  assert.equal(typeof titleScenarios.runTitleToPlayScenario, 'function');
  assert.equal(typeof playScenarios.runPauseOverlayScenario, 'function');
  assert.equal(typeof scenarioRegistry.runSmokeScenario, 'function');
  assert.equal(diagnostics.isDebugSmokeEnabled({ env: {}, argv: [] }), false);
  assert.equal(diagnostics.isDebugSmokeEnabled({ env: { ASHEN_SMOKE_DEBUG: '1' }, argv: [] }), true);
  assert.equal(diagnostics.isDebugSmokeEnabled({ env: {}, argv: ['node', 'script', '--debug-smoke'] }), true);
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
  assert.equal(typeof pkg.default.scripts['test:smoke:full'], 'string');
  assert.equal(typeof pkg.default.scripts['smoke:core:prebuilt'], 'string');
  assert.equal(typeof pkg.default.scripts['smoke:full:prebuilt'], 'string');
  assert.equal(typeof pkg.default.scripts.verify, 'string');
  assert.equal(pkg.default.scripts['test:smoke'].includes('--suite core'), true, '기본 smoke는 core suite를 실행해야 함');
  assert.equal(pkg.default.scripts['test:smoke:full'].includes('--all'), true, 'full smoke 스크립트가 모든 시나리오를 실행하지 않음');
  assert.equal(pkg.default.scripts['smoke:core:prebuilt'].includes('--skip-build'), true, 'prebuilt core smoke 스크립트가 skip-build를 사용하지 않음');
  assert.equal(pkg.default.scripts['smoke:full:prebuilt'].includes('--skip-build'), true, 'prebuilt full smoke 스크립트가 skip-build를 사용하지 않음');
});

await test('core smoke wrapper는 로컬 suite 완료를 위한 여유 timeout budget을 둔다', async () => {
  const smokeWrapperSource = readProjectSource('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  assert.equal(
    smokeWrapperSource.includes('const SMOKE_TIMEOUT_MS = 180_000;'),
    true,
    'core smoke timeout budget이 너무 낮아 로컬 verify:smoke가 불안정해지면 안 됨',
  );
});

await test('browser smoke scenario registry는 title codex/settings 흐름을 포함한다', async () => {
  assert.equal(typeof SCENARIOS.title_codex, 'object', 'title_codex 시나리오가 등록되지 않음');
  assert.equal(typeof SCENARIOS.title_meta_shop, 'object', 'title_meta_shop 시나리오가 등록되지 않음');
  assert.equal(typeof SCENARIOS.title_settings, 'object', 'title_settings 시나리오가 등록되지 않음');
  assert.equal(typeof SCENARIOS.title_settings_persist, 'object', 'title_settings_persist 시나리오가 등록되지 않음');
  const ids = getScenarioIds({ includeExperimental: true });
  assert.equal(ids.includes('title_codex'), true);
  assert.equal(ids.includes('title_meta_shop'), true);
  assert.equal(ids.includes('title_settings'), true);
  assert.equal(ids.includes('title_settings_persist'), true);
  assert.equal(SCENARIOS.title_to_play.suite, 'core', 'title_to_play가 core smoke suite에 속해야 함');
  assert.equal(SCENARIOS.title_meta_shop.suite, 'core', 'title_meta_shop이 core smoke suite에 속해야 함');
  assert.equal(SCENARIOS.title_settings_persist.suite, 'core', 'title_settings_persist가 core smoke suite에 속해야 함');
  assert.equal(SCENARIOS.title_codex.suite, 'extended', 'title_codex는 extended smoke suite에 속해야 함');
  assert.equal(SCENARIOS.title_settings.suite, 'extended', 'title_settings는 extended smoke suite에 속해야 함');
  assert.equal(SCENARIOS.title_codex.stepNames.includes('accessory'), true, 'title_codex 시나리오가 장신구 도감 흐름을 포함하지 않음');
  assert.equal(SCENARIOS.title_meta_shop.stepNames.includes('purchase'), true, 'title_meta_shop 시나리오가 구매 흐름을 포함하지 않음');
  assert.equal(SCENARIOS.title_settings_persist.stepNames.includes('persist'), true, 'title_settings_persist 시나리오가 저장 검증을 포함하지 않음');
  assert.deepEqual(getScenarioIds({ suite: 'core' }), [
    'title_to_play',
    'title_meta_shop',
    'title_settings_persist',
    'pause_overlay',
    'levelup_overlay',
    'result_screen',
  ], 'core smoke suite 구성이 기대와 다름');
  assert.equal(getOutputRootForRun({ suite: 'core' }), 'output/web-game/deterministic-smoke-core');
  assert.equal(getOutputRootForRun({ all: true }), 'output/web-game/deterministic-smoke-full');
  assert.equal(resolveScenarioArtifactDir('title_to_play'), 'output/web-game/deterministic-smoke-core/title-to-play');
  assert.equal(resolveScenarioArtifactDir('title_codex'), 'output/web-game/deterministic-smoke-full/title-codex');
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

await test('child 종료 helper는 close가 먼저 오면 대기 타이머를 정리한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const closingChild = new EventEmitter();
  let clearedId = null;

  const pending = smokeWrapper.waitForChildExit(closingChild, 5000, {
    setTimeoutFn(callback) {
      return globalThis.setTimeout(callback, 5000);
    },
    clearTimeoutFn(timeoutId) {
      clearedId = timeoutId;
      globalThis.clearTimeout(timeoutId);
    },
  });

  setTimeout(() => {
    closingChild.emit('close', 0);
  }, 10);

  const code = await pending;
  assert.equal(code, 0);
  assert.notEqual(clearedId, null, 'close 이후에도 timeout 정리가 호출되지 않음');
});

await test('child 종료 helper는 close가 늦어도 exit 이벤트로 즉시 완료한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const child = new EventEmitter();
  let clearCalls = 0;

  const pending = smokeWrapper.waitForChildExit(child, 5000, {
    clearTimeoutFn(timeoutId) {
      clearCalls += 1;
      globalThis.clearTimeout(timeoutId);
    },
  });

  setTimeout(() => {
    child.emit('exit', 0);
  }, 10);

  const code = await pending;
  assert.equal(code, 0);
  assert.equal(clearCalls, 1, 'exit 완료 시 timeout 정리가 정확히 1회 호출되어야 함');
});

await test('preview ready helper는 서버가 뜨기 전에 preview 프로세스가 종료되면 즉시 실패한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const preview = new EventEmitter();
  preview.stdout = new EventEmitter();
  preview.stderr = new EventEmitter();

  const pending = smokeWrapper.waitForPreviewReady(preview, 'http://127.0.0.1:4173', 15000, {
    waitForServerFn: () => new Promise(() => {}),
  });

  setTimeout(() => {
    preview.emit('close', 1);
  }, 10);

  await assert.rejects(
    pending,
    /Preview server exited before becoming ready/,
    'preview 조기 종료를 즉시 감지하지 못함',
  );
});

await test('smoke CLI 엔트리포인트는 성공과 실패를 명시적 종료 코드로 마감한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const exits = [];
  const errors = [];

  await smokeWrapper.runSmokeCli(
    ['node', 'runSmokeAgainstPreview.mjs', '--all', '--url', 'http://127.0.0.1:4173'],
    {
      parseArgsFn: () => ({ all: true, host: '127.0.0.1', port: 4173 }),
      runFn: async () => {},
      exitFn: (code) => exits.push(code),
      errorFn: (message) => errors.push(message),
    },
  );
  assert.deepEqual(exits, [0], '성공 시 exit code 0으로 종료하지 않음');
  assert.deepEqual(errors, []);

  exits.length = 0;
  await smokeWrapper.runSmokeCli(
    ['node', 'runSmokeAgainstPreview.mjs', '--all'],
    {
      parseArgsFn: () => ({ all: true, host: '127.0.0.1', port: 4173 }),
      runFn: async () => {
        throw new Error('boom');
      },
      exitFn: (code) => exits.push(code),
      errorFn: (message) => errors.push(message),
    },
  );
  assert.deepEqual(exits, [1], '실패 시 exit code 1로 종료하지 않음');
  assert.equal(errors.at(-1).includes('boom'), true, '실패 메시지를 보고하지 않음');
});

await test('preview smoke wrapper는 prebuilt dist가 있으면 build 단계를 건너뛸 수 있다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const commandCalls = [];
  const preview = new EventEmitter();
  preview.pid = 777;
  preview.stdout = new EventEmitter();
  preview.stderr = new EventEmitter();

  await smokeWrapper.runSmokeAgainstPreview(
    { host: '127.0.0.1', port: 4173, suite: 'core', all: false, skipBuild: true },
    {
      findAvailablePortFn: async () => 4173,
      runCommandFn: async (command, args) => {
        commandCalls.push([command, args]);
      },
      spawnCommandFn: () => preview,
      waitForPreviewReadyFn: async () => {},
      stopChildProcessFn: async () => {},
    },
  );

  assert.equal(commandCalls.length, 1, 'skipBuild=true이면 smoke 실행만 남아야 함');
  assert.equal(commandCalls[0][1].includes('--suite'), true, 'skipBuild 경로가 smoke runner를 실행하지 않음');
});

await test('playwright transport는 timeout 시 자식 프로세스를 정리하고 실패를 반환한다', async () => {
  const cliTransport = await import('../scripts/browser-smoke/smokeCliTransport.mjs');
  const killCalls = [];
  const child = new EventEmitter();
  child.pid = 321;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};

  await assert.rejects(
    cliTransport.runPlaywrightCliCommand(['eval', '1 + 1'], {
      timeoutMs: 20,
      spawnCommand: () => child,
      waitForChildExit: async () => null,
      stopChildProcess: async (target) => {
        killCalls.push(target.pid);
      },
      pipeOutput: false,
    }),
    /timed out/i,
    'timeout된 playwright 요청이 실패로 정리되지 않음',
  );

  assert.deepEqual(killCalls, [321], 'timeout 시 자식 프로세스 정리가 호출되지 않음');
});

console.log(`\nBrowserSmokeIntegration: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
