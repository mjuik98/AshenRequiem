import { ACTION_BUTTON_SHARED_CSS } from '../shared/actionButtonTheme.js';

export const PAUSE_VIEW_STYLE_ID = 'pauseview-v3-styles';

export const PAUSE_VIEW_CSS = `
  ${ACTION_BUTTON_SHARED_CSS}
  .pv-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: 35;
    font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
    pointer-events: auto;
  }
  .pv-overlay * { pointer-events: auto; }
  .pv-backdrop {
    position: absolute; inset: 0;
    background: rgba(4,3,10,0.82);
    backdrop-filter: blur(3px);
  }
  .pv-panel {
    position: relative; z-index: 1;
    width: min(960px, calc(100vw - 24px));
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: linear-gradient(160deg, rgba(24,18,36,0.98), rgba(10,8,18,0.99));
    border: 1px solid rgba(212,175,106,0.25);
    border-radius: 20px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 32px 80px rgba(0,0,0,0.7);
    animation: pv-enter 0.22s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes pv-enter { from{opacity:0;transform:scale(0.91) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .pv-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px 14px;
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
  .pv-run-stats { display: flex; align-items: center; gap: 14px; }
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
  .pv-loadout-panel { display: grid; grid-template-columns: minmax(0, 0.92fr) minmax(300px, 1.08fr); gap: 16px; align-items: start; }
  .pv-loadout-list { display: flex; flex-direction: column; gap: 10px; }
  .pv-slot-section { padding: 12px 12px 10px; border-radius: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
  .pv-slot-section + .pv-slot-section, .pv-slot-section--acc { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; }
  .pv-slot-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 0 2px; }
  .pv-slot-section-title { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(244,237,224,0.38); }
  .pv-slot-section-icon { width: 14px; height: 14px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9px; }
  .pv-slot-section-icon.weapon { background: rgba(212,175,106,0.18); color: #d4af6a; }
  .pv-slot-section-icon.acc { background: rgba(126,205,232,0.14); color: #7ecde8; }
  .pv-slot-section-icon.locked { background: rgba(255,255,255,0.12); color: rgba(244,237,224,0.7); }
  .pv-slot-section-count { font-size: 10px; color: rgba(244,237,224,0.38); }
  .pv-slot-cards { display: flex; flex-direction: column; gap: 6px; }
  .pv-slot-card {
    display: flex; align-items: center; gap: 9px; width: 100%;
    padding: 9px 11px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
    background: rgba(26,22,38,1); cursor: pointer; text-align: left; color: rgba(244,237,224,0.88);
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .pv-slot-card:hover:not(:disabled) { border-color: rgba(212,175,106,0.3); background: rgba(33,29,46,1); }
  .pv-slot-card:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(212,175,106,0.4); }
  .pv-slot-card.selected, .pv-slot-card[aria-pressed="true"] { border-color: rgba(212,175,106,0.6); background: rgba(212,175,106,0.08); }
  .pv-slot-card.state-empty { opacity: 0.5; border-style: dashed; }
  .pv-slot-card.state-locked { opacity: 0.4; cursor: default; }
  .pv-slot-card.state-evolution-ready { border-color: #d4af6a; }
  .pv-slot-card.state-synergy-active { border-color: rgba(126,205,232,0.35); }
  .pv-slot-card.state-rare { border-color: rgba(206,147,216,0.3); }
  .pv-slot-icon-box { width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); }
  .pv-slot-icon-box.weapon { background: rgba(212,175,106,0.1); border-color: rgba(212,175,106,0.22); }
  .pv-slot-icon-box.acc { background: rgba(126,205,232,0.1); border-color: rgba(126,205,232,0.2); }
  .pv-slot-icon-box.rare-acc { background: rgba(206,147,216,0.1); border-color: rgba(206,147,216,0.22); }
  .pv-slot-icon-glyph { font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; line-height: 1; }
  .pv-slot-icon-glyph.muted { opacity: 0.4; }
  .pv-slot-body { flex: 1; min-width: 0; }
  .pv-slot-name { font-size: 12px; font-weight: 700; color: rgba(244,237,224,0.88); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pv-slot-sub { display: flex; gap: 5px; align-items: center; font-size: 10px; color: rgba(244,237,224,0.38); }
  .pv-slot-type-pill { padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; background: rgba(255,255,255,0.06); color: rgba(244,237,224,0.38); }
  .pv-slot-lv { font-size: 10px; color: #d4af6a; }
  .pv-slot-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .pv-slot-dots { display: flex; gap: 2px; }
  .pv-slot-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); }
  .pv-slot-dot.filled { background: #d4af6a; border-color: #d4af6a; }
  .pv-slot-dot.filled.max { background: #f0d898; }
  .pv-slot-syn-dot { width: 6px; height: 6px; border-radius: 50%; background: #7ecde8; }
  .pv-slot-evo-chip { font-size: 9px; color: #d4af6a; background: rgba(212,175,106,0.12); border: 1px solid rgba(212,175,106,0.28); border-radius: 4px; padding: 1px 5px; font-weight: 700; }
  .pv-loadout-detail { display: flex; flex-direction: column; gap: 12px; min-height: 100%; padding: 16px; border-radius: 16px; background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)); border: 1px solid rgba(212,175,106,0.18); box-shadow: 0 18px 40px rgba(0,0,0,0.28); }
  .pv-loadout-detail-header, .pv-loadout-power, .pv-loadout-linked-items, .pv-loadout-synergy, .pv-loadout-evolution { padding: 0 0 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .pv-loadout-evolution { border-bottom: 0; padding-bottom: 0; }
  .pv-loadout-detail-hero { display: flex; align-items: flex-start; gap: 12px; }
  .pv-loadout-detail-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: rgba(244,237,224,0.92);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .pv-loadout-detail-copy { min-width: 0; flex: 1; }
  .detail-kind-weapon .pv-loadout-detail-icon { background: rgba(212,175,106,0.14); border-color: rgba(212,175,106,0.3); color: #f0d898; }
  .detail-kind-accessory .pv-loadout-detail-icon { background: rgba(126,205,232,0.14); border-color: rgba(126,205,232,0.28); color: #bfe7f5; }
  .detail-kind-empty .pv-loadout-detail-icon,
  .detail-kind-locked .pv-loadout-detail-icon { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: rgba(244,237,224,0.56); }
  .pv-loadout-detail-kind { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(212,175,106,0.65); margin-bottom: 6px; }
  .pv-loadout-detail-name { margin: 0 0 6px; font-size: 22px; line-height: 1.1; color: rgba(255,255,255,0.92); }
  .pv-loadout-detail-summary, .pv-loadout-empty-msg, .pv-loadout-evolution-desc, .pv-loadout-synergy-desc { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.58); }
  .pv-loadout-section-title { margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: rgba(255,255,255,0.42); }
  .pv-loadout-power-lines, .pv-loadout-progress-block, .pv-loadout-link-list, .pv-loadout-synergy-list, .pv-loadout-evolution-list { display: flex; flex-direction: column; gap: 8px; }
  .pv-loadout-progress-block { padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); }
  .variant-status { border-bottom-color: rgba(212,175,106,0.22); }
  .variant-links { border-bottom-color: rgba(126,205,232,0.18); }
  .variant-synergy { border-bottom-color: rgba(126,205,232,0.24); }
  .variant-evolution { border-bottom-color: rgba(212,175,106,0.26); }
  .variant-status .pv-loadout-progress-block { background: linear-gradient(180deg, rgba(212,175,106,0.08), rgba(255,255,255,0.025)); border-color: rgba(212,175,106,0.12); }
  .variant-links .pv-loadout-chip-row,
  .variant-links .pv-loadout-link-list { position: relative; }
  .variant-synergy .pv-loadout-synergy-row { background: linear-gradient(180deg, rgba(126,205,232,0.09), rgba(126,205,232,0.03)); border-color: rgba(126,205,232,0.16); }
  .variant-evolution .pv-loadout-evolution-row { background: linear-gradient(180deg, rgba(212,175,106,0.1), rgba(212,175,106,0.035)); border-color: rgba(212,175,106,0.18); }
  .pv-loadout-meta-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .pv-loadout-meta-icon {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(244,237,224,0.88);
  }
  .pv-loadout-meta-icon.tone-synergy,
  .pv-loadout-req-chip.tone-accessory .pv-loadout-req-icon { background: rgba(126,205,232,0.12); border-color: rgba(126,205,232,0.22); color: #bfe7f5; }
  .pv-loadout-meta-icon.tone-evolution,
  .pv-loadout-req-chip.tone-weapon .pv-loadout-req-icon { background: rgba(212,175,106,0.14); border-color: rgba(212,175,106,0.24); color: #f0d898; }
  .pv-loadout-meta-icon.tone-neutral,
  .pv-loadout-req-chip.tone-neutral .pv-loadout-req-icon { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: rgba(244,237,224,0.7); }
  .pv-loadout-power-row, .pv-loadout-link-row, .pv-loadout-synergy-head, .pv-loadout-evolution-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: rgba(244,237,224,0.78);
  }
  .pv-loadout-power-row span:first-child { color: rgba(244,237,224,0.42); }
  .pv-loadout-power-row span:last-child { color: rgba(244,237,224,0.88); }
  .pv-loadout-row-label {
    color: rgba(244,237,224,0.42);
    flex: 1;
    min-width: 0;
  }
  .pv-loadout-row-value {
    color: rgba(244,237,224,0.88);
    min-width: 88px;
    text-align: right;
    font-weight: 700;
    flex-shrink: 0;
  }
  .pv-loadout-link-key { color: rgba(244,237,224,0.42); }
  .pv-loadout-link-val { color: rgba(244,237,224,0.88); }
  .pv-loadout-evolution-name { color: rgba(244,237,224,0.42); }
  .pv-loadout-synergy-state {
    color: #bfe7f5;
    font-weight: 700;
    letter-spacing: 0.4px;
  }
  .pv-loadout-evolution-state {
    color: #f0d898;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .pv-loadout-synergy-name { color: rgba(244,237,224,0.88); font-weight: 700; }
  .pv-loadout-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .pv-loadout-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 999px; background: rgba(127,201,204,0.12); border: 1px solid rgba(127,201,204,0.2); color: #b7e7ea; font-size: 11px; }
  .pv-loadout-chip.equipped { border-color: rgba(212,175,106,0.28); background: rgba(212,175,106,0.12); color: #f0d9a1; }
  .pv-loadout-chip-meta { color: rgba(255,255,255,0.45); font-size: 10px; }
  .pv-loadout-synergy-row, .pv-loadout-evolution-row {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .pv-loadout-synergy-row.active, .pv-loadout-evolution-row.done { border-color: rgba(212,175,106,0.3); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02); }
  .pv-loadout-synergy-desc { color: rgba(226,243,250,0.72); }
  .pv-loadout-evolution-desc { color: rgba(247,232,199,0.72); }
  .pv-loadout-req-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .pv-loadout-req-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 4px 10px 4px 4px;
    border-radius: 999px;
    gap: 6px;
    background: rgba(12,10,20,0.34);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(244,237,224,0.82);
    font-size: 11px;
  }
  .pv-loadout-req-chip.equipped { border-color: rgba(212,175,106,0.22); background: rgba(212,175,106,0.08); }
  .pv-loadout-req-icon {
    width: 20px;
    height: 20px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.05);
    font-size: 11px;
  }
  .pv-loadout-req-name { color: rgba(244,237,224,0.84); white-space: nowrap; }
  .pv-loadout-evolution-result {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    justify-content: flex-end;
  }
  .pv-loadout-stats-section { margin-bottom: 14px; }
  .pv-stat-bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; }
  .pv-stat-bar-key { color: rgba(244,237,224,0.38); width: 66px; flex-shrink: 0; }
  .pv-stat-bar-track { flex: 1; height: 4px; background: rgba(255,255,255,0.07); border-radius: 2px; }
  .pv-stat-bar-fill { height: 100%; border-radius: 2px; }
  .pv-stat-bar-val { color: rgba(244,237,224,0.88); font-weight: 700; width: 40px; text-align: right; flex-shrink: 0; }
  .pv-stat-bar-status { font-size: 11px; color: #7ecde8; }
  .pv-loadout-level-line { font-size: 11px; color: rgba(244,237,224,0.55); line-height: 1.6; }
  .pv-loadout-lv-block { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); margin-top: 4px; }
  .pv-loadout-lv-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(244,237,224,0.38); margin-bottom: 7px; }
  .pv-loadout-lv-pct { color: #d4af6a; font-weight: 700; }
  .pv-loadout-lv-dots { display: flex; gap: 3px; }
  .pv-loadout-lv-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); }
  .pv-loadout-lv-dot.filled { background: #d4af6a; border-color: #d4af6a; }
  .pv-stats-section { margin-bottom: 20px; }
  .pv-sec-label { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; color: rgba(255,255,255,0.22); text-transform: uppercase; margin-bottom: 10px; }
  .pv-stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
  .pv-stat-cell { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 9px; }
  .pv-sicon { width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0; background: rgba(212,175,106,0.1); color: #d4af6a; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .pv-stat-info { min-width: 0; flex: 1; }
  .pv-stat-key { font-size: 10px; color: rgba(255,255,255,0.28); letter-spacing: 0.3px; margin-bottom: 2px; }
  .pv-stat-val-row { display: flex; align-items: baseline; gap: 4px; }
  .pv-stat-base { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.82); }
  .pv-stat-bonus { font-size: 10px; font-weight: 700; color: #6dba72; }
  .pv-stat-bonus.neg { color: #e74c3c; }
  .pv-stat-unit { font-size: 10px; color: rgba(255,255,255,0.28); }
  .pv-syn-list { display: flex; flex-direction: column; gap: 7px; }
  .pv-syn-row { display: flex; align-items: center; gap: 10px; background: rgba(212,175,106,0.06); border: 1px solid rgba(212,175,106,0.16); border-radius: 9px; padding: 9px 13px; }
  .pv-syn-dot { width: 6px; height: 6px; border-radius: 50%; background: #d4af6a; flex-shrink: 0; }
  .pv-syn-info { flex: 1; min-width: 0; }
  .pv-syn-name { font-size: 12px; font-weight: 600; color: #d4af6a; margin-bottom: 2px; }
  .pv-syn-desc { font-size: 11px; color: rgba(255,255,255,0.32); }
  .pv-syn-bonus { font-size: 11px; font-weight: 700; color: rgba(212,175,106,0.6); background: rgba(212,175,106,0.08); border-radius: 6px; padding: 3px 8px; white-space: nowrap; flex-shrink: 0; }
  .pv-empty-msg { font-size: 12px; color: rgba(255,255,255,0.25); padding: 20px 0; text-align: center; }
  .pv-sound-panel { display: flex; flex-direction: column; gap: 14px; }
  .pv-sound-row { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
  .pv-sound-row-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.78); }
  .pv-audio-slider { width: 100%; accent-color: #d4af6a; }
  .pv-sound-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pv-sound-toggle { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.72); cursor: pointer; }
  .pv-sound-toggle.active { border-color: rgba(212,175,106,0.28); background: rgba(212,175,106,0.08); color: #e5cc90; }
  .pv-sound-toggle-pill { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.08); }
  .pv-sound-note { font-size: 11px; color: rgba(255,255,255,0.35); }
  .pv-footer { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
  .pv-btn-forfeit { min-width: 132px; }
  .pv-btn-forfeit:hover { box-shadow: 0 8px 22px rgba(120, 34, 34, 0.24); }
  .pv-btn-resume { letter-spacing: 2px; text-transform: uppercase; }
  .pv-btn-resume:hover { box-shadow: 0 8px 24px rgba(212,175,106,0.18); }
  .pv-btn-arrow { width: 0; height: 0; border-style: solid; border-width: 4px 0 4px 7px; border-color: transparent transparent transparent #d4af6a; }
  .pv-kbd { font-size: 10px; font-weight: 700; background: rgba(212,175,106,0.1); border: 1px solid rgba(212,175,106,0.25); border-radius: 5px; padding: 2px 7px; color: rgba(212,175,106,0.55); letter-spacing: 0; }
  .pv-tooltip { position: fixed; z-index: 9999; pointer-events: none; background: #12101e; border: 1px solid rgba(212,175,106,0.25); border-radius: 10px; padding: 10px 13px; font-family: 'Segoe UI', sans-serif; font-size: 12px; color: rgba(255,255,255,0.82); min-width: 180px; max-width: 250px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); line-height: 1.5; }
  .pvt-header { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); margin-bottom: 8px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .pvt-lv { font-size: 10px; font-weight: 700; color: #d4af6a; background: rgba(212,175,106,0.12); border-radius: 20px; padding: 1px 7px; border: 1px solid rgba(212,175,106,0.22); }
  .pvt-rarity { font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 7px; }
  .pvt-rarity-rare { color: #d4af6a; background: rgba(212,175,106,0.12); border: 1px solid rgba(212,175,106,0.22); }
  .pvt-rarity-common { color: rgba(200,190,160,0.6); background: rgba(200,190,160,0.08); border: 1px solid rgba(200,190,160,0.15); }
  .pvt-meta { font-size: 11px; color: rgba(255,255,255,0.62); margin-bottom: 5px; line-height: 1.45; }
  .pvt-note { margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 10px; color: rgba(212,175,106,0.74); }
  @media (max-width: 780px) { .pv-loadout-panel { grid-template-columns: 1fr; } }
  @media (max-width: 540px) {
    .pv-stats-grid { grid-template-columns: 1fr 1fr; }
    .pv-sound-toggles { grid-template-columns: 1fr; }
    .pv-footer { flex-direction: column-reverse; }
    .pv-btn-resume, .pv-btn-forfeit { justify-content: center; }
    .pv-loadout-detail-hero { align-items: stretch; }
    .pv-loadout-power-row, .pv-loadout-link-row, .pv-loadout-synergy-head, .pv-loadout-evolution-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .pv-loadout-row-value,
    .pv-loadout-link-val,
    .pv-loadout-synergy-state,
    .pv-loadout-evolution-state {
      min-width: 0;
      text-align: left;
    }
    .pv-loadout-evolution-result { justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pv-panel, .pv-btn-resume, .pv-btn-forfeit, .pv-tab-content { animation: none !important; transition: none !important; }
    .pv-hp-fill.low, .pv-hp-warn { animation: none !important; }
  }
`;
