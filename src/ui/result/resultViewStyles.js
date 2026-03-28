import { ACTION_BUTTON_SHARED_CSS } from '../shared/actionButtonTheme.js';
import { MODAL_SHARED_CSS } from '../shared/modalTheme.js';

export const RESULT_VIEW_CSS = `
  ${MODAL_SHARED_CSS}
  ${ACTION_BUTTON_SHARED_CSS}

  .result-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
    padding: 16px;
  }

  .result-backdrop {
    background: rgba(0, 0, 0, 0.78);
  }

  .result-card {
    width: min(520px, 100%);
    overflow: hidden;
    background: linear-gradient(180deg, rgba(18,12,26,0.98), rgba(10,8,18,0.99));
  }

  .result-header {
    padding: 28px 28px 20px;
    text-align: center;
    border-bottom: 2px solid transparent;
  }

  .result-eyebrow {
    margin-bottom: 10px;
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
    font-weight: 500;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.92);
  }

  .result-sub {
    color: rgba(255, 255, 255, 0.5);
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

  .ash-access-large-text .result-card {
    width: min(580px, 100%);
  }
  .ash-access-large-text .result-title {
    font-size: 34px;
  }
  .ash-access-large-text .result-stat-val {
    font-size: 20px;
  }
  .ash-access-large-text .result-unlock-chip {
    font-size: 13px;
  }
  .ash-access-reduced-motion .result-card {
    animation: none;
  }
`;

export function ensureResultViewStyles(documentRef = document) {
  if (documentRef.getElementById('result-styles')) return;

  const style = documentRef.createElement('style');
  style.id = 'result-styles';
  style.textContent = RESULT_VIEW_CSS;
  documentRef.head.appendChild(style);
}
