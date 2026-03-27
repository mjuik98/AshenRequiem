export const CODEX_LAYOUT_CSS = `
  .cx-root {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    overflow: hidden;
  }

  .cx-panel {
    width: min(840px, 100%);
    max-height: 100%;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .cx-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 16px;
  }
  .cx-header-left { display: flex; align-items: center; gap: 10px; }
  .cx-prog-pill { letter-spacing: 0.5px; }
  .cx-discovery-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding: 0 24px 18px;
  }
  .cx-disc-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    border-radius: 12px;
    border: 0.5px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  }
  .cx-disc-pill.enemy { border-color: rgba(239,83,80,0.24); }
  .cx-disc-pill.weapon { border-color: rgba(212,175,106,0.24); }
  .cx-disc-pill.accessory { border-color: rgba(126,205,232,0.28); }
  .cx-disc-label {
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: rgba(244,237,224,0.46);
  }
  .cx-disc-value {
    font-size: 13px;
    font-weight: 700;
    color: rgba(244,237,224,0.9);
  }

  .cx-tabs {
    display: flex; padding: 0 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .cx-tab {
    padding: 12px 20px; font-size: 11px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(244,237,224,0.4); cursor: pointer;
    border: none; background: none; border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s; margin-bottom: -1px;
  }
  .cx-tab.active { color: #d4af6a; border-bottom-color: #d4af6a; }
  .cx-tab:hover:not(.active) { color: rgba(244,237,224,0.7); }
  .cx-tab-cnt {
    display: inline-block; font-size: 9px; letter-spacing: 0;
    background: rgba(255,255,255,0.08); border-radius: 10px;
    padding: 1px 6px; margin-left: 5px; font-weight: 400;
  }
  .cx-tab.active .cx-tab-cnt {
    background: rgba(212,175,106,0.16); color: rgba(212,175,106,0.6);
  }
  .cx-tab-summary {
    padding: 14px 24px 0;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(244,237,224,0.56);
  }

  .cx-content {
    padding: 22px 26px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .cx-tab-content { display: none; }
  .cx-tab-content.active { display: block; }
  .cx-detail-layout {
    display: grid;
    grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
    gap: 18px;
    align-items: start;
  }
  .cx-detail-column,
  .cx-list-column {
    min-width: 0;
  }
  .cx-summary-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    margin-bottom: 14px;
    border-radius: 14px;
    border: 0.5px solid rgba(255,255,255,0.08);
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  }
  .cx-summary-kicker {
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: rgba(244,237,224,0.35);
  }
  .cx-summary-title {
    margin-top: 4px;
    font-size: 16px;
    font-weight: 700;
    color: rgba(244,237,224,0.9);
  }
  .cx-summary-metrics,
  .cx-summary-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cx-summary-chip {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    border: 0.5px solid rgba(212,175,106,0.2);
    background: rgba(212,175,106,0.08);
    color: rgba(236,212,156,0.9);
    font-size: 10px;
    letter-spacing: 0.5px;
  }
  .cx-summary-chip.muted {
    border-color: rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.05);
    color: rgba(244,237,224,0.45);
  }

  .cx-search-row {
    display: flex; gap: 10px; margin-bottom: 16px;
    align-items: center; flex-wrap: wrap;
  }
  .cx-search {
    flex: 1; min-width: 140px; height: 34px; padding: 0 12px;
    border: 0.5px solid rgba(255,255,255,0.14); border-radius: 8px;
    font-size: 13px; background: rgba(255,255,255,0.05);
    color: rgba(244,237,224,0.9); outline: none;
    transition: border-color 0.15s;
  }
  .cx-search::placeholder { color: rgba(244,237,224,0.25); }
  .cx-search:focus { border-color: rgba(212,175,106,0.4); }
  .cx-tier-filter { display: flex; gap: 6px; flex-wrap: wrap; }
  .cx-tf, .cx-af, .cx-ef {
    padding: 5px 12px; font-size: 11px; border-radius: 20px;
    border: 0.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(244,237,224,0.4); cursor: pointer; transition: all 0.15s;
  }
  .cx-tf.active, .cx-af.active, .cx-ef.active {
    border-color: rgba(212,175,106,0.5); background: rgba(212,175,106,0.1); color: #d4af6a;
  }
  .cx-af.active {
    border-color: rgba(126,205,232,0.55);
    background: rgba(126,205,232,0.12);
    color: #9bd9ec;
  }
  .cx-ef.active {
    border-color: rgba(160,196,255,0.5);
    background: rgba(160,196,255,0.12);
    color: #b8d0ff;
  }
  .cx-tf:hover:not(.active), .cx-af:hover:not(.active), .cx-ef:hover:not(.active) {
    border-color: rgba(255,255,255,0.22); color: rgba(244,237,224,0.7);
  }

  .cx-section-label {
    font-size: 9px; font-weight: 600; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(244,237,224,0.25); margin: 0 0 10px;
  }
  .cx-detail-empty {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .cx-empty-title {
    font-size: 18px;
    font-weight: 700;
    color: rgba(244,237,224,0.9);
  }
  .cx-empty-copy {
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(244,237,224,0.5);
  }
  .cx-records-hero {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }
  .cx-records-hero-card {
    border: 0.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 14px;
    text-align: center;
    background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
  }

  .cx-footer {
    padding: 18px 26px 24px; border-top: 1px solid rgba(255,255,255,0.06);
    text-align: center;
  }
`;
