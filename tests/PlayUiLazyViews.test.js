import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[PlayUiLazyViews]');

const { test, summary } = createRunner('PlayUiLazyViews');

test('PlayUI는 pause/result/level-up overlay를 lazy import해도 요청된 visible 상태를 유지한다', async () => {
  const { document, restore } = installMockDom();

  try {
    const { PlayUI } = await import('../src/scenes/play/PlayUI.js');
    const calls = [];

    class StubPauseView {
      constructor() {
        this._visible = false;
      }
      show(config) {
        this._visible = true;
        calls.push(['pause-show', config.world?.playMode ?? null]);
      }
      hide() {
        this._visible = false;
        calls.push(['pause-hide']);
      }
      isVisible() {
        return this._visible;
      }
      destroy() {}
    }

    class StubResultView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show(stats) {
        this.el.style.display = 'block';
        calls.push(['result-show', stats.killCount ?? 0]);
      }
      destroy() {}
    }

    class StubLevelUpView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show(config) {
        this.el.style.display = 'block';
        calls.push(['level-show', config.title ?? null]);
      }
      hide() {
        this.el.style.display = 'none';
        calls.push(['level-hide']);
      }
      destroy() {}
    }

    const ui = new PlayUI(document.createElement('div'), {
      loadPauseViewModule: async () => ({ PauseView: StubPauseView }),
      loadResultViewModule: async () => ({ ResultView: StubResultView }),
      loadLevelUpViewModule: async () => ({ LevelUpView: StubLevelUpView }),
    });

    const pausePromise = ui.showPause({ world: { playMode: 'paused', player: null } });
    assert.equal(ui.isPaused(), true, 'lazy pause import 중 visible 상태를 잃으면 안 됨');
    await pausePromise;
    assert.equal(ui.isPaused(), true, 'pause view 로드 후 visible 상태가 유지되지 않음');

    const levelPromise = ui.showLevelUp({ title: 'Level Up' });
    assert.equal(ui.isLevelUpVisible(), true, 'lazy level-up import 중 visible 상태를 잃으면 안 됨');
    await levelPromise;
    assert.equal(ui.isLevelUpVisible(), true, 'level-up view 로드 후 visible 상태가 유지되지 않음');

    const resultPromise = ui.showResult({ killCount: 12 }, () => {}, null);
    assert.equal(ui.isResultVisible(), true, 'lazy result import 중 visible 상태를 잃으면 안 됨');
    await resultPromise;
    assert.equal(ui.isResultVisible(), true, 'result view 로드 후 visible 상태가 유지되지 않음');

    assert.deepEqual(calls, [
      ['pause-show', 'paused'],
      ['level-show', 'Level Up'],
      ['result-show', 12],
    ]);
  } finally {
    restore();
  }
});

summary();
