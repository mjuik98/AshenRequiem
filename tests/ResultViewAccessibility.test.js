import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { installMockDom } from './helpers/mockDom.js';

console.log('\n[ResultViewAccessibility]');

const { test, summary } = createRunner('ResultViewAccessibility');

await test('ResultView runtime helper는 delegated runtime entrypoint를 노출한다', async () => {
  const runtime = await import('../src/ui/result/resultViewRuntime.js');
  assert.equal(typeof runtime.bindResultViewRuntime, 'function');
  assert.equal(typeof runtime.renderResultViewRuntime, 'function');
});

await test('ResultView는 dialog 포커스를 잡고 숨길 때 이전 포커스를 복원한다', async () => {
  const dom = installMockDom();

  try {
    const { ResultView } = await import('../src/ui/result/ResultView.js');
    const container = document.createElement('div');
    const previousFocus = document.createElement('button');
    document.body.appendChild(previousFocus);
    previousFocus.focus();

    const view = new ResultView(container);
    view.show({
      outcome: 'defeat',
      survivalTime: 93,
      level: 4,
      killCount: 21,
      bestTime: 88,
      bestLevel: 3,
      bestKills: 18,
      weapons: [],
      unlocks: [],
      recentRuns: [],
      recommendations: [],
    }, () => {}, () => {});

    assert.equal(document.activeElement, view.el.querySelector('.result-card'), 'Result dialog 초기 포커스가 패널에 가지 않음');

    view.hide();
    assert.equal(document.activeElement, previousFocus, 'Result dialog 닫기 후 이전 포커스를 복원하지 않음');
  } finally {
    dom.restore();
  }
});

summary();
