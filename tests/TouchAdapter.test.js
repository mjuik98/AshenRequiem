import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { InputState } from '../src/input/InputState.js';
import {
  createTouchHudRuntime,
  syncTouchHudRuntime,
} from '../src/input/touchHudRuntime.js';

console.log('\n[TouchAdapter]');

const { test, summary } = createRunner('TouchAdapter');

test('touch HUD runtime helper는 HUD 생성과 knob 동기화를 독립적으로 제공한다', () => {
  const dom = installMockDom();

  try {
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    let pauseTapped = 0;

    const runtime = createTouchHudRuntime(canvas, {
      onPauseTap(event) {
        event?.preventDefault?.();
        pauseTapped += 1;
      },
    });

    assert.equal(Boolean(runtime.root), true, 'touch HUD root가 생성되지 않음');
    assert.equal(Boolean(runtime.pauseButton), true, 'touch HUD pause button이 생성되지 않음');

    syncTouchHudRuntime(runtime, {
      active: true,
      originX: 30,
      originY: 50,
      currentX: 120,
      currentY: 110,
    });

    assert.equal(runtime.joystickBase.style.display, 'block', '활성 조이스틱이 표시되지 않음');
    assert.equal(runtime.joystickKnob.style.display, 'block', '활성 knob가 표시되지 않음');
    runtime.pauseButton.click();
    assert.equal(pauseTapped, 1, 'pause button이 helper callback을 호출하지 않음');

    runtime.destroy();
    assert.equal(runtime.root.parentNode, null, 'helper destroy가 HUD root를 제거하지 않음');
  } finally {
    dom.restore();
  }
});

test('TouchAdapter는 시각 조이스틱 HUD를 만들고 pause 버튼 입력을 pause action으로 전달한다', async () => {
  const dom = installMockDom();

  try {
    const { TouchAdapter } = await import('../src/input/TouchAdapter.js');
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 300,
      height: 200,
    });
    container.appendChild(canvas);

    const adapter = new TouchAdapter(canvas);
    const state = new InputState();
    adapter.init();

    assert.equal(Boolean(adapter._hudRoot), true, 'touch HUD root가 생성되지 않음');
    assert.equal(Boolean(adapter._pauseButton), true, 'touch pause button이 생성되지 않음');
    assert.equal(Boolean(adapter._joystickBase), true, 'touch joystick base가 생성되지 않음');
    assert.equal(Boolean(adapter._moveGuide), true, 'touch move guide가 생성되지 않음');
    assert.equal(Boolean(adapter._actionGuide), true, 'touch action guide가 생성되지 않음');

    adapter._onTouchStart({
      preventDefault() {},
      changedTouches: [{ identifier: 1, clientX: 40, clientY: 80 }],
    });
    adapter._onTouchMove({
      preventDefault() {},
      changedTouches: [{ identifier: 1, clientX: 90, clientY: 120 }],
    });
    adapter.poll(state);

    assert.equal(state.moveX > 0, true, 'touch joystick이 moveX를 갱신하지 않음');
    assert.equal(state.moveY > 0, true, 'touch joystick이 moveY를 갱신하지 않음');
    assert.equal(Number.parseFloat(adapter._joystickKnob.style.left) <= 100, true, 'joystick knob이 max distance를 넘어 표시되면 안 됨');

    state.reset();
    adapter._pauseButton.click();
    adapter.poll(state);

    assert.equal(state.isAction('pause'), true, 'touch pause button이 pause action을 전달하지 않음');
    assert.equal(adapter._joystickBase.style.display !== 'none', true, '조이스틱 베이스가 표시 상태를 반영하지 않음');

    adapter.destroy();
    assert.equal(adapter._hudRoot.parentNode, null, 'destroy 시 touch HUD가 제거되지 않음');
  } finally {
    dom.restore();
  }
});

summary();
