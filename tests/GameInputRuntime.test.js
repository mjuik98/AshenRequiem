import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { createGameInput } from '../src/core/gameInputRuntime.js';

console.log('\n[GameInputRuntime]');

const { test, summary } = createRunner('GameInputRuntime');

test('createGameInput는 forceTouchHud query flag가 있으면 touch adapter를 강제로 추가한다', () => {
  const calls = [];

  class FakeInputManager {
    addAdapter(adapter) {
      calls.push(adapter.kind);
    }
  }

  class FakeKeyboardAdapter {
    constructor() {
      this.kind = 'keyboard';
    }
  }

  class FakeTouchAdapter {
    constructor() {
      this.kind = 'touch';
    }
  }

  createGameInput({
    canvas: {},
    host: {
      location: { search: '?forceTouchHud=1' },
    },
    options: {},
    inputManagerCtor: FakeInputManager,
    keyboardAdapterCtor: FakeKeyboardAdapter,
    touchAdapterCtor: FakeTouchAdapter,
  });

  assert.deepEqual(calls, ['keyboard', 'touch'], 'forceTouchHud query flag가 touch adapter를 활성화하지 않음');
});

test('createGameInput는 gamepad adapter를 기본 입력 surface에 포함할 수 있다', () => {
  const calls = [];

  class FakeInputManager {
    addAdapter(adapter) {
      calls.push(adapter.kind);
    }
  }

  class FakeKeyboardAdapter {
    constructor() {
      this.kind = 'keyboard';
    }
  }

  class FakeGamepadAdapter {
    constructor() {
      this.kind = 'gamepad';
    }
  }

  createGameInput({
    canvas: {},
    host: { navigator: { getGamepads() { return []; } } },
    options: {},
    inputManagerCtor: FakeInputManager,
    keyboardAdapterCtor: FakeKeyboardAdapter,
    gamepadAdapterCtor: FakeGamepadAdapter,
    touchAdapterCtor: class FakeTouchAdapter {
      constructor() {
        this.kind = 'touch';
      }
    },
  });

  assert.deepEqual(calls, ['keyboard', 'gamepad'], 'gamepad adapter가 기본 입력 경로에 등록되지 않음');
});

test('createGameInput는 keyboard adapter에도 runtime host를 전달한다', () => {
  const host = { location: { search: '' } };
  const calls = [];

  class FakeInputManager {
    addAdapter(adapter) {
      calls.push(adapter.kind);
    }
  }

  class FakeKeyboardAdapter {
    constructor(options = {}) {
      this.kind = 'keyboard';
      calls.push(options.host);
    }
  }

  createGameInput({
    canvas: {},
    host,
    options: {},
    inputManagerCtor: FakeInputManager,
    keyboardAdapterCtor: FakeKeyboardAdapter,
    touchAdapterCtor: class FakeTouchAdapter {
      constructor() {
        this.kind = 'touch';
      }
    },
  });

  assert.equal(calls[0], host, 'keyboard adapter가 runtime host를 주입받지 않음');
});

summary();
