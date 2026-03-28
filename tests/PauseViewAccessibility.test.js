import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { makePlayer } from './fixtures/index.js';

console.log('\n[PauseViewAccessibility]');

const { test, summary } = createRunner('PauseViewAccessibility');

await test('PauseView는 dialog 포커스를 잡고 Escape로 재개 요청 후 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { PauseView } = await import('../src/ui/pause/PauseView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    const player = makePlayer({
      hp: 90,
      maxHp: 100,
      weapons: [{ id: 'magic_bolt', weaponId: 'magic_bolt', level: 1 }],
      accessories: [],
      maxWeaponSlots: 3,
      maxAccessorySlots: 3,
    });
    const data = {
      weaponData: [{ id: 'magic_bolt', name: '마법탄', description: '기본 투사체', icon: '🔵' }],
      accessoryData: [],
      synergyData: [],
    };

    let resumed = 0;
    const view = new PauseView(container);
    view.show({
      player,
      data,
      world: { elapsedTime: 12, killCount: 3 },
      session: { options: {} },
      onResume: () => {
        resumed += 1;
        view.hide();
      },
    });

    assert.equal(document.activeElement, view.el.querySelector('.pv-panel'), 'Pause dialog 초기 포커스가 패널에 가지 않음');

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });

    assert.equal(resumed, 1, 'Pause dialog에서 Escape가 재개 요청으로 이어지지 않음');
    assert.equal(document.activeElement, previousFocus, 'Pause dialog 닫기 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
