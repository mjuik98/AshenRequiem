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
  .ms-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
    padding: 0 26px 0;
    margin-bottom: 28px;
  }
  .ms-card {
    background: rgba(255,255,255,0.045);
    border: 1px solid rgba(217,179,107,0.1);
    border-radius: 16px; padding: 16px 14px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .ms-card.can-afford {
    border-color: rgba(255,213,79,0.35);
    background: rgba(255,213,79,0.04);
  }
  .ms-card:hover {
    transform: translateY(-1px);
  }
  .ms-card.is-maxed { opacity: 0.55; }
  .ms-card-icon { font-size: 26px; text-align: center; }
  .ms-card-body { flex: 1; }
  .ms-card-name { font-size: 13px; font-weight: 700; color: #eee; margin-bottom: 4px; }
  .ms-card-desc { font-size: 11px; color: #999; line-height: 1.5; margin-bottom: 8px; }
  .ms-progress-row { display: flex; align-items: center; gap: 6px; }
  .ms-pips { display: flex; gap: 3px; flex-wrap: wrap; }
  .ms-pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.18);
  }
  .ms-pip.filled { background: #ffd54f; border-color: #ffd54f; }
  .ms-level-label { font-size: 10px; color: #777; white-space: nowrap; }
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
    .ms-grid {
      padding: 0 18px 0;
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
