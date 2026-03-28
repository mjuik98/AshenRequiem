import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[EncounterDirectorDomain]');

const { test, summary } = createRunner('EncounterDirectorDomain');

let encounterApi = null;

try {
  encounterApi = await import('../src/domain/play/encounter/encounterDirectorDomain.js');
} catch (error) {
  encounterApi = { error };
}

function getApi() {
  assert.ok(!encounterApi.error, encounterApi.error?.message ?? 'encounterDirectorDomain.js가 아직 없음');
  return encounterApi;
}

test('encounter director domain은 active beat와 다음 beat를 계산한다', () => {
  const { resolveEncounterState } = getApi();

  const encounterState = resolveEncounterState({
    elapsedTime: 95,
    stage: {
      id: 'moon_crypt',
      encounterTimeline: [
        { id: 'opening', from: 0, to: 60, intensity: 'warmup', label: '탐색 구간' },
        { id: 'surge', from: 60, to: 120, intensity: 'pressure', label: '압박 구간', summaryText: '측면 압박이 강해집니다.', spawnRateMult: 1.25 },
        { id: 'boss_setup', from: 120, to: 180, intensity: 'boss_setup', label: '보스 준비' },
      ],
    },
    bossData: [{ at: 300, enemyId: 'boss_lich' }],
  });

  assert.equal(encounterState.currentBeat.id, 'surge', '현재 beat가 잘못 계산됨');
  assert.equal(encounterState.currentBeat.spawnRateMult, 1.25, '현재 beat multiplier가 보존되지 않음');
  assert.equal(encounterState.nextBeat.id, 'boss_setup', '다음 beat가 계산되지 않음');
  assert.equal(encounterState.nextBeatStartsIn, 25, '다음 beat 시작까지 남은 시간이 잘못 계산됨');
  assert.equal(encounterState.nextBossAt, 300, '다음 boss 시점이 계산되지 않음');
  assert.equal(encounterState.nextBossStartsIn, 205, '다음 boss까지 남은 시간이 잘못 계산됨');
});

test('encounter director domain은 timeline이 없으면 기본 안정 상태를 반환한다', () => {
  const { resolveEncounterState } = getApi();

  const encounterState = resolveEncounterState({
    elapsedTime: 12,
    stage: { id: 'ash_plains' },
    bossData: [],
  });

  assert.equal(encounterState.currentBeat.id, 'default', '기본 beat id가 없음');
  assert.equal(encounterState.currentBeat.intensity, 'steady', '기본 intensity가 steady가 아님');
  assert.equal(encounterState.nextBeat, null, 'timeline이 없으면 nextBeat는 null이어야 함');
  assert.equal(encounterState.nextBossAt, null, 'bossData가 없으면 nextBossAt은 null이어야 함');
});

summary();
