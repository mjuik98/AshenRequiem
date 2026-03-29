import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { InputState } from '../src/input/InputState.js';
import { GamepadAdapter } from '../src/input/GamepadAdapter.js';

console.log('\n[GamepadAdapter]');

const { test, summary } = createRunner('GamepadAdapter');

test('gamepad adapter는 axes와 버튼을 action contract로 변환한다', () => {
  const adapter = new GamepadAdapter({
    host: {
      navigator: {
        getGamepads() {
          return [{
            connected: true,
            axes: [0.6, -0.7],
            buttons: [
              { pressed: false },
              { pressed: true },
              { pressed: false },
              { pressed: false },
              { pressed: false },
              { pressed: false },
              { pressed: false },
              { pressed: true },
            ],
          }];
        },
      },
    },
  });
  const state = new InputState();

  adapter.poll(state);

  assert.equal(state.moveX > 0.5, true, '왼쪽 스틱 X축이 이동으로 변환되지 않음');
  assert.equal(state.moveY < -0.5, true, '왼쪽 스틱 Y축이 이동으로 변환되지 않음');
  assert.equal(state.isAction('confirm'), true, 'A 버튼이 confirm으로 매핑되지 않음');
  assert.equal(state.isAction('pause'), true, 'Start 버튼이 pause로 매핑되지 않음');
});

summary();
