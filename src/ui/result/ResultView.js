/**
 * ResultView — 게임 오버 결과 화면
 *
 * CHANGE: 런 결과 데이터에서 핵심 요약과 일부 결과 섹션만 노출한다.
 *   - 이전 최고 기록과 신기록 배지
 *   - 사용 무기 / Ascension / 획득 재화
 *   - 이번 런 해금 항목
 *   - requestAnimationFrame 부재 환경 가드
 */
import { renderResultViewMarkup } from './resultViewMarkup.js';
import { ensureResultViewStyles } from './resultViewStyles.js';
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';
import {
  bindResultViewRuntime,
  renderResultViewRuntime,
} from './resultViewRuntime.js';

export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    this._dialogRuntime = null;
    this._onRestart = null;
    this._onTitle = null;
    this._runtimeDisposer = bindResultViewRuntime(this);
    ensureResultViewStyles();
    container.appendChild(this.el);
  }

  show(stats, onRestartCallback, onTitleCallback = null) {
    this._onRestart = onRestartCallback;
    this._onTitle = onTitleCallback;
    this._dialogRuntime = replaceDialogRuntime(this._dialogRuntime, {
      root: this.el,
      panelSelector: '.result-card',
    });
    renderResultViewRuntime(this, stats, {
      onTitleCallback,
      renderMarkupImpl: renderResultViewMarkup,
    });

    this.el.style.display = 'flex';
    this._dialogRuntime.focusInitial();
  }

  hide() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime);
    this.el.style.display = 'none';
    this.el.innerHTML = '';
    this._onRestart = null;
    this._onTitle = null;
  }

  destroy() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime, { restoreFocus: false });
    this._runtimeDisposer?.();
    this.el.remove();
  }
}
