import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { InputState } from '../src/input/InputState.js';
import { KeyboardAdapter } from '../src/input/KeyboardAdapter.js';
import { TITLE_SCREEN_HTML } from '../src/scenes/title/titleScreenContent.js';
import { createPauseOverlayConfig } from '../src/app/play/playSceneOverlaysService.js';

console.log('\n[InputPauseContracts]');

test('ESC 모달 overlay config는 메인메뉴 콜백을 직접 노출하지 않는다', () => {
  const config = createPauseOverlayConfig({
    world: {
      entities: { player: null },
      run: { runOutcome: null },
    },
    data: {},
    session: {},
    isBlocked: () => false,
    transitionPlayMode: () => {},
    hidePause: () => {},
    onOptionsChange: () => {},
  });
  assert.equal('onMainMenu' in config, false, 'Pause overlay config가 메인메뉴 콜백을 여전히 노출함');
});

test('타이틀 디버그 문구는 제거되고 ESC는 pause action만 남는다', () => {
  assert.equal(TITLE_SCREEN_HTML.includes('디버그:'), false, 'Title 화면에 디버그 안내 문구가 남아 있음');
  assert.equal(TITLE_SCREEN_HTML.includes('sr-only'), false, '타이틀 상태 메시지가 시각적으로 숨겨져 있음');

  const previousWindow = globalThis.window;
  const listeners = new Map();
  globalThis.window = {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      listeners.set(type, entries.filter((entry) => entry !== listener));
    },
  };

  try {
    const adapter = new KeyboardAdapter();
    const state = new InputState();
    adapter.init();

    for (const listener of listeners.get('keydown') ?? []) {
      listener({ key: 'Escape', preventDefault() {} });
    }
    adapter.poll(state);

    assert.equal(state.actions instanceof Set, true, 'InputState.actions가 Set 기반이 아님');
    assert.equal(state.isAction('pause'), true, 'ESC 입력이 pause action으로 변환되지 않음');
    assert.equal(state.isAction('debug'), false, 'debug action 하위 호환이 남아 있음');

    adapter.destroy();
  } finally {
    globalThis.window = previousWindow;
  }
});

test('keyboard adapter는 custom key binding을 pause action에 반영한다', () => {
  const previousWindow = globalThis.window;
  const listeners = new Map();
  globalThis.window = {
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      listeners.set(type, entries.filter((entry) => entry !== listener));
    },
  };

  try {
    const adapter = new KeyboardAdapter({
      keyBindings: {
        pause: ['p'],
      },
    });
    const state = new InputState();
    adapter.init();

    for (const listener of listeners.get('keydown') ?? []) {
      listener({ key: 'p', preventDefault() {} });
    }
    adapter.poll(state);
    assert.equal(state.isAction('pause'), true, 'custom pause binding이 적용되지 않음');

    state.reset();
    for (const listener of listeners.get('keyup') ?? []) {
      listener({ key: 'p' });
    }
    for (const listener of listeners.get('keydown') ?? []) {
      listener({ key: 'Escape', preventDefault() {} });
    }
    adapter.poll(state);
    assert.equal(state.isAction('pause'), false, 'custom pause binding 사용 시 기본 ESC binding이 남아 있으면 안 됨');
    adapter.destroy();
  } finally {
    globalThis.window = previousWindow;
  }
});

summary();
