export const PAUSE_LAYOUT_CSS = `
  .pv-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 35;
    font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
    pointer-events: auto;
  }
  .pv-overlay * { pointer-events: auto; }
  .pv-backdrop {
    background: rgba(4,3,10,0.82);
  }
  .pv-panel {
    z-index: 1;
    width: min(960px, calc(100vw - 24px));
    max-height: calc(100vh - 40px);
    background: linear-gradient(160deg, rgba(24,18,36,0.98), rgba(10,8,18,0.99));
    box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 32px 80px rgba(0,0,0,0.7);
  }
  .pv-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .pv-pause-badge { display: flex; align-items: center; gap: 9px; }
  .pv-pause-icon {
    width: 26px; height: 26px;
    border: 1.5px solid rgba(212,175,106,0.55); border-radius: 50%;
    display: flex; align-items: center; justify-content: center; gap: 3px;
  }
  .pv-pbar { width: 3px; height: 9px; background: rgba(212,175,106,0.7); border-radius: 1px; }
  .pv-pause-title { font-size: 12px; font-weight: 700; letter-spacing: 4px; color: #d4af6a; text-transform: uppercase; }
  .pv-run-stats { display: flex; align-items: center; gap: 12px; }
  .pv-run-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .pv-run-val { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.78); line-height: 1; }
  .pv-run-key { font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,0.25); text-transform: uppercase; }
  .pv-run-div { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
  .pv-hp-section { display: flex; align-items: center; gap: 12px; padding: 14px 24px 0; }
  .pv-hp-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: rgba(255,255,255,0.25); width: 16px; flex-shrink: 0; }
  .pv-hp-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .pv-hp-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; position: relative; }
  .pv-hp-fill::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:rgba(255,255,255,0.15); border-radius:4px 4px 0 0; }
  .pv-hp-fill.low { animation: pv-hp-pulse 1.1s ease-in-out infinite; }
  @keyframes pv-hp-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .pv-hp-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .pv-hp-frac { font-size: 11px; color: rgba(255,255,255,0.4); }
  .pv-hp-pct { font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; }
  .pv-hp-warn { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; color: #e74c3c; text-transform: uppercase; animation: pv-hp-pulse 1.1s infinite; }
  .pv-tabs { display: flex; padding: 14px 24px 0; border-bottom: 1px solid rgba(255,255,255,0.06); gap: 0; }
  .pv-tab {
    padding: 10px 18px; font-size: 11px; font-weight: 700; letter-spacing: 2px;
    color: rgba(255,255,255,0.28); cursor: pointer; border: none; background: none;
    border-bottom: 2px solid transparent; transition: all 0.15s; text-transform: uppercase;
    margin-bottom: -1px;
  }
  .pv-tab:hover { color: rgba(255,255,255,0.55); }
  .pv-tab.active { color: #d4af6a; border-bottom-color: #d4af6a; }
  .pv-tab-content { display: none; padding: 18px 24px; animation: pv-fade-up 0.14s ease both; }
  .pv-tab-content.active { display: block; }
  @keyframes pv-fade-up { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .pv-footer { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
  .pv-btn-forfeit { min-width: 132px; }
  .pv-btn-forfeit:hover { box-shadow: 0 8px 22px rgba(120, 34, 34, 0.24); }
  .pv-btn-resume { letter-spacing: 2px; text-transform: uppercase; }
  .pv-btn-resume:hover { box-shadow: 0 8px 24px rgba(212,175,106,0.18); }
  .pv-btn-arrow { width: 0; height: 0; border-style: solid; border-width: 4px 0 4px 7px; border-color: transparent transparent transparent #d4af6a; }
  .pv-kbd { font-size: 10px; font-weight: 700; background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.25); border-radius: 5px; padding: 2px 7px; color: rgba(212,175,106,0.55); letter-spacing: 0; }
  .pv-tooltip { position: fixed; z-index: 9999; pointer-events: none; background: linear-gradient(180deg, rgba(22,18,34,0.98), rgba(12,10,20,0.98)); border: 1px solid rgba(212,175,106,0.25); border-radius: 12px; padding: 11px 13px; font-family: 'Noto Sans KR', 'Segoe UI', sans-serif; font-size: 12px; color: rgba(255,255,255,0.84); min-width: 200px; max-width: 268px; box-shadow: 0 14px 36px rgba(0,0,0,0.62); line-height: 1.5; }
  .pvt-header { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .pvt-lv { font-size: 10px; font-weight: 700; color: #d4af6a; background: rgba(212,175,106,0.12); border-radius: 20px; padding: 1px 7px; border: 1px solid rgba(212,175,106,0.22); }
  .pvt-rarity { font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 7px; }
  .pvt-rarity-rare { color: #d4af6a; background: rgba(212,175,106,0.12); border: 1px solid rgba(212,175,106,0.22); }
  .pvt-rarity-common { color: rgba(200,190,160,0.6); background: rgba(200,190,160,0.08); border: 1px solid rgba(200,190,160,0.15); }
  .pvt-meta { font-size: 11px; color: rgba(255,255,255,0.62); margin-bottom: 5px; line-height: 1.45; }
  .pvt-effect { color: rgba(243,235,214,0.82); }
  .pvt-note { margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: rgba(212,175,106,0.74); }
`;
