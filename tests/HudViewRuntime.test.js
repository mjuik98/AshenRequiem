import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[HudViewRuntime]');

const { test, summary } = createRunner('HudViewRuntime');

test('HudView는 stage directive와 요약 노트를 분리해 guidance 계층을 렌더한다', async () => {
  const dom = installMockDom();

  try {
    const { HudView } = await import('../src/ui/hud/HudView.js');
    const container = document.createElement('div');
    const view = new HudView(container);

    view.update(
      {
        level: 4,
        xp: 3,
        curse: 0.12,
      },
      {
        entities: { player: { level: 4, xp: 3, curse: 0.12 } },
        progression: { chestRewardQueue: 0 },
        run: {
          elapsedTime: 96,
          killCount: 17,
          runCurrencyEarned: 23,
          encounterState: {
            currentBeat: {
              label: '압박 구간',
              summaryText: '측면 압박과 고속 추적이 강해집니다.',
              intensity: 'pressure',
            },
            nextBossStartsIn: 18,
          },
          guidance: {
            primaryObjective: { title: '곡예의 각성', progressText: '420 / 500' },
            stageDirective: { title: '수호 등불', detail: '짧은 무적 ward가 전장에 생성됩니다.' },
            stageModifier: { title: 'Kindled Front', counterplay: '등불이 켜진 순간 짧게 안쪽으로 진입하세요.' },
          },
        },
      },
    );

    assert.equal(view._elThreatChip?.textContent, '위협: 압박 구간', 'threat chip은 요약문 없이 압축된 label만 보여야 함');
    assert.equal(view._elBossChip?.textContent, '보스: 18s', '보스 chip이 임박 ETA를 보여주지 않음');
    assert.equal(view._elStageChip?.textContent, '스테이지: 수호 등불', 'stage directive chip이 렌더되지 않음');
    assert.equal(view._elModifierChip?.textContent, '변조: Kindled Front', 'stage modifier chip이 렌더되지 않음');
    assert.equal(view._elObjectiveChip?.textContent, '목표: 곡예의 각성', 'objective chip이 압축된 title만 렌더하지 않음');
    assert.equal(view._elGuidanceNote?.textContent, '측면 압박과 고속 추적이 강해집니다.', 'guidance note가 현재 전투 요약을 우선 노출하지 않음');
    assert.equal(view._elBossChip?.dataset?.state, 'imminent', '보스 chip이 임박 상태를 dataset으로 노출하지 않음');
    assert.equal(view._elThreatChip?.dataset?.level, 'pressure', 'threat chip이 전투 강도 dataset을 노출하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
