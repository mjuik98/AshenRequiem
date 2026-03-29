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

summary();
