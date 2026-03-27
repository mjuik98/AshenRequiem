import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[StartLoadoutView]');

const { test, summary } = createRunner('StartLoadoutView');

test('StartLoadoutView는 시작 시 확장된 런 설정 payload를 전달한다', async () => {
  const dom = installMockDom();

  try {
    const { StartLoadoutView } = await import('../src/ui/title/StartLoadoutView.js');
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);
    let startArgs = null;

    view.show({
      weapons: [{ id: 'magic_bolt', name: '마법탄', behaviorId: 'targetProjectile' }],
      accessories: [{ id: 'ring_of_speed', name: '속도의 반지' }],
      archetypes: [{ id: 'vanguard', name: 'Vanguard' }, { id: 'spellweaver', name: 'Spellweaver' }],
      riskRelics: [{ id: 'glass_censer', name: 'Glass Censer' }],
      stages: [{ id: 'ash_plains', name: 'Ash Plains' }, { id: 'ember_hollow', name: 'Ember Hollow' }],
      selectedWeaponId: 'magic_bolt',
      selectedStartAccessoryId: 'ring_of_speed',
      selectedArchetypeId: 'spellweaver',
      selectedRiskRelicId: 'glass_censer',
      ascensionChoices: [{ level: 0, name: 'A0' }, { level: 3, name: 'A3' }],
      selectedAscensionLevel: 3,
      selectedStageId: 'ember_hollow',
      selectedSeedMode: 'custom',
      selectedSeedText: 'ashen-seed',
      canStart: true,
      onStart: (...args) => {
        startArgs = args;
      },
      onCancel: () => {},
    });

    view._el?.querySelector?.('[data-action="start"]')?.click();

    assert.deepEqual(startArgs, ['magic_bolt', {
      ascensionLevel: 3,
      startAccessoryId: 'ring_of_speed',
      archetypeId: 'spellweaver',
      riskRelicId: 'glass_censer',
      stageId: 'ember_hollow',
      seedMode: 'custom',
      seedText: 'ashen-seed',
    }], 'StartLoadoutView가 확장된 런 설정 payload를 전달하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
