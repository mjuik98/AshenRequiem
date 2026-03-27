import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRunner } from './helpers/testRunner.js';
import { getProfilePresetIds } from '../scripts/profileRuntime.js';
import { readProjectJson } from './helpers/sourceInspection.js';

console.log('\n[ProfileRuntime]');

const { test, summary } = createRunner('ProfileRuntime');

test('profile script can emit machine-readable JSON for automation', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/profile.js', '5', '--json'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, `profile script failed: ${result.stderr}`);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.frameCount, 5);
  assert.equal(payload.targetFps, 60);
  assert.equal(Array.isArray(payload.systems), true);
  assert.equal(payload.systems.length > 0, true);
  assert.equal(typeof payload.perFrameMs, 'number');
});

test('profile runtime exposes named deterministic presets and json output can select one', () => {
  assert.equal(
    getProfilePresetIds().includes('swarm'),
    true,
    'swarm preset이 profile runtime에 등록되지 않음',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/profile.js', '5', '--preset', 'swarm', '--json'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, `profile preset script failed: ${result.stderr}`);

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.preset, 'swarm');
  assert.equal(typeof payload.budget?.maxPerFrameMs, 'number', 'profile json budget metadata가 없음');
  assert.equal(typeof payload.withinBudget, 'boolean', 'profile json withinBudget flag가 없음');
  assert.equal(Array.isArray(payload.systems), true);
});

test('profile script can fail verification when an asserted budget is exceeded', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/profile.js', '5', '--json', '--budget-ms', '0', '--assert-budget'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  );

  assert.notEqual(result.status, 0, 'budget assertion이 초과돼도 profile script가 실패하지 않음');

  const payload = JSON.parse(result.stdout);
  assert.equal(payload.withinBudget, false, 'budget override 이후에도 withinBudget=true');
});

test('package verify script exposes a dedicated profile budget check', () => {
  const pkg = readProjectJson('../package.json');
  assert.equal(typeof pkg.scripts.lint, 'string', 'lint 스크립트가 없음');
  assert.equal(typeof pkg.scripts['lint:architecture'], 'string', 'lint:architecture 스크립트가 없음');
  assert.equal(typeof pkg.scripts['lint:eslint'], 'string', 'lint:eslint 스크립트가 없음');
  assert.equal(typeof pkg.scripts['profile:check'], 'string', 'profile:check 스크립트가 없음');
  assert.equal(typeof pkg.scripts['check:boundaries'], 'string', 'check:boundaries 스크립트가 없음');
  assert.equal(typeof pkg.scripts['check:architecture-docs'], 'string', 'check:architecture-docs 스크립트가 없음');
  assert.equal(typeof pkg.scripts['verify:fast'], 'string', 'verify:fast 스크립트가 없음');
  assert.equal(typeof pkg.scripts['verify:ci'], 'string', 'verify:ci 스크립트가 없음');
  assert.equal(typeof pkg.scripts['verify:smoke'], 'string', 'verify:smoke 스크립트가 없음');
  assert.equal(pkg.scripts.verify, 'npm run verify:fast', '기본 verify는 빠른 로컬 기준선으로 연결돼야 함');
  assert.equal(pkg.scripts.lint, 'npm run lint:architecture', 'lint는 architecture lint baseline을 가리켜야 함');
  assert.equal(pkg.scripts['lint:eslint'].includes('eslint'), true, 'lint:eslint는 eslint CLI를 실행해야 함');
  assert.equal(pkg.scripts['lint:architecture'].includes('npm run lint:eslint'), true, 'lint:architecture에 lint:eslint가 연결되지 않음');
  assert.equal(pkg.scripts['lint:architecture'].includes('npm run check:boundaries'), true, 'lint:architecture에 check:boundaries가 연결되지 않음');
  assert.equal(pkg.scripts['lint:architecture'].includes('npm run check:architecture-docs'), true, 'lint:architecture에 check:architecture-docs가 연결되지 않음');
  assert.equal(pkg.scripts['verify:fast'].includes('npm run profile:check'), true, 'verify:fast에 profile:check가 연결되지 않음');
  assert.equal(pkg.scripts['verify:fast'].includes('npm run lint'), true, 'verify:fast에 lint 단계가 연결되지 않음');
  assert.equal(pkg.scripts['verify:smoke'], 'npm run build && npm run smoke:core:prebuilt', 'verify:smoke는 단일 build 후 prebuilt smoke를 재사용해야 함');
  assert.equal(pkg.scripts['verify:ci'].includes('npm run smoke:core:prebuilt'), true, 'verify:ci는 prebuilt core smoke baseline을 포함해야 함');
  assert.equal(pkg.scripts['verify:ci'].includes('npm run test:smoke'), false, 'verify:ci가 중복 build를 유발하는 test:smoke wrapper를 직접 호출하면 안 됨');
});

test('boundary check script exposes a CLI-checkable architecture guard', async () => {
  const boundaries = await import('../scripts/checkBoundaries.js');
  const architectureDocs = await import('../scripts/checkArchitectureDocs.mjs');

  assert.equal(typeof boundaries.collectBoundaryViolations, 'function');
  assert.equal(typeof boundaries.main, 'function');
  assert.equal(typeof architectureDocs.collectArchitectureDocViolations, 'function');
  assert.equal(typeof architectureDocs.main, 'function');
});

summary();
