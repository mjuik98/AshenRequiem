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

export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    ensureResultViewStyles();
    container.appendChild(this.el);
  }

  show(stats, onRestartCallback, onTitleCallback = null) {
    this.el.innerHTML = renderResultViewMarkup(stats, { onTitleCallback });

    this.el.querySelector('.result-restart-btn')?.addEventListener('click', () => {
      this.el.style.display = 'none';
      this.el.innerHTML = '';
      onRestartCallback?.();
    });

    if (onTitleCallback) {
      this.el.querySelector('.result-title-btn')?.addEventListener('click', () => {
        this.el.style.display = 'none';
        this.el.innerHTML = '';
        onTitleCallback();
      });
    }

    this.el.style.display = 'flex';

    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => {
        this.el.querySelector('.result-restart-btn')?.focus();
      });
    }
  }

  destroy() { this.el.remove(); }
}
