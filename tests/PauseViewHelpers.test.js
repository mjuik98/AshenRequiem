import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PauseViewHelpers]');

const { test, summary } = createRunner('PauseViewHelpers');

let pauseViewBindings = null;
let pauseViewTooltip = null;

try {
  pauseViewBindings = await import('../src/ui/pause/pauseViewBindings.js');
} catch (error) {
  pauseViewBindings = { error };
}

try {
  pauseViewTooltip = await import('../src/ui/pause/pauseViewTooltip.js');
} catch (error) {
  pauseViewTooltip = { error };
}

function getBindingsApi() {
  assert.ok(
    !pauseViewBindings.error,
    pauseViewBindings.error?.message ?? 'src/ui/pause/pauseViewBindings.js가 아직 없음',
  );
  return pauseViewBindings;
}

function getTooltipApi() {
  assert.ok(
    !pauseViewTooltip.error,
    pauseViewTooltip.error?.message ?? 'src/ui/pause/pauseViewTooltip.js가 아직 없음',
  );
  return pauseViewTooltip;
}

function makeFakeClassList(initial = []) {
  const values = new Set(initial);
  return {
    toggle(name, active) {
      if (active) values.add(name);
      else values.delete(name);
    },
    contains(name) {
      return values.has(name);
    },
  };
}

function makeFakeTab(name) {
  return {
    dataset: { tabName: name },
    classList: makeFakeClassList(name === 'loadout' ? ['active'] : []),
    attributes: new Map(),
    tabIndex: 0,
    setAttribute(key, value) {
      this.attributes.set(key, value);
    },
    getAttribute(key) {
      return this.attributes.get(key);
    },
  };
}

function makeFakePanel(id) {
  return {
    id,
    classList: makeFakeClassList(id === 'pv-tab-loadout' ? ['active'] : []),
  };
}

test('pause helper modules expose tab, option, and tooltip helpers', () => {
  const bindingsApi = getBindingsApi();
  const tooltipApi = getTooltipApi();

  assert.equal(typeof bindingsApi.applyPauseTabState, 'function', 'applyPauseTabState가 없음');
  assert.equal(typeof bindingsApi.emitPauseOptionsChange, 'function', 'emitPauseOptionsChange가 없음');
  assert.equal(typeof tooltipApi.positionPauseTooltip, 'function', 'positionPauseTooltip가 없음');
  assert.equal(typeof tooltipApi.hidePauseTooltip, 'function', 'hidePauseTooltip가 없음');
});

test('applyPauseTabState는 active 탭과 panel 상태를 동기화한다', () => {
  const { applyPauseTabState } = getBindingsApi();
  const loadoutTab = makeFakeTab('loadout');
  const soundTab = makeFakeTab('sound');
  const loadoutPanel = makeFakePanel('pv-tab-loadout');
  const soundPanel = makeFakePanel('pv-tab-sound');
  const root = {
    querySelectorAll(selector) {
      if (selector === '.pv-tab') return [loadoutTab, soundTab];
      if (selector === '.pv-tab-content') return [loadoutPanel, soundPanel];
      return [];
    },
  };

  applyPauseTabState(root, 'sound');

  assert.equal(loadoutTab.classList.contains('active'), false, '기존 탭 active 상태가 해제되지 않음');
  assert.equal(soundTab.classList.contains('active'), true, '대상 탭이 active 되지 않음');
  assert.equal(loadoutTab.getAttribute('aria-selected'), 'false');
  assert.equal(soundTab.getAttribute('aria-selected'), 'true');
  assert.equal(loadoutTab.tabIndex, -1);
  assert.equal(soundTab.tabIndex, 0);
  assert.equal(loadoutPanel.classList.contains('active'), false, '기존 패널 active 상태가 해제되지 않음');
  assert.equal(soundPanel.classList.contains('active'), true, '대상 패널이 active 되지 않음');
});

test('emitPauseOptionsChange는 콜백에 복제된 옵션 payload를 전달한다', () => {
  const { emitPauseOptionsChange } = getBindingsApi();
  const options = { soundEnabled: true, masterVolume: 70 };
  let received = null;

  emitPauseOptionsChange((payload) => {
    received = payload;
  }, options);

  assert.deepEqual(received, options);
  assert.notEqual(received, options, 'options payload를 그대로 재사용하면 외부 mutate 위험이 남음');
});

test('positionPauseTooltip는 viewport 안쪽으로 left/top 스타일을 갱신한다', () => {
  const { positionPauseTooltip, hidePauseTooltip } = getTooltipApi();
  const tooltip = {
    offsetWidth: 180,
    offsetHeight: 90,
    style: {
      display: 'block',
      left: '0px',
      top: '0px',
    },
  };

  positionPauseTooltip(tooltip, {
    clientX: 380,
    clientY: 160,
    target: {
      getBoundingClientRect() {
        return { right: 380, top: 140, height: 24 };
      },
    },
  }, {
    innerWidth: 420,
    innerHeight: 240,
  });

  assert.equal(typeof tooltip.style.left, 'string');
  assert.equal(typeof tooltip.style.top, 'string');
  assert.equal(Number.parseFloat(tooltip.style.left) <= 232, true, 'tooltip이 viewport 밖으로 밀려남');
  assert.equal(Number.parseFloat(tooltip.style.top) >= 8, true, 'tooltip top clamp가 적용되지 않음');

  hidePauseTooltip(tooltip);
  assert.equal(tooltip.style.display, 'none');
  assert.equal(tooltip.innerHTML, '');
});

summary();
