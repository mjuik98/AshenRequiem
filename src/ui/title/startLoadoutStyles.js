import { ACTION_BUTTON_SHARED_CSS } from '../shared/actionButtonTheme.js';
import { MODAL_SHARED_CSS } from '../shared/modalTheme.js';

export const START_LOADOUT_VIEW_CSS = `
  ${MODAL_SHARED_CSS}
  ${ACTION_BUTTON_SHARED_CSS}

  .sl-root {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 12;
  }
  .sl-backdrop {
    background: rgba(5, 3, 8, 0.74);
  }
  .sl-panel {
    width: min(760px, calc(100% - 32px));
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 28px;
    scroll-padding-bottom: 108px;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
  }
  .sl-eyebrow {
    margin: 0 0 6px;
  }
  .sl-title {
    font-size: 31px;
  }
  .sl-copy {
    margin: 8px 0 18px;
  }
  .sl-weapon-block {
    margin-bottom: 18px;
  }
  .sl-ascension-block {
    margin-bottom: 18px;
  }
  .sl-config-block {
    margin-bottom: 18px;
  }
  .sl-section-title {
    margin: 0 0 10px;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(212, 175, 106, 0.74);
  }
  .sl-ascension-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 12px;
  }
  .sl-asc-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.035);
    color: inherit;
    cursor: pointer;
    transition: border-color 0.16s, background 0.16s, transform 0.16s;
  }
  .sl-asc-card:hover,
  .sl-asc-card.selected {
    border-color: rgba(212, 175, 106, 0.56);
    background: rgba(212, 175, 106, 0.12);
    transform: translateY(-1px);
  }
  .sl-asc-level {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #f2cf84;
  }
  .sl-asc-name {
    font-size: 14px;
    font-weight: 700;
  }
  .sl-asc-pressure,
  .sl-asc-reward {
    font-size: 12px;
    line-height: 1.4;
    color: rgba(244, 237, 224, 0.7);
  }
  .sl-asc-summary {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(212, 175, 106, 0.22);
    background:
      linear-gradient(135deg, rgba(212, 175, 106, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
  }
  .sl-asc-summary-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }
  .sl-asc-summary-kicker {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(212, 175, 106, 0.76);
  }
  .sl-asc-summary-title {
    font-size: 14px;
    font-weight: 700;
    color: #f2cf84;
  }
  .sl-asc-summary-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(244, 237, 224, 0.78);
  }
  .sl-asc-summary-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 10px;
    font-size: 12px;
    color: rgba(244, 237, 224, 0.66);
  }
  .sl-empty {
    margin: 0;
    padding: 16px;
    border-radius: 16px;
    border: 1px dashed rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(244, 237, 224, 0.72);
    text-align: center;
  }
  .sl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .sl-inline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }
  .sl-inline-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 88px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.16s, background 0.16s, transform 0.16s;
  }
  .sl-inline-card:hover,
  .sl-inline-card.selected {
    border-color: rgba(212, 175, 106, 0.56);
    background: rgba(212, 175, 106, 0.1);
    transform: translateY(-1px);
  }
  .sl-inline-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    font-size: 20px;
    line-height: 1;
  }
  .sl-inline-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
  }
  .sl-inline-title {
    font-size: 14px;
    font-weight: 700;
  }
  .sl-inline-desc {
    font-size: 12px;
    line-height: 1.45;
    color: rgba(244, 237, 224, 0.7);
  }
  .sl-seed-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }
  .sl-seed-field.inactive {
    opacity: 0.62;
  }
  .sl-seed-label {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(212, 175, 106, 0.74);
  }
  .sl-seed-input {
    width: 100%;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(7, 7, 11, 0.5);
    color: #f4ede0;
    padding: 0 12px;
    outline: none;
  }
  .sl-seed-input:focus {
    border-color: rgba(212, 175, 106, 0.48);
  }
  .sl-seed-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .sl-seed-preview {
    font-size: 12px;
    color: rgba(244, 237, 224, 0.64);
  }
  .sl-goal-block {
    margin: 0 0 18px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(212, 175, 106, 0.18);
    background: rgba(255, 255, 255, 0.025);
  }
  .sl-goal-list {
    display: grid;
    gap: 10px;
  }
  .sl-goal-card {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
  }
  .sl-goal-icon {
    font-size: 18px;
  }
  .sl-goal-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sl-goal-title {
    font-size: 13px;
    font-weight: 700;
  }
  .sl-goal-desc {
    font-size: 12px;
    color: rgba(244, 237, 224, 0.68);
  }
  .sl-goal-meta {
    font-size: 12px;
    color: rgba(242, 207, 132, 0.9);
  }
  .sl-card {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.16s, background 0.16s, transform 0.16s;
  }
  .sl-card:hover,
  .sl-card.selected {
    border-color: rgba(212, 175, 106, 0.56);
    background: rgba(212, 175, 106, 0.1);
    transform: translateY(-1px);
  }
  .sl-card-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .sl-icon {
    font-size: 22px;
  }
  .sl-name {
    font-size: 16px;
    font-weight: 700;
  }
  .sl-tag-row {
    margin-bottom: 10px;
  }
  .sl-tag {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(244, 237, 224, 0.72);
    font-size: 11px;
  }
  .sl-desc {
    margin: 0;
    color: rgba(244, 237, 224, 0.68);
    font-size: 13px;
    line-height: 1.45;
  }
  .sl-advanced-shell {
    margin-top: 18px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.025);
    overflow: hidden;
  }
  .sl-advanced-toggle {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 14px 16px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sl-advanced-label {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(242, 207, 132, 0.78);
  }
  .sl-advanced-summary {
    font-size: 13px;
    color: rgba(244, 237, 224, 0.76);
  }
  .sl-advanced-panel {
    padding: 0 16px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .sl-advanced-shell.closed .sl-advanced-panel {
    display: none;
  }
  .sl-actions {
    margin-top: 20px;
    padding-top: 16px;
    position: sticky;
    bottom: 0;
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(9, 7, 15, 0) 0%, rgba(9, 7, 15, 0.92) 28%, rgba(9, 7, 15, 0.98) 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
  .sl-btn {
    min-width: 128px;
    min-height: 44px;
  }
  .sl-btn-cancel {
    box-shadow: 0 6px 20px rgba(70, 90, 104, 0.16);
  }
  .sl-btn-start {
    box-shadow: 0 8px 24px rgba(154, 113, 48, 0.22);
  }
  .sl-card:focus-visible,
  .sl-inline-card:focus-visible,
  .sl-asc-card:focus-visible,
  .sl-seed-input:focus-visible {
    outline: none;
    border-color: rgba(217, 179, 107, 0.62);
    box-shadow: 0 0 0 2px rgba(217, 179, 107, 0.22);
  }
  @media (max-height: 760px) {
    .sl-panel {
      padding: 22px;
      max-height: calc(100vh - 24px);
    }
    .sl-actions {
      margin-top: 16px;
      padding-top: 12px;
    }
  }
  @media (max-width: 640px) {
    .sl-panel {
      padding: 22px;
    }
    .sl-grid {
      grid-template-columns: 1fr;
    }
    .sl-inline-grid {
      grid-template-columns: 1fr;
    }
    .sl-asc-summary-head {
      flex-direction: column;
      align-items: flex-start;
    }
    .sl-actions {
      flex-direction: column-reverse;
    }
    .sl-btn {
      width: 100%;
    }
  }
`;

export function ensureStartLoadoutStyles(documentRef = document) {
  if (documentRef.getElementById('start-loadout-view-styles')) return;
  const style = documentRef.createElement('style');
  style.id = 'start-loadout-view-styles';
  style.textContent = START_LOADOUT_VIEW_CSS;
  documentRef.head.appendChild(style);
}
