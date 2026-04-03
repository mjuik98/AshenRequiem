import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedPreviewText,
} from '../src/domain/meta/loadout/startLoadoutPresentation.js';

console.log('\n[StartLoadoutView]');

const { test, summary } = createRunner('StartLoadoutView');

await test('StartLoadoutView runtime helper는 delegated binding과 render helper를 노출한다', async () => {
  const runtime = await import('../src/ui/title/startLoadoutViewRuntime.js');
  assert.equal(typeof runtime.bindStartLoadoutViewRuntime, 'function');
  assert.equal(typeof runtime.renderStartLoadoutViewRuntime, 'function');
});

await test('StartLoadoutView는 시작 시 확장된 런 설정 payload를 전달한다', async () => {
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

await test('StartLoadoutView styles는 긴 시작 로드아웃에서도 패널 내부 스크롤을 허용한다', async () => {
  const { START_LOADOUT_VIEW_CSS } = await import('../src/ui/title/startLoadoutStyles.js');

  assert.match(
    START_LOADOUT_VIEW_CSS,
    /\.sl-panel\s*\{[\s\S]*max-height:\s*calc\(100vh\s*-\s*32px\)/,
    'StartLoadoutView 패널에 viewport 기준 max-height가 없어 긴 레이아웃이 화면 밖으로 밀려남',
  );
  assert.match(
    START_LOADOUT_VIEW_CSS,
    /\.sl-panel\s*\{[\s\S]*overflow-y:\s*auto/,
    'StartLoadoutView 패널에 내부 세로 스크롤이 없어 시작 버튼까지 이동할 수 없음',
  );
  assert.match(
    START_LOADOUT_VIEW_CSS,
    /\.sl-panel\s*\{[\s\S]*scrollbar-width:\s*thin/,
    'StartLoadoutView 패널 스크롤바가 공통 타이틀 서브스크린과 같은 얇은 스타일을 유지해야 함',
  );
  assert.match(
    START_LOADOUT_VIEW_CSS,
    /\.sl-root\s*\{[\s\S]*pointer-events:\s*auto/,
    'StartLoadoutView 오버레이 루트가 포인터 이벤트를 잡아야 뒤의 타이틀 메뉴 클릭이 새지 않음',
  );
  assert.match(
    START_LOADOUT_VIEW_CSS,
    /\.sl-actions\s*\{[\s\S]*position:\s*sticky[\s\S]*bottom:\s*0/,
    'StartLoadoutView 하단 액션 영역은 긴 레이아웃에서도 항상 접근 가능해야 함',
  );
});

await test('StartLoadoutView는 dialog 접근성 마크업과 초기 포커스를 제공한다', async () => {
  const dom = installMockDom();

  try {
    const { StartLoadoutView } = await import('../src/ui/title/StartLoadoutView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    const view = new StartLoadoutView(container);
    view.show({
      weapons: [{ id: 'magic_bolt', name: '마법탄', behaviorId: 'targetProjectile' }],
      canStart: true,
      onStart: () => {},
      onCancel: () => {},
    });

    assert.equal(view._el.innerHTML.includes('aria-describedby="sl-copy"'), true, 'dialog 설명 연결이 없음');
    assert.equal(view._el.innerHTML.includes('id="sl-copy"'), true, 'dialog 설명 요소 id가 없음');
    assert.equal(view._el.innerHTML.includes('tabindex="-1"'), true, 'dialog 패널이 키보드 포커스를 받을 수 없음');
    assert.equal(document.activeElement, view._el.querySelector('.sl-panel'), 'dialog를 열어도 초기 포커스가 패널 내부로 이동하지 않음');

    view.hide();
    assert.equal(document.activeElement, previousFocus, 'dialog를 닫은 뒤 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

await test('StartLoadoutView는 선택으로 재렌더되어도 패널 스크롤 위치를 유지한다', async () => {
  const dom = installMockDom();

  try {
    const { StartLoadoutView } = await import('../src/ui/title/StartLoadoutView.js');
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);

    view.show({
      weapons: [{ id: 'magic_bolt', name: '마법탄', behaviorId: 'targetProjectile' }],
      accessories: [{ id: 'ring_of_speed', name: '속도의 반지' }],
      archetypes: [{ id: 'vanguard', name: 'Vanguard' }],
      riskRelics: [{ id: 'glass_censer', name: 'Glass Censer' }],
      stages: [{ id: 'ash_plains', name: 'Ash Plains' }, { id: 'ember_hollow', name: 'Ember Hollow' }],
      canStart: true,
      onStart: () => {},
      onCancel: () => {},
    });

    const panel = view._el.querySelector('.sl-panel');
    panel.scrollTop = 320;

    view._el.querySelector('[data-stage-id="ember_hollow"]')?.click();

    assert.equal(view._el.querySelector('.sl-panel')?.scrollTop, 320, '선택 후 재렌더링이 패널 스크롤 위치를 초기화함');
  } finally {
    dom.restore();
  }
});

await test('StartLoadoutView는 quick start UI 없이 고급 설정 요약만 노출한다', async () => {
  const dom = installMockDom();

  try {
    const { StartLoadoutView } = await import('../src/ui/title/StartLoadoutView.js');
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);

    view.show({
      weapons: [
        { id: 'magic_bolt', name: '마법탄', behaviorId: 'targetProjectile' },
        { id: 'boomerang', name: '부메랑', behaviorId: 'boomerang' },
      ],
      accessories: [{ id: 'ring_of_speed', name: '속도의 반지' }],
      archetypes: [{ id: 'vanguard', name: 'Vanguard' }, { id: 'spellweaver', name: 'Spellweaver' }],
      riskRelics: [{ id: 'glass_censer', name: 'Glass Censer' }],
      stages: [{ id: 'ash_plains', name: 'Ash Plains' }, { id: 'ember_hollow', name: 'Ember Hollow' }],
      advancedSummary: 'A1 · Spellweaver · Ember Hollow',
      recommendedGoals: [{
        icon: '◈',
        title: '재를 가르는 것',
        description: 'ASCENSION 2 이상으로 승리',
        progressText: 'A0 / A2',
      }],
      canStart: true,
      onStart: () => {},
      onCancel: () => {},
    });

    assert.equal(view._el.innerHTML.includes('Quick Start'), false, 'quick start 섹션이 제거되지 않음');
    assert.equal(view._el.innerHTML.includes('data-preset-id='), false, 'quick start preset 버튼이 남아 있으면 안 됨');
    assert.equal(view._el.innerHTML.includes('data-action="toggle-advanced"'), true, '고급 설정 토글이 렌더되지 않음');
    assert.equal(view._el.innerHTML.includes('Recommended Goals'), false, 'recommended goals 섹션은 START GAME 본문에서 제거되어야 함');
    assert.equal(view._el.innerHTML.includes('재를 가르는 것'), false, 'recommended goal 카드가 START GAME 본문에 남아 있으면 안 됨');
    assert.equal(view._el.innerHTML.includes('sl-advanced-heading'), true, '고급 설정 헤더 영역이 별도 행으로 렌더되지 않음');
    assert.equal(view._el.innerHTML.includes('sl-advanced-toggle-copy'), true, '고급 설정 토글 우측 보조 정보 영역이 없음');
    assert.equal(view._el.innerHTML.includes('A1 · Spellweaver · Ember Hollow'), true, '고급 설정 요약이 렌더되지 않음');
  } finally {
    dom.restore();
  }
});

await test('StartLoadoutView는 재계산되는 요약 문구도 공용 presentation helper 규칙을 따른다', async () => {
  const dom = installMockDom();

  try {
    const { StartLoadoutView } = await import('../src/ui/title/StartLoadoutView.js');
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);

    view.show({
      weapons: [{ id: 'magic_bolt', name: '마법탄', behaviorId: 'targetProjectile' }],
      archetypes: [
        { id: 'vanguard', name: 'Vanguard' },
        { id: 'spellweaver', name: 'Spellweaver' },
      ],
      ascensionChoices: [
        { level: 0, name: 'A0' },
        { level: 2, name: 'A2', pressureLabel: 'Pressure ++' },
      ],
      stages: [
        { id: 'ash_plains', name: 'Ash Plains' },
        { id: 'ember_hollow', name: 'Ember Hollow' },
      ],
      canStart: true,
      onStart: () => {},
      onCancel: () => {},
    });

    view._selectedAscensionLevel = 2;
    view._selectedArchetypeId = 'spellweaver';
    view._selectedStageId = 'ember_hollow';
    view._selectedSeedMode = 'custom';
    view._selectedSeedText = 'ashen-seed';
    view._advancedSummary = view._buildAdvancedSummary();
    view._seedPreviewText = view._buildSeedPreviewText();
    view._render();

    assert.equal(
      view._advancedSummary,
      buildStartLoadoutAdvancedSummary({
        ascensionChoices: view._ascensionChoices,
        selectedAscensionLevel: 2,
        archetypes: view._archetypes,
        selectedArchetypeId: 'spellweaver',
        stages: view._stages,
        selectedStageId: 'ember_hollow',
      }),
      '뷰의 advanced summary가 공용 presentation helper 규칙과 다름',
    );
    assert.equal(
      view._seedPreviewText,
      buildStartLoadoutSeedPreviewText({
        seedMode: 'custom',
        seedText: 'ashen-seed',
      }),
      '뷰의 seed preview text가 공용 presentation helper 규칙과 다름',
    );
    assert.equal(view._el.innerHTML.includes('Pressure ++'), true, '공용 helper가 만든 ascension pressure 요약이 렌더되지 않음');
    assert.equal(view._el.innerHTML.includes('Seed ashen-seed'), true, '공용 helper가 만든 seed preview가 렌더되지 않음');
  } finally {
    dom.restore();
  }
});

summary();
