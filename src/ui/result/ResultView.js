/**
 * ResultView — 게임 오버 결과 화면
 *
 * CHANGE: 확장된 런 결과 데이터를 기반으로 결과 화면을 리디자인한다.
 *   - 이전 최고 기록과 신기록 배지
 *   - 사용 무기 요약
 *   - 이번 런 해금 항목
 *   - requestAnimationFrame 부재 환경 가드
 */
import { renderResultViewMarkup } from './resultViewMarkup.js';
import { ensureResultViewStyles } from './resultViewStyles.js';
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';

export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    this._dialogRuntime = null;
    this._onRestart = null;
    this._onTitle = null;
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
    this.el.innerHTML = renderResultViewMarkup(stats, { onTitleCallback });

    this.el.querySelector('.result-restart-btn')?.addEventListener('click', () => {
      const onRestart = this._onRestart;
      this.hide();
      onRestart?.();
    });

    if (onTitleCallback) {
      this.el.querySelector('.result-title-btn')?.addEventListener('click', () => {
        const onTitle = this._onTitle;
        this.hide();
        onTitle?.();
      });
    }

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
    this.el.remove();
  }
}
