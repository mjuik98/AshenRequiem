import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[LevelUpViewAccessibility]');

const { test, summary } = createRunner('LevelUpViewAccessibility');

await test('LevelUpView는 dialog 포커스를 잡고 닫을 때 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { LevelUpView } = await import('../src/ui/levelup/LevelUpView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    const view = new LevelUpView(container);
    view.show({
      choices: [
        {
          id: 'up_flame_zone',
          name: '화염 지대',
          type: 'weapon_upgrade',
          summaryText: '화염 지대 데미지 +1',
          levelLabel: 'Lv 1 → Lv 2',
          relatedHints: ['시너지 빌드 연결'],
        },
      ],
      rerollsRemaining: 1,
      banishesRemaining: 1,
      onSelect: () => {},
      onReroll: () => {},
      onToggleBanishMode: () => {},
    });

    assert.equal(document.activeElement, view.el.querySelector('.levelup-stage'), 'LevelUp dialog 초기 포커스가 패널에 가지 않음');

    view.hide();
    assert.equal(document.activeElement, previousFocus, 'LevelUp dialog 닫기 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
