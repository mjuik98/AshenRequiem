import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

summary();
