import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[MetaShopViewHelpers]');

const { test, summary } = createRunner('MetaShopViewHelpers');

let MetaShopView = null;
let metaShopModel = null;
let metaShopMarkup = null;
let metaShopStyles = null;
let metaShopViewRuntime = null;
let metaShopViewRenderState = null;

try {
  ({ MetaShopView } = await import('../src/ui/metashop/MetaShopView.js'));
} catch (error) {
  MetaShopView = { error };
}

try {
  metaShopModel = await import('../src/ui/metashop/metaShopModel.js');
} catch (error) {
  metaShopModel = { error };
}

try {
  metaShopMarkup = await import('../src/ui/metashop/metaShopMarkup.js');
} catch (error) {
  metaShopMarkup = { error };
}

try {
  metaShopStyles = await import('../src/ui/metashop/metaShopStyles.js');
} catch (error) {
  metaShopStyles = { error };
}

try {
  metaShopViewRuntime = await import('../src/ui/metashop/metaShopViewRuntime.js');
} catch (error) {
  metaShopViewRuntime = { error };
}

try {
  metaShopViewRenderState = await import('../src/ui/metashop/metaShopViewRenderState.js');
} catch (error) {
  metaShopViewRenderState = { error };
}

function getMetaShopView() {
  assert.ok(
    !MetaShopView?.error,
    MetaShopView?.error?.message ?? 'src/ui/metashop/MetaShopView.js가 아직 없음',
  );
  return MetaShopView;
}

function getMetaShopModel() {
  assert.ok(
    !metaShopModel.error,
    metaShopModel.error?.message ?? 'src/ui/metashop/metaShopModel.js가 아직 없음',
  );
  return metaShopModel;
}

function getMetaShopMarkup() {
  assert.ok(
    !metaShopMarkup.error,
    metaShopMarkup.error?.message ?? 'src/ui/metashop/metaShopMarkup.js가 아직 없음',
  );
  return metaShopMarkup;
}

function getMetaShopStyles() {
  assert.ok(
    !metaShopStyles.error,
    metaShopStyles.error?.message ?? 'src/ui/metashop/metaShopStyles.js가 아직 없음',
  );
  return metaShopStyles;
}

function getMetaShopViewRuntime() {
  assert.ok(
    !metaShopViewRuntime.error,
    metaShopViewRuntime.error?.message ?? 'src/ui/metashop/metaShopViewRuntime.js가 아직 없음',
  );
  return metaShopViewRuntime;
}

function getMetaShopViewRenderState() {
  assert.ok(
    !metaShopViewRenderState.error,
    metaShopViewRenderState.error?.message ?? 'src/ui/metashop/metaShopViewRenderState.js가 아직 없음',
  );
  return metaShopViewRenderState;
}

test('meta shop helper modules expose model, markup, and style contracts', () => {
  const View = getMetaShopView();
  const model = getMetaShopModel();
  const markup = getMetaShopMarkup();
  const styles = getMetaShopStyles();
  const runtime = getMetaShopViewRuntime();
  const renderState = getMetaShopViewRenderState();

  assert.equal(typeof View, 'function', 'MetaShopView class가 export되지 않음');
  assert.equal(typeof model.buildMetaShopViewModel, 'function', 'MetaShop model helper가 없음');
  assert.equal(typeof markup.renderMetaShopMarkup, 'function', 'MetaShop markup helper가 없음');
  assert.equal(typeof styles.ensureMetaShopStyles, 'function', 'MetaShop style helper가 없음');
  assert.equal(typeof styles.META_SHOP_CSS, 'string', 'MetaShop CSS helper가 없음');
  assert.equal(typeof runtime.bindMetaShopViewRuntime, 'function', 'MetaShop runtime binding helper가 없음');
  assert.equal(typeof renderState.renderMetaShopShell, 'function', 'MetaShop shell render helper가 없음');
  assert.equal(typeof renderState.syncMetaShopShellState, 'function', 'MetaShop shell sync helper가 없음');
});

test('meta shop styles keep the panel as the scroll container', () => {
  const styles = getMetaShopStyles();

  assert.match(styles.META_SHOP_CSS, /\.ms-root\s*\{[\s\S]*overflow:\s*hidden;/, 'MetaShop root가 패널 외부 스크롤을 차단하지 않음');
  assert.match(styles.META_SHOP_CSS, /\.ms-panel\s*\{[\s\S]*max-height:\s*calc\(100vh - 48px\);/, 'MetaShop panel 높이 제한이 없어 상단 복귀가 불안정함');
  assert.match(styles.META_SHOP_CSS, /\.ms-panel\s*\{[\s\S]*overflow-y:\s*auto;/, 'MetaShop panel이 자체 스크롤 컨테이너가 아님');
});

test('meta shop styles keep panel scrolling even after shared subscreen css is injected later', () => {
  const styles = getMetaShopStyles();

  assert.match(
    styles.META_SHOP_CSS,
    /\.ms-panel\.ss-panel\s*\{[\s\S]*overflow-y:\s*auto;/,
    'MetaShop panel이 later .ss-panel override 이후에도 스크롤을 강제하지 않음',
  );
});

test('meta shop model and markup keep purchase availability and shared footer contract', () => {
  const modelApi = getMetaShopModel();
  const markupApi = getMetaShopMarkup();

  const viewModel = modelApi.buildMetaShopViewModel(makeSessionState({
    meta: {
      currency: 15,
      permanentUpgrades: {
        max_health: 1,
      },
    },
  }));

  assert.equal(Array.isArray(viewModel.cards), true, 'MetaShop 카드 모델 배열이 없음');
  assert.equal(viewModel.cards.some((entry) => entry.canAfford), true, '구매 가능 카드가 계산되지 않음');
  assert.equal(viewModel.selectedCard?.id, 'perm_hp', '첫 구매 가능 카드가 기본 선택되지 않음');
  assert.equal(Array.isArray(viewModel.availableCards), true, '구매 가능 카드 섹션이 계산되지 않음');
  assert.equal(Array.isArray(viewModel.lockedCards), true, '재화 부족 카드 섹션이 계산되지 않음');
  assert.equal(Array.isArray(viewModel.completedCards), true, '완료 카드 섹션이 계산되지 않음');
  assert.equal(typeof viewModel.visibleCount, 'number', '현재 필터 결과 수가 계산되지 않음');
  assert.equal(typeof viewModel.selectedCard?.maxCostToFinish, 'number', '상세 패널 총 비용이 계산되지 않음');
  assert.equal(typeof viewModel.selectedCard?.affordablePurchaseCount, 'number', '상세 패널 추가 구매 횟수가 계산되지 않음');
  assert.equal(typeof viewModel.roadmapGoal?.title, 'string', 'MetaShop model이 roadmap goal을 노출하지 않음');

  const html = markupApi.renderMetaShopMarkup(viewModel);
  assert.equal(html.includes('ms-toolbar'), true, 'MetaShop toolbar markup이 없음');
  assert.equal(html.includes('ms-detail-panel'), true, 'MetaShop 상세 패널 markup이 없음');
  assert.equal(html.includes('ms-grid'), true, 'MetaShop grid markup이 없음');
  assert.equal(html.includes('ms-back-btn'), true, 'MetaShop footer back button이 없음');
  assert.equal(html.includes('ms-roadmap-chip'), true, 'MetaShop toolbar가 roadmap goal chip을 렌더하지 않음');
});

test('meta shop model falls back to the first unfinished card when nothing is affordable', () => {
  const modelApi = getMetaShopModel();

  const viewModel = modelApi.buildMetaShopViewModel(makeSessionState({
    meta: {
      currency: 0,
      permanentUpgrades: {},
    },
  }));

  assert.equal(viewModel.selectedCard?.id, 'perm_hp', '구매 불가 상태에서 첫 미완료 카드가 선택되지 않음');
});

test('meta shop model exposes category, sorting, and state sections for operability', () => {
  const modelApi = getMetaShopModel();

  const session = makeSessionState({
    meta: {
      currency: 15,
      permanentUpgrades: {
        perm_damage: 5,
      },
    },
  });

  const allViewModel = modelApi.buildMetaShopViewModel(session);
  const economyViewModel = modelApi.buildMetaShopViewModel(session, {
    activeCategory: 'economy',
    activeSort: 'price',
  });

  assert.equal(allViewModel.affordableCards.some((card) => card.id === 'perm_hp'), true, '구매 가능 섹션이 계산되지 않음');
  assert.equal(allViewModel.lockedCards.some((card) => card.id === 'perm_cooldown'), true, '재화 부족 섹션이 계산되지 않음');
  assert.equal(allViewModel.completedCards.some((card) => card.id === 'perm_damage'), true, '완료 섹션이 계산되지 않음');
  assert.equal(economyViewModel.activeCategory, 'economy', '카테고리 상태가 반영되지 않음');
  assert.equal(economyViewModel.activeSort, 'price', '정렬 상태가 반영되지 않음');
  assert.equal(economyViewModel.visibleCount > 0, true, '필터 결과 수가 계산되지 않음');
  assert.equal(economyViewModel.cards.every((card) => card.category === 'economy'), true, '카테고리 필터가 적용되지 않음');
});

test('MetaShopView orchestrates helper output and binds purchase/back events', () => {
  const View = getMetaShopView();
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const purchases = [];
    const backs = [];
    const view = new View(container);
    const session = makeSessionState({
      meta: {
        currency: 999,
        permanentUpgrades: {},
      },
    });

    view.show(session, (upgradeId) => purchases.push(upgradeId), () => backs.push('back'));

    const firstEnabled = view.el.querySelector('.ms-buy-btn:not([disabled])');
    const backButton = view.el.querySelector('.ms-back-btn');
    firstEnabled?.click();
    backButton?.click();

    assert.equal(view.el.innerHTML.includes('ms-grid'), true, 'MetaShopView가 helper markup을 렌더링하지 않음');
    assert.equal(purchases.length > 0, true, 'MetaShopView가 purchase event를 연결하지 않음');
    assert.deepEqual(backs, ['back'], 'MetaShopView가 back event를 연결하지 않음');
  } finally {
    restore();
  }
});

test('MetaShopView keeps the selected upgrade across refresh when it still exists', () => {
  const View = getMetaShopView();
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new View(container);
    const session = makeSessionState({
      meta: {
        currency: 999,
        permanentUpgrades: {},
      },
    });

    view.show(session, () => {}, () => {});

    const selectButtons = view.el.querySelectorAll('.ms-select-btn');
    selectButtons[1]?.click();
    view.refresh(session);

    assert.equal(view._selectedUpgradeId, 'perm_speed', 'refresh 이후 선택 업그레이드가 유지되지 않음');
    assert.equal(view.el.innerHTML.includes('is-selected'), true, '선택 카드 상태가 markup에 반영되지 않음');
  } finally {
    restore();
  }
});

test('MetaShopView keeps the panel scroll position across refresh', () => {
  const View = getMetaShopView();
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new View(container);
    const session = makeSessionState({
      meta: {
        currency: 999,
        permanentUpgrades: {},
      },
    });

    view.show(session, () => {}, () => {});

    const panel = view.el.querySelector('.ms-panel');
    panel.scrollTop = 240;
    view.refresh(session);

    assert.equal(view.el.querySelector('.ms-panel')?.scrollTop, 240, 'refresh 이후 Meta Shop panel 스크롤 위치가 초기화됨');
  } finally {
    restore();
  }
});

test('MetaShopView keeps category and sort state across refresh', () => {
  const View = getMetaShopView();
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new View(container);
    const session = makeSessionState({
      meta: {
        currency: 999,
        permanentUpgrades: {},
      },
    });

    view.show(session, () => {}, () => {});

    const filterButtons = view.el.querySelectorAll('.ms-filter-tab');
    const sortButtons = view.el.querySelectorAll('.ms-sort-btn');
    filterButtons[2]?.click();
    sortButtons[1]?.click();
    view.refresh(session);

    assert.equal(view._activeCategory, 'survival', 'refresh 이후 카테고리 상태가 유지되지 않음');
    assert.equal(view._activeSort, 'price', 'refresh 이후 정렬 상태가 유지되지 않음');
    assert.equal(view.el.innerHTML.includes('ms-state-section'), true, '상태별 섹션 markup이 렌더링되지 않음');
  } finally {
    restore();
  }
});

summary();
