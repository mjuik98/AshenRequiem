import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[SubscreenDialogRuntime]');

const { test, summary } = createRunner('SubscreenDialogRuntime');

await test('MetaShopView는 패널에 초기 포커스를 두고 Escape 닫기 후 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { MetaShopView } = await import('../src/ui/metashop/MetaShopView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    let backCount = 0;
    const view = new MetaShopView(container);
    view.show(
      makeSessionState({
        meta: {
          currency: 999,
          permanentUpgrades: {},
        },
      }),
      () => {},
      () => {
        backCount += 1;
        view.destroy();
      },
    );

    assert.equal(document.activeElement, view.el.querySelector('.ms-panel'), 'MetaShop 초기 포커스가 패널에 가지 않음');

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });

    assert.equal(backCount, 1, 'MetaShop Escape가 back handler를 호출하지 않음');
    assert.equal(document.activeElement, previousFocus, 'MetaShop 종료 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

await test('SettingsView는 패널에 초기 포커스를 두고 Escape 닫기 후 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { SettingsView } = await import('../src/ui/settings/SettingsView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    let backCount = 0;
    const view = new SettingsView(container);
    view.show(
      makeSessionState(),
      () => {},
      () => {
        backCount += 1;
        view.destroy();
      },
    );

    assert.equal(document.activeElement, view.el.querySelector('.sv-panel'), 'Settings 초기 포커스가 패널에 가지 않음');

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });

    assert.equal(backCount, 1, 'Settings Escape가 back handler를 호출하지 않음');
    assert.equal(document.activeElement, previousFocus, 'Settings 종료 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

await test('CodexView는 패널에 초기 포커스를 두고 Escape 닫기 후 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { CodexView } = await import('../src/ui/codex/CodexView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    let backCount = 0;
    const view = new CodexView(container);
    view.show({
      enemyData: [{ id: 'skeleton' }, { id: 'boss_lich' }],
      weaponData: [{ id: 'magic_bolt', name: 'Magic Bolt', damage: 8, cooldown: 1.2, behaviorId: 'targetProjectile', maxLevel: 7 }],
      accessoryData: [{ id: 'iron_heart', name: 'Iron Heart', description: '최대 HP +20', icon: '❤', maxLevel: 5 }],
      weaponEvolutionData: [],
    }, makeSessionState(), () => {
      backCount += 1;
      view.destroy();
    });

    assert.equal(document.activeElement, view.el.querySelector('.cx-panel'), 'Codex 초기 포커스가 패널에 가지 않음');

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });

    assert.equal(backCount, 1, 'Codex Escape가 back handler를 호출하지 않음');
    assert.equal(document.activeElement, previousFocus, 'Codex 종료 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
