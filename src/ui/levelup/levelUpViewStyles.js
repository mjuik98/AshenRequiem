import { ACTION_BUTTON_SHARED_CSS } from '../shared/actionButtonTheme.js';
import { MODAL_SHARED_CSS } from '../shared/modalTheme.js';

export const LEVEL_UP_VIEW_CSS = `
  ${MODAL_SHARED_CSS}
  ${ACTION_BUTTON_SHARED_CSS}

  .levelup-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 24px;
    z-index: 30;
    padding: 18px;
  }
  .levelup-backdrop {
    background:
      radial-gradient(circle at 50% 30%, rgba(245,212,124,0.12), transparent 36%),
      rgba(0,0,0,0.78);
  }
  .levelup-stage {
    width: min(960px, 100%);
    max-height: calc(100vh - 36px);
    padding: 24px 24px 20px;
  }
  .levelup-header {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .levelup-eyebrow,
  .levelup-copy {
    text-align: center;
  }
  .levelup-title {
    font-size: 30px; font-weight: 800;
    color: #f5d47c; text-shadow: 0 0 20px rgba(245,212,124,0.55);
    letter-spacing: 0.2em;
    animation: levelup-pulse 0.6s ease-out;
    text-align: center;
  }
  .levelup-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .levelup-uses {
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(12, 18, 28, 0.82);
    font-size: 12px;
    color: #cfd8dc;
  }
  .levelup-mode-btn {
    min-width: 118px;
  }
  .levelup-mode-btn.is-active {
    box-shadow: 0 8px 22px rgba(140, 48, 48, 0.18);
  }
  .levelup-mode-btn:disabled {
    box-shadow: none;
  }
  .chest-title {
    color: #ffb300;
    text-shadow: 0 0 24px #ff8f00, 0 0 48px rgba(255,143,0,0.4);
    letter-spacing: 3px;
  }
  @keyframes levelup-pulse {
    0%   { transform: scale(0.7); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1);   opacity: 1; }
  }
  .levelup-cards {
    display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: stretch;
    margin-top: 20px;
  }
  .levelup-card-shell {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 228px;
  }
  .levelup-card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%; min-height: 276px; padding: 24px 18px 18px;
    background:
      radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 38%),
      linear-gradient(180deg, rgba(22,27,36,0.98), rgba(12,16,24,0.98));
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 18px; cursor: pointer;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s, background 0.18s;
    text-align: left;
    overflow: hidden;
  }
  .levelup-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,255,255,0.1);
  }
  .levelup-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 36px rgba(0,0,0,0.42);
  }
  .levelup-card.is-banish-mode {
    border-color: rgba(255, 138, 128, 0.6);
    box-shadow: inset 0 0 0 1px rgba(255, 138, 128, 0.22);
  }

  .levelup-card.type-weapon::before { background: linear-gradient(90deg, #f7d67f, #d4af6a); }
  .levelup-card.type-stat::before { background: linear-gradient(90deg, #9bd49f, #66bb6a); }
  .levelup-card.type-accessory::before { background: linear-gradient(90deg, #e0b4e6, #ce93d8); }
  .levelup-card.type-slot::before { background: linear-gradient(90deg, #9ccffd, #64b5f6); }
  .levelup-card.type-evolution {
    background: linear-gradient(180deg, rgba(41,25,15,0.98), rgba(18,13,9,0.98));
    border-color: rgba(245, 212, 124, 0.4);
  }
  .levelup-card.type-evolution::before { background: linear-gradient(90deg, #fff2b0, #f5c96a); }
  .levelup-card.type-weapon:hover   { border-color: #ffd54f; box-shadow: 0 14px 32px rgba(255,213,79,0.2); }
  .levelup-card.type-stat:hover     { border-color: #66bb6a; box-shadow: 0 14px 32px rgba(102,187,106,0.18); }
  .levelup-card.type-accessory:hover{ border-color: #ce93d8; box-shadow: 0 14px 32px rgba(206,147,216,0.2); }
  .levelup-card.type-evolution:hover { border-color: #ffe08a; box-shadow: 0 16px 36px rgba(255, 208, 112, 0.22); }
  .levelup-card.type-slot {
    border-color: rgba(100,181,246,0.35);
    background: linear-gradient(160deg, #1a2540, #111b30);
  }
  .levelup-card.type-slot:hover {
    border-color: #64b5f6;
    box-shadow: 0 6px 24px rgba(100,181,246,0.35);
  }

  .card-badge {
    position: absolute; top: -1px; right: -1px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.02em;
    padding: 4px 9px;
    border-radius: 0 11px 0 8px;
    background: rgba(255,255,255,0.08);
    color: #aaa;
  }
  .type-weapon   .card-badge { background: rgba(255,213,79,0.2);  color: #ffd54f; }
  .type-stat     .card-badge { background: rgba(102,187,106,0.2); color: #66bb6a; }
  .type-accessory .card-badge { background: rgba(206,147,216,0.2); color: #ce93d8; }
  .type-slot     .card-badge { background: rgba(100,181,246,0.2);  color: #64b5f6; }
  .card-badge-evolution { background: rgba(255, 224, 138, 0.2) !important; color: #ffe08a !important; }

  .card-icon {
    width: 38px;
    height: 38px;
    margin-bottom: 12px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .type-weapon .card-icon { color: #f7d67f; background: rgba(212,175,106,0.12); border-color: rgba(212,175,106,0.22); }
  .type-accessory .card-icon { color: #e0b4e6; background: rgba(206,147,216,0.12); border-color: rgba(206,147,216,0.22); }
  .type-stat .card-icon { color: #9bd49f; background: rgba(102,187,106,0.12); border-color: rgba(102,187,106,0.22); }
  .type-slot .card-icon { color: #9ccffd; background: rgba(100,181,246,0.12); border-color: rgba(100,181,246,0.24); }
  .type-evolution .card-icon { color: #fff2b0; background: rgba(245,212,124,0.14); border-color: rgba(245,212,124,0.28); }

  .card-name {
    font-size: 16px; font-weight: 800; color: #ffd54f; margin-bottom: 8px; line-height: 1.25;
  }
  .type-stat     .card-name { color: #a5d6a7; }
  .type-accessory .card-name { color: #ce93d8; }
  .type-slot     .card-name { color: #90caf9; }
  .type-evolution .card-name { color: #ffe08a; }

  .card-main {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .card-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-top: 12px;
  }
  .card-progression,
  .card-discovery-chip {
    display: inline-flex;
    align-items: center;
    min-height: 23px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.03em;
  }
  .card-progression {
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(241, 245, 247, 0.88);
  }
  .card-discovery-chip {
    border: 1px solid rgba(126,205,232,0.28);
    background: rgba(126,205,232,0.12);
    color: #bfe7f5;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .card-summary {
    margin-top: 2px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(241, 245, 249, 0.94);
    min-height: 58px;
  }
  .card-priority-hint {
    display: inline-flex;
    align-self: flex-start;
    margin: 2px 0 8px;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: rgba(248,250,252,0.92);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
  .card-priority-hint.is-evolution {
    border-color: rgba(245,212,124,0.36);
    background: rgba(245,212,124,0.12);
    color: #ffe6a6;
  }
  .card-priority-hint.is-synergy {
    border-color: rgba(126,205,232,0.34);
    background: rgba(126,205,232,0.12);
    color: #d9f4ff;
  }
  .card-related-hints {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
  }
  .card-related-chip {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid rgba(212,175,106,0.18);
    background: rgba(212,175,106,0.08);
    color: #f3e5c3;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .card-slot-hint {
    margin-top: 8px; font-size: 10px; color: #64b5f6;
    letter-spacing: 0.12em; text-transform: uppercase;
  }
  .card-footer-actions {
    display: flex;
    justify-content: center;
  }
  .card-reroll-btn {
    width: 100%;
    justify-content: center;
  }
  .card-reroll-btn:hover:not(:disabled) {
    box-shadow: 0 6px 18px rgba(70, 90, 104, 0.16);
  }
  .card-reroll-btn:disabled {
    box-shadow: none;
  }
  @media (max-width: 900px) {
    .levelup-overlay {
      padding: 20px 14px;
      justify-content: flex-start;
      overflow-y: auto;
    }
    .levelup-stage {
      padding: 20px 18px 18px;
    }
    .levelup-cards {
      gap: 12px;
    }
    .levelup-card-shell {
      width: min(100%, 320px);
    }
    .levelup-card {
      min-height: 0;
    }
  }
`;

export function ensureLevelUpViewStyles(documentRef = document) {
  if (documentRef.getElementById('levelup-styles')) return;
  const style = documentRef.createElement('style');
  style.id = 'levelup-styles';
  style.textContent = LEVEL_UP_VIEW_CSS;
  documentRef.head.appendChild(style);
}
