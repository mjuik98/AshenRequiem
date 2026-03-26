import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';
import { installMockDom } from './helpers/mockDom.js';
import { TitleScene } from '../src/scenes/TitleScene.js';
import { TitleBackgroundRenderer } from '../src/scenes/title/TitleBackgroundRenderer.js';
import {
  attemptWindowClose,
  createTitleStatusController,
} from '../src/scenes/title/titleSceneStatus.js';
import { buildTitleLoadoutConfig } from '../src/scenes/title/titleLoadout.js';
import { TITLE_SCREEN_HTML } from '../src/scenes/title/titleScreenContent.js';
import { MetaShopView } from '../src/ui/metashop/MetaShopView.js';
import { SettingsView } from '../src/ui/settings/SettingsView.js';
import { SETTINGS_VIEW_CSS } from '../src/ui/settings/settingsViewStyles.js';
import {
  SUBSCREEN_BACK_LABEL,
  SUBSCREEN_SHARED_CSS,
  renderSubscreenFooter,
} from '../src/ui/shared/subscreenTheme.js';
import { StartLoadoutView } from '../src/ui/title/StartLoadoutView.js';

console.log('\n[TitleSceneContracts]');

test('시작 무기 선택 뷰와 타이틀 로드아웃 helper는 시작 후보를 계산한다', () => {
  const gameData = {
    weaponData: [
      { id: 'magic_bolt', name: 'Magic Bolt', behaviorId: 'targetProjectile', description: '기본 투사체' },
      { id: 'chain_lightning', name: 'Chain Lightning', behaviorId: 'chainLightning', description: '연쇄 번개' },
      { id: 'arcane_tempest', name: 'Arcane Tempest', behaviorId: 'areaBurst', isEvolved: true },
    ],
  };
  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt', 'chain_lightning'],
      selectedStartWeaponId: 'chain_lightning',
    },
  });
  const config = buildTitleLoadoutConfig(gameData, session, {});
  const { document, restore } = installMockDom();

  try {
    assert.equal(typeof TitleScene, 'function', 'TitleScene가 export되지 않음');
    assert.equal(typeof StartLoadoutView, 'function', 'StartLoadoutView가 export되지 않음');
    assert.deepEqual(
      config.weapons.map((weapon) => weapon.id),
      ['magic_bolt', 'chain_lightning'],
      '타이틀 로드아웃 후보가 해금 비진화 무기로 제한되지 않음',
    );
    assert.equal(config.selectedWeaponId, 'chain_lightning', '타이틀 로드아웃이 session 선택 무기를 복원하지 않음');

    const container = document.createElement('div');
    const view = new StartLoadoutView(container);
    view.show({
      weapons: config.weapons,
      selectedWeaponId: config.selectedWeaponId,
      onStart: () => {},
      onCancel: () => {},
    });

    assert.equal(view._el.innerHTML.includes('시작 무기 선택'), true, '시작 무기 선택 헤더가 없음');
    assert.equal(view._el.innerHTML.includes('시작하기'), true, '시작하기 버튼이 없음');
  } finally {
    restore();
  }
});

test('시작 무기 선택 뷰는 후보가 없으면 시작 버튼을 비활성화한다', () => {
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);
    view.show({
      weapons: [],
      selectedWeaponId: null,
      canStart: false,
      onStart: () => {},
      onCancel: () => {},
    });

    assert.equal(view._el.innerHTML.includes('시작 가능한 기본 무기가 없습니다.'), true, '빈 후보 안내 문구가 없음');
    assert.equal(view._el.innerHTML.includes('data-action="start" type="button" disabled'), true, '시작 버튼이 비활성화되지 않음');
  } finally {
    restore();
  }
});

test('시작 무기 선택 뷰에서 ESC는 취소 버튼과 같은 경로로 타이틀로 복귀한다', () => {
  const { document, window, restore } = installMockDom();
  let cancelCount = 0;

  try {
    const container = document.createElement('div');
    const view = new StartLoadoutView(container);
    view.show({
      weapons: [
        { id: 'magic_bolt', name: 'Magic Bolt', behaviorId: 'targetProjectile', description: '기본 투사체' },
      ],
      selectedWeaponId: 'magic_bolt',
      canStart: true,
      onStart: () => {},
      onCancel: () => {
        cancelCount += 1;
      },
    });

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });

    assert.equal(cancelCount, 1, 'ESC 입력이 취소 콜백을 호출하지 않음');
    assert.equal(view._el.style.display, 'none', 'ESC 입력 후 시작 무기 선택 뷰가 닫히지 않음');
  } finally {
    restore();
  }
});

test('TitleScene 종료 버튼은 활성 상태이며 종료 실패 시 상태 helper가 안내 문구를 갱신한다', () => {
  const liveEl = { textContent: '' };
  const flashEl = { style: { background: '' } };
  const scheduled = [];
  const status = createTitleStatusController(liveEl, flashEl, {
    setTimeoutFn: (callback) => {
      scheduled.push(callback);
      return 1;
    },
  });
  const messages = [];
  const windowRef = {
    closed: false,
    close() {},
    setTimeout(callback) {
      scheduled.push(callback);
      return 2;
    },
  };

  assert.equal(
    TITLE_SCREEN_HTML.includes('data-action="quit" type="button" aria-disabled="true"'),
    false,
    '종료 버튼이 아직 aria-disabled 상태로 남아 있음',
  );
  assert.equal(TITLE_SCREEN_HTML.includes('id="title-live"'), true, '타이틀 상태 메시지 영역이 없음');
  assert.equal(TITLE_SCREEN_HTML.includes('sr-only'), false, '타이틀 상태 메시지가 시각적으로 숨겨져 있음');
  assert.equal(TITLE_SCREEN_HTML.includes('t-hints'), false, '타이틀 하단 조작 힌트 블록이 아직 남아 있음');
  assert.equal(TITLE_SCREEN_HTML.includes('WASD'), false, '타이틀 하단 이동 힌트가 아직 남아 있음');
  assert.equal(TITLE_SCREEN_HTML.includes('또는 <kbd>Space</kbd> 시작'), false, '타이틀 하단 시작 힌트가 아직 남아 있음');

  status.setMessage('대기 중');
  status.pulseFlash();
  scheduled.shift()?.();
  assert.equal(liveEl.textContent, '대기 중', '타이틀 상태 helper가 메시지를 갱신하지 않음');
  assert.equal(flashEl.style.background, 'rgba(255, 242, 216, 0)', '타이틀 플래시 helper가 배경을 복원하지 않음');

  attemptWindowClose({
    windowRef,
    setMessage: (message) => messages.push(message),
    onError: () => {},
  });
  scheduled.shift()?.();

  assert.equal(
    messages.at(-1)?.includes('브라우저가 종료를 차단했습니다.'),
    true,
    '종료 실패 안내 문구가 상태 helper 경로로 노출되지 않음',
  );
});

test('Title runtime view entrypoints are exposed for title flows', () => {
  assert.equal(typeof TitleBackgroundRenderer, 'function', 'TitleBackgroundRenderer가 export되지 않음');
});

test('타이틀 하위 화면 runtime view는 공통 ss-root와 메인 화면 복귀 라벨을 사용한다', () => {
  const footerHtml = renderSubscreenFooter();
  const session = makeSessionState();
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const metaShop = new MetaShopView(container);
    const settings = new SettingsView(container);

    metaShop.show(session, () => {}, () => {});
    settings.show(session, () => {}, () => {});

    assert.equal(footerHtml.includes(SUBSCREEN_BACK_LABEL), true, '공통 footer 기본 복귀 문구가 잘못됨');
    assert.equal(metaShop.el.className.includes('ss-root'), true, 'MetaShopView가 공통 ss-root를 사용하지 않음');
    assert.equal(settings.el.className.includes('ss-root'), true, 'SettingsView가 공통 ss-root를 사용하지 않음');
    assert.equal(metaShop.el.innerHTML.includes(SUBSCREEN_BACK_LABEL), true, 'MetaShop 닫기 문구가 통일되지 않음');
    assert.equal(settings.el.innerHTML.includes(SUBSCREEN_BACK_LABEL), true, 'Settings 닫기 문구가 통일되지 않음');
    assert.equal(metaShop.el.innerHTML.includes('메인화면으로'), false, 'MetaShop에 이전 닫기 문구가 남아 있음');
    assert.equal(settings.el.innerHTML.includes('← 뒤로'), false, 'Settings에 이전 닫기 문구가 남아 있음');
    assert.equal(SETTINGS_VIEW_CSS.includes('.ss-root'), true, 'SettingsView 스타일이 공통 서브스크린 테마를 포함하지 않음');
    assert.equal(SUBSCREEN_SHARED_CSS.includes('.ss-root'), true, '공통 서브스크린 테마 root 스타일이 없음');
  } finally {
    restore();
  }
});

test('Meta Shop과 Settings runtime view는 이전 헤더 문구를 남기지 않는다', () => {
  const { document, restore } = installMockDom();

  try {
    const container = document.createElement('div');
    const metaShop = new MetaShopView(container);
    const settings = new SettingsView(container);

    metaShop.show(makeSessionState(), () => {}, () => {});
    settings.show(makeSessionState(), () => {}, () => {});

    assert.equal(metaShop.el.innerHTML.includes('ms-best-row'), false, 'Meta Shop 헤더에 최고 기록 row가 아직 남아 있음');
    assert.equal(metaShop.el.innerHTML.includes('best.level'), false, 'Meta Shop 헤더가 최고 레벨을 여전히 렌더링함');
    assert.equal(metaShop.el.innerHTML.includes('best.kills'), false, 'Meta Shop 헤더가 킬 수를 여전히 렌더링함');
    assert.equal(metaShop.el.innerHTML.includes('best.survivalTime'), false, 'Meta Shop 헤더가 생존 시간을 여전히 렌더링함');
    assert.equal(settings.el.innerHTML.includes('저장 후 메인 화면으로 복귀'), false, 'Settings 헤더 우측 저장 안내 pill이 아직 남아 있음');
  } finally {
    restore();
  }
});

summary();
