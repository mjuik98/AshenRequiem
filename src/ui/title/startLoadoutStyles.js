export const START_LOADOUT_VIEW_CSS = `
  .sl-root {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 12;
  }
  .sl-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(5, 3, 8, 0.74);
    backdrop-filter: blur(8px);
  }
  .sl-panel {
    position: relative;
    width: min(760px, calc(100% - 32px));
    padding: 28px;
    border-radius: 24px;
    border: 1px solid rgba(212, 175, 106, 0.28);
    background: linear-gradient(180deg, rgba(18, 12, 28, 0.98) 0%, rgba(9, 7, 15, 0.98) 100%);
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
    color: #f4ede0;
  }
  .sl-eyebrow {
    margin: 0 0 6px;
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(212, 175, 106, 0.7);
  }
  .sl-title {
    margin: 0;
    font-size: 28px;
  }
  .sl-copy {
    margin: 8px 0 18px;
    color: rgba(244, 237, 224, 0.66);
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
  .sl-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .sl-btn {
    min-width: 120px;
    height: 42px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: transparent;
    color: #f4ede0;
    cursor: pointer;
  }
  .sl-btn.primary {
    border-color: rgba(212, 175, 106, 0.7);
    background: linear-gradient(180deg, #d8bb78 0%, #9a7130 100%);
    color: #140d03;
    font-weight: 700;
  }
  .sl-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  .sl-btn.ghost:hover,
  .sl-btn.ghost:focus-visible {
    border-color: rgba(255, 255, 255, 0.32);
    background: rgba(255, 255, 255, 0.06);
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
