import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';
import { getProfilePresetIds } from '../scripts/profileRuntime.js';

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
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(typeof pkg.scripts['profile:check'], 'string', 'profile:check 스크립트가 없음');
  assert.equal(typeof pkg.scripts['verify:fast'], 'string', 'verify:fast 스크립트가 없음');
  assert.equal(typeof pkg.scripts['verify:ci'], 'string', 'verify:ci 스크립트가 없음');
  assert.equal(pkg.scripts.verify, 'npm run verify:fast', '기본 verify는 빠른 로컬 기준선으로 연결돼야 함');
  assert.equal(pkg.scripts['verify:fast'].includes('npm run profile:check'), true, 'verify:fast에 profile:check가 연결되지 않음');
  assert.equal(pkg.scripts['verify:ci'].includes('npm run test:smoke'), true, 'verify:ci는 smoke baseline을 포함해야 함');
});

summary();
