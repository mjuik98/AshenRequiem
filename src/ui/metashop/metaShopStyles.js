import { SUBSCREEN_SHARED_CSS } from '../shared/subscreenTheme.js';

export const META_SHOP_STYLE_ID = 'metashop-styles';

export const META_SHOP_CSS = `
  ${SUBSCREEN_SHARED_CSS}

  .ms-root {
    align-items: flex-start;
    font-family: 'Noto Serif KR', 'Segoe UI', sans-serif;
  }
  .ms-panel {
    width: min(820px, 100%);
  }
  .ms-header {
    margin-bottom: 0;
  }
  .ms-currency-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(255,213,79,0.07);
    border: 1px solid rgba(255,213,79,0.25);
    border-radius: 14px; padding: 12px 18px;
    margin: 20px 26px 24px;
  }
  .ms-currency-label { font-size: 13px; color: #aaa; }
  .ms-currency-value { font-size: 18px; font-weight: 700; color: #ffd54f; }
  .ms-detail-panel {
    margin: 0 26px 22px;
    padding: 20px 22px;
    border-radius: 18px;
    border: 1px solid rgba(217,179,107,0.22);
    background:
      radial-gradient(circle at top right, rgba(255,213,79,0.12), transparent 38%),
      linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025));
  }
  .ms-detail-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .ms-detail-title-wrap {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .ms-detail-icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 28px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ms-detail-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .ms-detail-title {
    margin: 0;
    font-size: 24px;
    line-height: 1.1;
    color: #f6ecd0;
  }
  .ms-detail-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: #a99b8a;
  }
  .ms-detail-level {
    font-size: 13px;
    color: #d8c3a1;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    white-space: nowrap;
  }
  .ms-detail-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .ms-detail-stat {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(0,0,0,0.18);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .ms-detail-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9c8d7a;
    margin-bottom: 6px;
  }
  .ms-detail-value {
    font-size: 15px;
    color: #f4ece0;
  }
  .ms-detail-buy-btn {
    min-height: 46px;
    font-size: 14px;
  }
  .ms-section {
    padding: 0 26px;
    margin-bottom: 22px;
  }
  .ms-section-heading {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #b59d7c;
    margin-bottom: 12px;
  }
  .ms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
    padding: 0;
    margin-bottom: 0;
  }
  .ms-grid-completed {
    opacity: 0.72;
  }
  .ms-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(217,179,107,0.12);
    border-radius: 16px;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .ms-card.can-afford {
    border-color: rgba(255,213,79,0.35);
    background: rgba(255,213,79,0.04);
  }
  .ms-card.is-selected {
    border-color: rgba(255,213,79,0.62);
    background: rgba(255,213,79,0.08);
    box-shadow: 0 10px 32px rgba(0,0,0,0.18);
  }
  .ms-card:hover {
    transform: translateY(-1px);
  }
  .ms-card.is-maxed { opacity: 0.5; }
  .ms-select-btn {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    padding: 16px 14px;
    display: flex;
    gap: 12px;
    text-align: left;
    cursor: pointer;
  }
  .ms-card-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    font-size: 24px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
  }
  .ms-card-copy {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
  }
  .ms-card-topline {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-direction: column;
    gap: 8px;
  }
  .ms-card-name {
    font-size: 13px;
    font-weight: 700;
    color: #eee;
    line-height: 1.4;
    word-break: keep-all;
  }
  .ms-card-level {
    font-size: 11px;
    color: #a89a87;
  }
  .ms-card-cost {
    font-size: 12px;
    color: #f0d69a;
    font-weight: 700;
  }
  .ms-status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ms-status-badge.is-affordable {
    color: #1e1400;
    background: #ffd54f;
    border-color: #ffd54f;
  }
  .ms-status-badge.is-locked {
    color: #d0c2ae;
    background: rgba(255,255,255,0.08);
  }
  .ms-status-badge.is-maxed {
    color: #938677;
    background: rgba(255,255,255,0.04);
  }
  .ms-buy-btn {
    width: 100%; padding: 8px; border: none; border-radius: 8px;
    background: linear-gradient(90deg, #ffd54f, #ffb300);
    color: #1a1200; font-size: 12px; font-weight: 700;
    cursor: pointer; letter-spacing: 0.5px;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .ms-buy-btn:hover:not([disabled]) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(255,213,79,0.35);
  }
  .ms-buy-btn[disabled] {
    background: rgba(255,255,255,0.07);
    color: #555; cursor: default;
  }
  .ms-footer {
    padding: 18px 26px 24px;
    border-top: 1px solid rgba(217,179,107,0.12);
    text-align: center;
  }
  .ms-back-btn {
    min-width: 170px;
  }
  @media (max-width: 640px) {
    .ms-currency-bar {
      margin: 18px 18px 20px;
    }
    .ms-detail-panel,
    .ms-section {
      margin-left: 18px;
      margin-right: 18px;
      padding-left: 0;
      padding-right: 0;
    }
    .ms-detail-head {
      flex-direction: column;
    }
    .ms-detail-stats {
      grid-template-columns: 1fr;
    }
    .ms-footer {
      padding: 18px 18px 22px;
    }
  }
`;

export function ensureMetaShopStyles(documentRef = document) {
  if (documentRef.getElementById(META_SHOP_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = META_SHOP_STYLE_ID;
  style.textContent = META_SHOP_CSS;
  documentRef.head.appendChild(style);
}
