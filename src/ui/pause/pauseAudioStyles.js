export const PAUSE_AUDIO_CSS = `
  .pv-sound-panel { display: flex; flex-direction: column; gap: 14px; }
  .pv-sound-row { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
  .pv-sound-row-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.78); }
  .pv-audio-slider { width: 100%; accent-color: #d4af6a; }
  .pv-sound-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pv-sound-toggle { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.72); cursor: pointer; }
  .pv-sound-toggle.active { border-color: rgba(212,175,106,0.28); background: rgba(212,175,106,0.08); color: #e5cc90; }
  .pv-sound-toggle-pill { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,0.08); }
  .pv-sound-note { font-size: 11px; color: rgba(255,255,255,0.35); }
`;
