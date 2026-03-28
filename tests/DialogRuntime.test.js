import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[DialogRuntime]');

const { test, summary } = createRunner('DialogRuntime');

await test('bindDialogRuntime는 패널 내부에서 Tab 순환과 Escape close 요청을 처리한다', async () => {
  const dom = installMockDom();

  try {
    const { bindDialogRuntime } = await import('../src/ui/shared/dialogRuntime.js');
    const root = document.createElement('div');
    root.innerHTML = `
      <section class="dialog-panel" tabindex="-1">
        <button type="button" data-action="first">first</button>
        <button type="button" data-action="second">second</button>
      </section>
    `;

    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    let closeCount = 0;
    const runtime = bindDialogRuntime({
      root,
      panelSelector: '.dialog-panel',
      onRequestClose: () => {
        closeCount += 1;
      },
    });

    runtime.focusInitial();
    assert.equal(document.activeElement, root.querySelector('.dialog-panel'), '초기 포커스가 패널에 가지 않음');

    window.dispatch('keydown', {
      key: 'Tab',
      code: 'Tab',
      preventDefault() {},
    });
    assert.equal(document.activeElement?.dataset?.action, 'first', '첫 Tab이 첫 포커스 가능 요소로 이동하지 않음');

    window.dispatch('keydown', {
      key: 'Tab',
      code: 'Tab',
      shiftKey: true,
      preventDefault() {},
    });
    assert.equal(document.activeElement?.dataset?.action, 'second', 'Shift+Tab이 마지막 포커스 가능 요소로 순환하지 않음');

    window.dispatch('keydown', {
      key: 'Escape',
      code: 'Escape',
      preventDefault() {},
    });
    assert.equal(closeCount, 1, 'Escape 입력이 close 요청으로 위임되지 않음');

    runtime.dispose();
    assert.equal(document.activeElement, previousFocus, 'dialog runtime dispose 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

await test('dialogViewLifecycle helper는 dialog runtime 교체와 dispose 정책을 중앙화한다', async () => {
  const dom = installMockDom();

  try {
    const {
      replaceDialogRuntime,
      disposeDialogRuntime,
    } = await import('../src/ui/shared/dialogViewLifecycle.js');

    const calls = [];
    const firstRuntime = {
      dispose(options = {}) {
        calls.push(['dispose-first', options.restoreFocus ?? true]);
      },
    };

    const nextRuntime = { id: 'next' };
    const bindRuntime = (options) => {
      calls.push(['bind', options.panelSelector]);
      return nextRuntime;
    };

    const replaced = replaceDialogRuntime(firstRuntime, {
      root: document.createElement('div'),
      panelSelector: '.panel',
    }, { bindRuntime });

    assert.equal(replaced, nextRuntime, '교체 helper가 새 runtime 인스턴스를 반환해야 함');

    const hidden = disposeDialogRuntime(replaced);
    const destroyed = disposeDialogRuntime(replaced, { restoreFocus: false });

    assert.equal(hidden, null, 'dispose helper는 null을 반환해 호출부 null-reset을 일원화해야 함');
    assert.equal(destroyed, null, 'dispose helper는 destroy 경로에서도 null을 반환해야 함');
    assert.deepEqual(calls, [
      ['dispose-first', false],
      ['bind', '.panel'],
    ]);
  } finally {
    dom.restore();
  }
});

summary();
