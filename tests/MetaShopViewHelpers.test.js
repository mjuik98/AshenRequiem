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

test('meta shop helper modules expose model, markup, and style contracts', () => {
  const View = getMetaShopView();
  const model = getMetaShopModel();
  const markup = getMetaShopMarkup();
  const styles = getMetaShopStyles();

  assert.equal(typeof View, 'function', 'MetaShopView class가 export되지 않음');
  assert.equal(typeof model.buildMetaShopViewModel, 'function', 'MetaShop model helper가 없음');
  assert.equal(typeof markup.renderMetaShopMarkup, 'function', 'MetaShop markup helper가 없음');
  assert.equal(typeof styles.ensureMetaShopStyles, 'function', 'MetaShop style helper가 없음');
  assert.equal(typeof styles.META_SHOP_CSS, 'string', 'MetaShop CSS helper가 없음');
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
  assert.equal(Array.isArray(viewModel.completedCards), true, '완료 카드 섹션이 계산되지 않음');

  const html = markupApi.renderMetaShopMarkup(viewModel);
  assert.equal(html.includes('ms-detail-panel'), true, 'MetaShop 상세 패널 markup이 없음');
  assert.equal(html.includes('ms-grid'), true, 'MetaShop grid markup이 없음');
  assert.equal(html.includes('ms-back-btn'), true, 'MetaShop footer back button이 없음');
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

summary();
