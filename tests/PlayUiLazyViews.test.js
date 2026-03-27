import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';
import { projectPathExists, readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[PlayUiLazyViews]');

const { test, summary } = createRunner('PlayUiLazyViews');

test('PlayUI는 overlay lazy orchestration을 공용 controller helper에 위임한다', () => {
  const playUiSource = readProjectSource('../src/scenes/play/PlayUI.js');

  assert.equal(projectPathExists('../src/scenes/play/LazyOverlayController.js'), true, 'overlay lazy orchestration helper 파일이 필요함');
  assert.equal(playUiSource.includes("from './LazyOverlayController.js'"), true, 'PlayUI가 공용 LazyOverlayController를 사용해야 함');
});

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

test('PlayUI는 overlay 인스턴스가 아직 없거나 숨겨져 있으면 visible 상태를 false로 보고한다', async () => {
  const { document, restore } = installMockDom();

  try {
    const { PlayUI } = await import('../src/scenes/play/PlayUI.js');

    class StubResultView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show() {
        this.el.style.display = 'flex';
      }
      hide() {
        this.el.style.display = 'none';
      }
      destroy() {}
    }

    class StubLevelUpView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show() {
        this.el.style.display = 'flex';
      }
      hide() {
        this.el.style.display = 'none';
      }
      destroy() {}
    }

    const ui = new PlayUI(document.createElement('div'), {
      loadPauseViewModule: async () => ({ PauseView: class { isVisible() { return false; } destroy() {} } }),
      loadResultViewModule: async () => ({ ResultView: StubResultView }),
      loadLevelUpViewModule: async () => ({ LevelUpView: StubLevelUpView }),
    });

    assert.equal(ui.isLevelUpVisible(), false, 'level-up overlay가 생성 전인데 visible=true로 보이면 안 됨');
    assert.equal(ui.isResultVisible(), false, 'result overlay가 생성 전인데 visible=true로 보이면 안 됨');

    await ui.showLevelUp({ title: 'Level Up' });
    assert.equal(ui.isLevelUpVisible(), true, '표시된 level-up overlay는 visible=true여야 함');
    ui.hideLevelUp();
    assert.equal(ui.isLevelUpVisible(), false, '숨긴 level-up overlay는 visible=false여야 함');

    await ui.showResult({ killCount: 1 }, () => {}, null);
    assert.equal(ui.isResultVisible(), true, '표시된 result overlay는 visible=true여야 함');
    ui.hideResult();
    assert.equal(ui.isResultVisible(), false, '숨긴 result overlay는 visible=false여야 함');
  } finally {
    restore();
  }
});

test('PlayUI는 overlay 모듈을 선행 로드해 런 도중 늦은 fetch 실패를 피한다', async () => {
  const { document, restore } = installMockDom();

  try {
    const { PlayUI } = await import('../src/scenes/play/PlayUI.js');
    let serverAvailable = true;

    class StubResultView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show() {
        this.el.style.display = 'block';
      }
      destroy() {}
    }

    const loaderCalls = [];
    const ui = new PlayUI(document.createElement('div'), {
      loadPauseViewModule: async () => ({ PauseView: class { destroy() {} } }),
      loadLevelUpViewModule: async () => ({ LevelUpView: class { destroy() {} } }),
      loadResultViewModule: async () => {
        loaderCalls.push('result');
        if (!serverAvailable) {
          throw new Error('server down');
        }
        return { ResultView: StubResultView };
      },
    });

    await Promise.resolve();
    await Promise.resolve();
    serverAvailable = false;

    const shown = await ui.showResult({ killCount: 7 }, () => {}, null);

    assert.equal(shown, true, '선행 preload가 없으면 늦은 result module fetch 실패를 피하지 못함');
    assert.equal(loaderCalls.length, 1, 'preload된 result module을 재사용해야 함');
    assert.equal(ui.isResultVisible(), true, 'preload 후에도 result overlay가 표시되어야 함');
  } finally {
    restore();
  }
});

test('PlayUI는 preload 실패 후에도 다음 표시 시 loader를 재시도할 수 있어야 한다', async () => {
  const { document, restore } = installMockDom();

  try {
    const { PlayUI } = await import('../src/scenes/play/PlayUI.js');
    let attempts = 0;

    class StubResultView {
      constructor() {
        this.el = { style: { display: 'none' } };
      }
      show() {
        this.el.style.display = 'block';
      }
      destroy() {}
    }

    const ui = new PlayUI(document.createElement('div'), {
      loadPauseViewModule: async () => ({ PauseView: class { destroy() {} } }),
      loadLevelUpViewModule: async () => ({ LevelUpView: class { destroy() {} } }),
      loadResultViewModule: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error('transient fetch failure');
        }
        return { ResultView: StubResultView };
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    const shown = await ui.showResult({ killCount: 2 }, () => {}, null);

    assert.equal(shown, true, 'preload 실패 후 loader 재시도로 result overlay를 복구해야 함');
    assert.equal(attempts >= 2, true, '실패한 preload promise를 비우고 loader를 다시 호출해야 함');
    assert.equal(ui.isResultVisible(), true, '재시도 성공 후 result overlay가 표시되어야 함');
  } finally {
    restore();
  }
});

test('PlayUI는 overlay 로더 실패를 uncaught promise로 터뜨리지 않고 false를 반환해야 한다', async () => {
  const { document, restore } = installMockDom();

  try {
    const { PlayUI } = await import('../src/scenes/play/PlayUI.js');

    const ui = new PlayUI(document.createElement('div'), {
      loadPauseViewModule: async () => ({ PauseView: class { destroy() {} } }),
      loadLevelUpViewModule: async () => ({ LevelUpView: class { destroy() {} } }),
      loadResultViewModule: async () => {
        throw new Error('still unavailable');
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    const shown = await ui.showResult({ killCount: 0 }, () => {}, null);

    assert.equal(shown, false, '로더 실패는 false로 흡수해 브라우저에 uncaught rejection을 남기면 안 됨');
    assert.equal(ui.isResultVisible(), true, '표시 요청 상태는 유지되어 이후 재시도 조건을 잃지 않아야 함');
  } finally {
    restore();
  }
});

summary();
