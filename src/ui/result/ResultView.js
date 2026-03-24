/**
 * ResultView — 게임 오버 결과 화면
 *
 * CHANGE: 확장된 런 결과 데이터를 기반으로 결과 화면을 리디자인한다.
 *   - 이전 최고 기록과 신기록 배지
 *   - 사용 무기 요약
 *   - 이번 런 해금 항목
 *   - requestAnimationFrame 부재 환경 가드
 */
import { ACTION_BUTTON_SHARED_CSS, renderActionButton } from '../shared/actionButtonTheme.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export class ResultView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'result-overlay';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);
  }

  show(stats, onRestartCallback, onTitleCallback = null) {
    const isVictory = stats.outcome === 'victory';
    const modeClass = isVictory ? 'victory' : 'defeat';
    const minutes = Math.floor(stats.survivalTime / 60);
    const seconds = String(Math.floor(stats.survivalTime % 60)).padStart(2, '0');
    const timeText = `${minutes}:${seconds}`;
    const bestTimeText = stats.bestTime != null
      ? `${Math.floor(stats.bestTime / 60)}:${String(Math.floor(stats.bestTime % 60)).padStart(2, '0')}`
      : null;
    const newBestTime = stats.bestTime != null && stats.survivalTime > stats.bestTime;
    const newBestLevel = stats.bestLevel != null && stats.level > stats.bestLevel;
    const newBestKills = stats.bestKills != null && stats.killCount > stats.bestKills;

    const titleBtn = onTitleCallback
      ? renderActionButton({
          className: 'result-title-btn',
          label: '⌂ 메인 화면으로',
          tone: 'neutral',
        })
      : '';

    this.el.innerHTML = `
      <div class="result-card">
        <div class="result-header ${modeClass}">
          <div class="result-outcome-badge ${modeClass}">
            <div class="result-outcome-dot ${modeClass}"></div>
            <span>${isVictory ? 'The night is broken' : 'The hunt ends here'}</span>
          </div>
          <p class="result-title">${isVictory ? 'VICTORY' : 'DEFEAT'}</p>
          <p class="result-sub">${isVictory ? '모든 보스를 처치했습니다' : '당신의 전투가 기록되었습니다'}</p>
        </div>

        <div class="result-body">
          <div class="result-stat-grid">
            ${this._renderStat(timeText, '생존 시간', newBestTime, bestTimeText ? `이전 기록 ${bestTimeText}` : null)}
            ${this._renderStat(`Lv.${stats.level}`, '최종 레벨', newBestLevel, stats.bestLevel != null ? `이전 기록 Lv.${stats.bestLevel}` : null)}
            ${this._renderStat(
              Number(stats.killCount ?? 0).toLocaleString(),
              '처치 수',
              newBestKills,
              stats.bestKills != null ? `이전 기록 ${Number(stats.bestKills).toLocaleString()}` : null,
            )}
          </div>

          ${this._renderWeapons(stats.weapons)}
          <div class="result-divider"></div>
          ${this._renderCurrency(stats.currencyEarned, stats.totalCurrency)}
          ${stats.newUnlocks?.length ? this._renderUnlocks(stats.newUnlocks) : ''}
        </div>

        <div class="result-footer">
          ${titleBtn}
          ${renderActionButton({
            className: 'result-restart-btn',
            label: '↺ 다시 시작',
            tone: isVictory ? 'success' : 'danger',
            stretch: true,
          })}
        </div>
      </div>
    `;

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

  _renderStat(value, label, isNewBest, prevText) {
    const cardClass = isNewBest ? 'result-stat new-best' : 'result-stat';
    const bestBadge = isNewBest ? '<span class="result-best-badge">★ 신기록</span>' : '';

    let subHtml = '';
    if (isNewBest) {
      subHtml = `<div class="result-stat-sub new-best">${escapeHtml(prevText ?? '')} → 갱신!</div>`;
    } else if (prevText) {
      subHtml = `<div class="result-stat-sub">${escapeHtml(prevText)}</div>`;
    }

    return `
      <div class="${cardClass}">
        <div class="result-stat-val">${escapeHtml(value)}${bestBadge}</div>
        <div class="result-stat-label">${escapeHtml(label)}</div>
        ${subHtml}
      </div>
    `;
  }

  _renderWeapons(weapons) {
    if (!weapons?.length) return '';

    const chips = weapons.map((weapon) => `
      <div class="result-weapon-chip">
        <span class="result-weapon-name">${escapeHtml(weapon.name)}</span>
        <span class="result-weapon-lv">Lv.${escapeHtml(String(weapon.level ?? 1))}</span>
        ${weapon.isEvolved ? '<span class="result-weapon-evo">진화</span>' : ''}
      </div>
    `).join('');

    return `
      <p class="result-section-title">사용한 무기</p>
      <div class="result-weapons">${chips}</div>
      <div class="result-divider"></div>
    `;
  }

  _renderCurrency(earned, total) {
    if (!earned) return '';

    return `
      <p class="result-section-title">이번 런 획득 재화</p>
      <div class="result-currency-row">
        <div>
          <div class="result-currency-label">획득 재화</div>
          <div class="result-currency-earn">+ ${escapeHtml(String(earned))} 💰</div>
        </div>
        ${total != null ? `
          <div class="result-currency-total-wrap">
            <div class="result-currency-label">누적 재화</div>
            <div class="result-currency-total">총 ${escapeHtml(String(total))} 💰</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderUnlocks(unlocks) {
    const chips = unlocks.map((unlock) => `
      <div class="result-unlock-chip">⚡ ${escapeHtml(unlock)}</div>
    `).join('');

    return `
      <div class="result-divider"></div>
      <p class="result-section-title">이번 런 해금</p>
      <div class="result-unlocks">${chips}</div>
    `;
  }

  _injectStyles() {
    if (document.getElementById('result-styles')) return;

    const style = document.createElement('style');
    style.id = 'result-styles';
    style.textContent = `
      ${ACTION_BUTTON_SHARED_CSS}

      .result-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.78);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 40;
        padding: 16px;
      }

      .result-card {
        width: min(520px, 100%);
        background: #0d1117;
        border: 0.5px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        overflow: hidden;
        animation: result-appear 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes result-appear {
        from { transform: scale(0.88) translateY(12px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }

      .result-header {
        padding: 28px 28px 20px;
        text-align: center;
        border-bottom: 2px solid transparent;
      }

      .result-header.defeat { border-bottom-color: #e24b4a; }
      .result-header.victory { border-bottom-color: #639922; }

      .result-outcome-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 14px;
        border-radius: 99px;
        font-size: 11px;
        margin-bottom: 12px;
        border: 0.5px solid transparent;
      }

      .result-outcome-badge.defeat {
        background: rgba(226, 75, 74, 0.12);
        color: #f09595;
        border-color: rgba(226, 75, 74, 0.3);
      }

      .result-outcome-badge.victory {
        background: rgba(99, 153, 34, 0.12);
        color: #97c459;
        border-color: rgba(99, 153, 34, 0.3);
      }

      .result-outcome-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .result-outcome-dot.defeat { background: #e24b4a; }
      .result-outcome-dot.victory { background: #639922; }

      .result-title {
        margin: 0 0 6px;
        font-size: 30px;
        font-weight: 500;
        letter-spacing: 0.12em;
        color: rgba(255, 255, 255, 0.92);
      }

      .result-sub {
        margin: 0;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.45);
      }

      .result-body {
        padding: 20px 24px;
      }

      .result-stat-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 20px;
      }

      .result-stat {
        background: rgba(255, 255, 255, 0.04);
        border: 0.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 12px 10px;
        text-align: center;
      }

      .result-stat.new-best {
        border-color: rgba(239, 159, 39, 0.45);
        background: rgba(239, 159, 39, 0.05);
      }

      .result-stat-val {
        font-size: 18px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.88);
        line-height: 1.2;
        margin-bottom: 4px;
      }

      .result-stat-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.3);
        margin-bottom: 4px;
      }

      .result-stat-sub {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.28);
      }

      .result-stat-sub.new-best {
        color: #97c459;
      }

      .result-best-badge {
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 4px;
        background: rgba(239, 159, 39, 0.15);
        color: #ef9f27;
        border: 0.5px solid rgba(239, 159, 39, 0.3);
        margin-left: 5px;
        vertical-align: middle;
        font-weight: 500;
      }

      .result-section-title {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 0.06em;
        margin: 0 0 8px;
      }

      .result-weapons {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 20px;
      }

      .result-weapon-chip {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border: 0.5px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        font-size: 12px;
      }

      .result-weapon-name { color: rgba(255, 255, 255, 0.7); }
      .result-weapon-lv { font-size: 10px; color: rgba(255, 255, 255, 0.3); }

      .result-weapon-evo {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(99, 153, 34, 0.15);
        color: #97c459;
        border: 0.5px solid rgba(99, 153, 34, 0.3);
      }

      .result-divider {
        height: 0.5px;
        background: rgba(255, 255, 255, 0.07);
        margin: 0 0 20px;
      }

      .result-currency-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border: 0.5px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
      }

      .result-currency-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
        margin-bottom: 4px;
      }

      .result-currency-earn {
        font-size: 18px;
        color: #ef9f27;
        font-weight: 600;
      }

      .result-currency-total-wrap {
        text-align: right;
      }

      .result-currency-total {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.78);
        font-weight: 500;
      }

      .result-unlocks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .result-unlock-chip {
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(239, 159, 39, 0.08);
        border: 0.5px solid rgba(239, 159, 39, 0.18);
        color: rgba(255, 245, 214, 0.88);
        font-size: 12px;
      }

      .result-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 24px 24px;
      }

      .result-title-btn {
        box-shadow: 0 4px 16px rgba(96, 125, 139, 0.28);
      }

      .result-title-btn:hover {
        box-shadow: 0 6px 22px rgba(96, 125, 139, 0.45);
      }

      .result-restart-btn {
        box-shadow: 0 4px 16px rgba(239, 83, 80, 0.3);
      }

      .result-card .result-restart-btn.ui-action-btn--success {
        box-shadow: 0 4px 16px rgba(102, 187, 106, 0.3);
      }

      .result-restart-btn:hover {
        box-shadow: 0 6px 22px rgba(239, 83, 80, 0.5);
      }
    `;

    document.head.appendChild(style);
  }
}
