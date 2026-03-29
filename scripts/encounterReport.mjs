import { bossData } from '../src/data/bossData.js';
import { buildEncounterAuthoringMetrics } from '../src/domain/play/encounter/encounterAuthoringMetrics.js';
import { stageData } from '../src/data/stageData.js';
import { waveData } from '../src/data/waveData.js';

function formatBeat(beat) {
  const to = Number.isFinite(beat.to) ? beat.to : 'inf';
  return `  - ${beat.id}: ${beat.from}s -> ${to}s | ${beat.label} | spawn x${beat.spawnRateMult ?? 1} | gimmick x${beat.gimmickIntervalMult ?? 1}`;
}

function formatGimmick(gimmick) {
  return `  - ${gimmick.id}: ${gimmick.type} @ ${gimmick.startAt ?? '-'}s / every ${gimmick.interval ?? '-'}s`;
}

function formatWave(wave) {
  const to = Number.isFinite(wave.to) ? wave.to : 'inf';
  return `  - ${wave.from}s -> ${to}s | spawn ${wave.spawnPerSecond}/s | enemies: ${wave.enemyIds.join(', ')}`;
}

function renderReport() {
  const metrics = buildEncounterAuthoringMetrics({ stageData, waveData, bossData });
  const lines = [
    '# Encounter Report',
    '',
    '## Global Metrics',
    `- Stage Window: ${metrics.global.stageWindowSeconds}s`,
    `- Average Spawn/s: ${metrics.global.averageSpawnPerSecond}`,
    `- Peak Spawn/s: ${metrics.global.peakSpawnPerSecond}`,
    `- Average Prop Spawn/s: ${metrics.global.averagePropSpawnPerSecond}`,
    `- Boss Count: ${metrics.global.bossCount}`,
    `- Boss Cadence: first ${metrics.global.firstBossAt}s | last ${metrics.global.lastBossAt}s | avg gap ${metrics.global.averageBossCadenceSeconds}s`,
    '',
    '## Boss Timeline',
    ...bossData.map((boss) => `- ${boss.at}s: ${boss.enemyId}`),
    '',
    '## Wave Timeline',
    ...waveData.map(formatWave),
  ];

  for (const stage of stageData) {
    const stageMetrics = metrics.stages.find((entry) => entry.stageId === stage.id);
    lines.push('', `## Stage: ${stage.id}`, `- Name: ${stage.name}`);
    lines.push(`- Pressure Score: ${stageMetrics?.pressureScore ?? 0}`);
    lines.push(`- Expected Avg Spawn/s: ${stageMetrics?.expectedAvgSpawnPerSecond ?? 0}`);
    lines.push(`- Expected Peak Spawn/s: ${stageMetrics?.expectedPeakSpawnPerSecond ?? 0}`);
    lines.push(`- Expected Reward Mult: x${stageMetrics?.expectedRewardMultiplier ?? 1}`);
    lines.push(`- Gimmicks Per Five Minutes: ${stageMetrics?.gimmicksPerFiveMinutes ?? 0}`);
    lines.push(`- Boss Window Lead: ${stageMetrics?.bossWindowLeadSeconds ?? 0}s`);
    lines.push(`- Modifier Draft: ${stageMetrics?.stageModifierTitle || '-'}`);
    lines.push(`- Counterplay: ${stageMetrics?.counterplay || '-'}`);
    lines.push('- Encounter Timeline:');
    for (const beat of stage.encounterTimeline ?? []) {
      lines.push(formatBeat(beat));
    }
    lines.push('- Gimmicks:');
    for (const gimmick of stage.gimmicks ?? []) {
      lines.push(formatGimmick(gimmick));
    }
  }

  return `${lines.join('\n')}\n`;
}

process.stdout.write(renderReport());
