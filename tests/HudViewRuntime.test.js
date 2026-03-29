import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[HudViewRuntime]');

const { test, summary } = createRunner('HudViewRuntime');

test('HudView는 플레이 핵심 수치만 갱신하고 상단 guidance HUD는 비운다', async () => {
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

    assert.equal(view._elLevel?.textContent, 'Lv.4', 'HUD 레벨 표시가 갱신되지 않음');
    assert.equal(view._elKills?.textContent, '킬: 17', 'HUD 킬 표시가 갱신되지 않음');
    assert.equal(view._elGold?.textContent, '골드: 23', 'HUD 골드 표시가 갱신되지 않음');
    assert.equal(view._elCurse?.textContent, '저주: 12%', 'HUD 저주 표시가 갱신되지 않음');
    assert.equal(view._elThreatChip, undefined, '제거된 threat chip 참조가 남아 있음');
    assert.equal(view._elBossChip, undefined, '제거된 boss chip 참조가 남아 있음');
    assert.equal(view._elStageChip, undefined, '제거된 stage chip 참조가 남아 있음');
    assert.equal(view._elModifierChip, undefined, '제거된 modifier chip 참조가 남아 있음');
    assert.equal(view._elObjectiveChip, undefined, '제거된 objective chip 참조가 남아 있음');
    assert.equal(view._elGuidanceNote, undefined, '제거된 guidance note 참조가 남아 있음');
  } finally {
    dom.restore();
  }
});

summary();
