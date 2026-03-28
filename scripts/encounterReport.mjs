import { bossData } from '../src/data/bossData.js';
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
  const lines = [
    '# Encounter Report',
    '',
    '## Boss Timeline',
    ...bossData.map((boss) => `- ${boss.at}s: ${boss.enemyId}`),
    '',
    '## Wave Timeline',
    ...waveData.map(formatWave),
  ];

  for (const stage of stageData) {
    lines.push('', `## Stage: ${stage.id}`, `- Name: ${stage.name}`);
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
