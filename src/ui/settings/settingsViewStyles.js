import { SUBSCREEN_SHARED_CSS } from '../shared/subscreenTheme.js';

export const SETTINGS_VIEW_STYLE_ID = 'sv-styles';

export const SETTINGS_VIEW_CSS = `
  ${SUBSCREEN_SHARED_CSS}

  .sv-root {
    align-items: flex-start;
    padding-top: 28px;
    padding-bottom: 28px;
    font-family: 'Noto Sans KR', 'Segoe UI', sans-serif;
  }
  .sv-panel {
    width: min(780px, calc(100vw - 32px));
    animation: sv-enter 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes sv-enter {
    from { opacity: 0; transform: scale(0.93) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .sv-header {
    align-items: flex-start;
    margin-bottom: 0;
  }
  .sv-header-note { align-self: flex-start; }

  .sv-body {
    display: grid;
    grid-template-columns: 152px 1fr;
    gap: 0;
    min-height: 280px;
    padding: 20px 26px 10px;
  }

  .sv-sidenav {
    padding-right: 18px;
    border-right: 1px solid rgba(217,179,107,0.12);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sv-nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 12px;
    color: rgba(244,237,224,0.52);
    border: 1px solid transparent;
    background: rgba(255,255,255,0.02);
    transition: color 0.15s, background 0.15s, border-color 0.15s, transform 0.15s;
    outline: none;
  }
  .sv-nav-item:hover {
    color: rgba(244,237,224,0.78);
    background: rgba(217,179,107,0.07);
    transform: translateX(1px);
  }
  .sv-nav-item:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.45); }
  .sv-nav-active {
    color: #c9a86c !important;
    background: rgba(199,163,93,0.1) !important;
    border-color: rgba(199,163,93,0.25) !important;
  }
  .sv-nav-icon { display: flex; align-items: center; flex-shrink: 0; }

  .sv-content {
    padding-left: 24px;
    max-height: min(62vh, 560px);
  }
  .sv-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 2.5px;
    color: rgba(199,163,93,0.55);
    text-transform: uppercase;
    margin: 0 0 14px;
  }
  .sv-divider {
    border: none;
    border-top: 0.5px solid rgba(255,255,255,0.07);
    margin: 14px 0;
  }
  .sv-field-label { font-size: 12px; color: rgba(244,237,224,0.5); margin-bottom: 9px; }

  .sv-slider-row { margin-bottom: 16px; }
  .sv-slider-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 7px;
    gap: 8px;
  }
  .sv-slider-label { font-size: 13px; color: rgba(244,237,224,0.8); }
  .sv-slider-desc { font-size: 11px; color: rgba(244,237,224,0.3); }
  .sv-slider-val {
    font-size: 12px;
    font-weight: 500;
    color: #c9a86c;
    min-width: 28px;
    text-align: right;
    flex-shrink: 0;
  }
  .sv-slider {
    width: 100%;
    cursor: pointer;
    accent-color: #c9a86c;
    height: 4px;
  }

  .sv-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 13px;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.03);
    border: 0.5px solid rgba(217,179,107,0.09);
    border-radius: 12px;
    gap: 12px;
  }
  .sv-toggle-info { flex: 1; min-width: 0; }
  .sv-toggle-label { margin: 0; font-size: 13px; color: rgba(244,237,224,0.8); }
  .sv-toggle-desc {
    margin: 2px 0 0;
    font-size: 11px;
    color: rgba(244,237,224,0.35);
    line-height: 1.4;
  }

  .sv-switch {
    width: 40px;
    height: 22px;
    flex-shrink: 0;
    background: rgba(50,45,70,0.8);
    border-radius: 11px;
    position: relative;
    cursor: pointer;
    border: 0.5px solid rgba(255,255,255,0.08);
    transition: background 0.18s;
    outline: none;
  }
  .sv-switch:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.5); }
  .sv-switch-on {
    background: rgba(199,163,93,0.65) !important;
    border-color: rgba(199,163,93,0.4) !important;
  }
  .sv-switch-knob {
    width: 18px;
    height: 18px;
    background: #e8e0d0;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: left 0.18s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  }
  .sv-switch-on .sv-switch-knob { left: 20px; }

  .sv-quality-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 6px;
  }
  .sv-quality-card {
    padding: 11px 9px;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    border: 0.5px solid rgba(217,179,107,0.12);
    background: rgba(255,255,255,0.025);
    transition: all 0.15s;
    outline: none;
  }
  .sv-quality-card:hover { background: rgba(255,255,255,0.055); }
  .sv-quality-card:focus-visible { box-shadow: 0 0 0 2px rgba(199,163,93,0.45); }
  .sv-quality-active {
    border: 1px solid rgba(199,163,93,0.45) !important;
    background: rgba(199,163,93,0.1) !important;
  }
  .sv-quality-name { margin: 0; font-size: 13px; color: rgba(244,237,224,0.65); }
  .sv-quality-active .sv-quality-name { color: #c9a86c; }
  .sv-quality-desc { margin: 4px 0 0; font-size: 10px; color: rgba(244,237,224,0.3); }
  .sv-quality-active .sv-quality-desc { color: rgba(199,163,93,0.55); }

  .sv-info-box {
    margin-top: 12px;
    padding: 9px 13px;
    background: rgba(199,163,93,0.05);
    border: 0.5px solid rgba(199,163,93,0.15);
    border-radius: 7px;
  }
  .sv-info-text { margin: 0; font-size: 11px; color: rgba(199,163,93,0.6); }
  .sv-detail-list {
    margin: 8px 0 0 16px;
    padding: 0;
    color: rgba(244,237,224,0.55);
    font-size: 11px;
    line-height: 1.5;
  }

  .sv-keybind-list { display: flex; flex-direction: column; gap: 6px; }
  .sv-binding-list { display: flex; flex-direction: column; gap: 8px; }
  .sv-binding-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 13px;
    background: rgba(255,255,255,0.025);
    border: 0.5px solid rgba(217,179,107,0.09);
    border-radius: 12px;
  }
  .sv-keybind-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 13px;
    background: rgba(255,255,255,0.025);
    border: 0.5px solid rgba(217,179,107,0.09);
    border-radius: 12px;
  }
  .sv-keybind-action { font-size: 13px; color: rgba(244,237,224,0.5); }
  .sv-keybind-right {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .sv-binding-slot {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sv-binding-slot-label {
    font-size: 10px;
    color: rgba(244,237,224,0.36);
  }
  .sv-binding-select {
    min-width: 108px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 0.5px solid rgba(199,163,93,0.2);
    background: rgba(10,10,16,0.7);
    color: rgba(244,237,224,0.82);
    font-size: 12px;
  }
  .sv-binding-select:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(199,163,93,0.35);
  }
  .sv-keybind-note-badge {
    font-size: 10px;
    color: rgba(199,163,93,0.65);
    background: rgba(199,163,93,0.1);
    border: 0.5px solid rgba(199,163,93,0.2);
    border-radius: 4px;
    padding: 2px 7px;
  }
  .sv-keybind-key {
    font-size: 11px;
    font-weight: 500;
    color: #c9a86c;
    background: rgba(199,163,93,0.08);
    border: 0.5px solid rgba(199,163,93,0.25);
    border-radius: 5px;
    padding: 3px 10px;
    font-family: 'Segoe UI', monospace;
  }
  .sv-controls-note {
    margin: 12px 0 0;
    font-size: 11px;
    color: rgba(244,237,224,0.25);
    text-align: center;
  }

  .sv-data-box {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    padding: 14px;
    margin-bottom: 14px;
    background: rgba(255,255,255,0.03);
    border: 0.5px solid rgba(217,179,107,0.12);
    border-radius: 14px;
  }
  .sv-data-copy { flex: 1; min-width: 0; }
  .sv-data-title {
    margin: 0;
    font-size: 14px;
    color: rgba(244,237,224,0.84);
  }
  .sv-data-desc {
    margin: 6px 0 0;
    font-size: 11px;
    line-height: 1.5;
    color: rgba(244,237,224,0.42);
  }
  .sv-data-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 140px;
  }
  .sv-data-btn {
    padding: 9px 14px;
    border: 0.5px solid rgba(199,163,93,0.22);
    background: rgba(199,163,93,0.08);
    color: rgba(244,237,224,0.76);
  }
  .sv-data-btn-danger {
    border-color: rgba(255,138,101,0.28);
    background: rgba(255,138,101,0.1);
    color: rgba(255,210,198,0.82);
  }
  .sv-data-textarea {
    width: 100%;
    min-height: 220px;
    padding: 12px 14px;
    resize: vertical;
    border-radius: 12px;
    border: 0.5px solid rgba(217,179,107,0.14);
    background: rgba(10,10,16,0.55);
    color: rgba(244,237,224,0.82);
    font: 12px/1.5 'Cascadia Code', 'Consolas', monospace;
    box-sizing: border-box;
  }
  .sv-data-textarea:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(199,163,93,0.35);
  }

  .sv-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 26px 24px;
    margin-top: 6px;
    border-top: 1px solid rgba(217,179,107,0.12);
  }
  .sv-footer-right { display: flex; gap: 10px; }
  .sv-btn {
    padding: 10px 20px;
    border-radius: 9px;
    font-size: 13px;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: transform 0.15s, opacity 0.15s;
  }
  .sv-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .sv-btn:active:not(:disabled) { transform: scale(0.98); }
  .sv-btn-reset {
    background: transparent;
    border: 0.5px solid rgba(199,163,93,0.18);
    color: rgba(244,237,224,0.38);
  }
  .sv-btn-back { min-width: 154px; }
  .sv-btn-primary {
    background: linear-gradient(135deg, rgba(199,163,93,0.18), rgba(199,163,93,0.07));
    border: 1px solid rgba(199,163,93,0.45);
    color: #c9a86c;
  }
  .ash-access-large-text .sv-panel {
    width: min(840px, calc(100vw - 32px));
  }
  .ash-access-large-text .sv-nav-item,
  .ash-access-large-text .sv-toggle-label,
  .ash-access-large-text .sv-slider-label,
  .ash-access-large-text .sv-keybind-action {
    font-size: 14px;
  }
  .ash-access-reduced-motion .sv-panel,
  .ash-access-reduced-motion .sv-switch-knob {
    animation: none;
    transition: none;
  }

  @media (max-width: 780px) {
    .sv-body { grid-template-columns: 1fr; }
    .sv-sidenav {
      flex-direction: row;
      flex-wrap: wrap;
      padding-right: 0;
      border-right: none;
      border-bottom: 1px solid rgba(217,179,107,0.12);
      padding-bottom: 12px;
      margin-bottom: 14px;
      gap: 4px;
    }
    .sv-content { padding-left: 0; max-height: none; }
    .sv-data-box {
      flex-direction: column;
    }
    .sv-data-actions {
      min-width: 0;
    }
    .sv-binding-row,
    .sv-keybind-row {
      flex-direction: column;
      align-items: stretch;
    }
    .sv-keybind-right {
      justify-content: flex-start;
    }
  }

  @media (max-width: 560px) {
    .sv-header { flex-direction: column; align-items: stretch; }
    .sv-header-note { align-self: flex-start; }
    .sv-footer {
      flex-direction: column;
      gap: 10px;
      padding: 18px 18px 22px;
    }
    .sv-footer-right {
      justify-content: stretch;
      width: 100%;
    }
    .sv-btn-back, .sv-btn-primary { flex: 1; text-align: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sv-panel { animation: none; }
    .sv-switch-knob { transition: none; }
  }
`;
