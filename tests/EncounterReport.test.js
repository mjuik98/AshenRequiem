import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[EncounterReport]');

const { test, summary } = createRunner('EncounterReport');

test('encounter authoring metrics helper exposes global and per-stage pacing summaries', async () => {
  const metricsApi = await import('../src/domain/play/encounter/encounterAuthoringMetrics.js');
  const { stageData } = await import('../src/data/stageData.js');
  const { waveData } = await import('../src/data/waveData.js');
  const { bossData } = await import('../src/data/bossData.js');

  assert.equal(typeof metricsApi.buildEncounterAuthoringMetrics, 'function', 'encounter authoring metrics helper가 없음');

  const report = metricsApi.buildEncounterAuthoringMetrics({ stageData, waveData, bossData });
  assert.equal(typeof report.global.averageSpawnPerSecond, 'number', 'global averageSpawnPerSecond가 없음');
  assert.equal(typeof report.global.peakSpawnPerSecond, 'number', 'global peakSpawnPerSecond가 없음');
  assert.equal(report.global.bossCount > 0, true, 'boss count가 계산되지 않음');
  assert.equal(Array.isArray(report.stages), true, 'stage metrics 배열이 없음');
  assert.equal(report.stages.length >= stageData.length, true, 'stage metrics가 stageData를 모두 다루지 않음');

  const frostHarbor = report.stages.find((entry) => entry.stageId === 'frost_harbor');
  assert.equal(typeof frostHarbor?.pressureScore, 'number', 'pressureScore가 stage metrics에 없음');
  assert.equal(typeof frostHarbor?.gimmicksPerFiveMinutes, 'number', 'gimmick cadence가 stage metrics에 없음');
  assert.equal(typeof frostHarbor?.expectedPeakSpawnPerSecond, 'number', 'stage peak spawn rate가 계산되지 않음');
  assert.equal(typeof frostHarbor?.stageModifierTitle, 'string', 'stage modifier title이 stage metrics에 없음');
  assert.equal(typeof frostHarbor?.counterplay, 'string', 'counterplay hint가 stage metrics에 없음');
});

test('encounter report script prints actionable authoring metrics, not only raw timelines', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/encounterReport.mjs'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, `encounter report script failed: ${result.stderr}`);
  assert.equal(result.stdout.includes('## Global Metrics'), true, 'global metrics section이 없음');
  assert.equal(result.stdout.includes('Pressure Score'), true, 'stage pressure score 출력이 없음');
  assert.equal(result.stdout.includes('Expected Avg Spawn/s'), true, 'stage spawn summary 출력이 없음');
  assert.equal(result.stdout.includes('Boss Window Lead'), true, 'boss timing authoring metric이 없음');
  assert.equal(result.stdout.includes('Modifier Draft'), true, 'stage modifier draft 출력이 없음');
  assert.equal(result.stdout.includes('Counterplay'), true, 'counterplay 출력이 없음');
});

summary();
