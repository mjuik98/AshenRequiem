export const CODEX_TAB_CSS = `
  .cx-enemy-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px; margin-bottom: 18px;
  }
  .cx-ecard {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
    background: rgba(255,255,255,0.04); padding: 12px 10px;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
    position: relative; overflow: hidden; outline: none;
  }
  .cx-ecard:hover, .cx-ecard:focus-visible {
    border-color: rgba(212,175,106,0.3); background: rgba(255,255,255,0.07);
  }
  .cx-ecard:focus-visible { box-shadow: 0 0 0 2px rgba(212,175,106,0.4); }
  .cx-ecard.elite  { border-color: rgba(255,215,64,0.2); }
  .cx-ecard.boss   { border-color: rgba(255,64,129,0.22); }
  .cx-ecard.selected {
    border-color: rgba(212,175,106,0.6) !important;
    background: rgba(212,175,106,0.06) !important;
  }
  .cx-eavatar {
    width: 44px; height: 44px; border-radius: 50%; margin: 0 auto 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 600; border: 2px solid;
  }
  .cx-ename {
    font-size: 12px; font-weight: 600; text-align: center;
    color: rgba(244,237,224,0.88); margin-bottom: 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cx-etype-row { display: flex; justify-content: center; margin-bottom: 8px; }
  .cx-ebadge {
    font-size: 9px; padding: 2px 7px; border-radius: 10px; font-weight: 600; letter-spacing: 0.5px;
  }
  .badge-normal { background: rgba(100,181,246,0.12); color: #64b5f6; border: 0.5px solid rgba(100,181,246,0.25); }
  .badge-elite  { background: rgba(255,215,64,0.12);  color: #ffd740; border: 0.5px solid rgba(255,215,64,0.3); }
  .badge-boss   { background: rgba(255,64,129,0.12);  color: #ff4081; border: 0.5px solid rgba(255,64,129,0.3); }
  .cx-estats { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
  .cx-estat {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(255,255,255,0.03); border-radius: 5px; padding: 3px 4px;
  }
  .cx-estat .v { font-size: 12px; font-weight: 600; color: rgba(244,237,224,0.88); }
  .cx-estat .k { font-size: 9px; color: rgba(244,237,224,0.28); }
  .cx-ekills { margin-top: 7px; text-align: center; font-size: 10px; color: rgba(244,237,224,0.28); }
  .cx-ekills span { color: #d4af6a; font-weight: 600; }
  .cx-lock-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: rgba(0,0,0,0.62); border-radius: 11px; gap: 5px;
  }
  .cx-lock-icon { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .cx-lock-icon .arc {
    width: 14px; height: 8px; border: 2px solid rgba(255,255,255,0.3);
    border-bottom: none; border-radius: 7px 7px 0 0;
  }
  .cx-lock-icon .body { width: 16px; height: 11px; background: rgba(255,255,255,0.2); border-radius: 3px; }
  .cx-lock-text { font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 1px; }
  .cx-detail {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 16px; background: rgba(255,255,255,0.04); margin-top: 4px;
  }
  .cx-dh { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .cx-davatar {
    width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; border: 2px solid;
  }
  .cx-dname { font-size: 16px; font-weight: 600; color: rgba(244,237,224,0.9); margin-bottom: 5px; }
  .cx-dstat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
  .cx-dstat {
    background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 8px 6px; text-align: center;
  }
  .cx-dstat .v { font-size: 16px; font-weight: 600; color: rgba(244,237,224,0.9); }
  .cx-dstat .k { font-size: 10px; color: rgba(244,237,224,0.28); margin-top: 2px; }
  .cx-drops-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .cx-drop-label { font-size: 11px; color: rgba(244,237,224,0.28); }
  .cx-drop-pill {
    font-size: 11px; padding: 3px 10px; border-radius: 20px;
    background: rgba(102,187,106,0.1); border: 0.5px solid rgba(102,187,106,0.25); color: #6dba72;
  }
  .cx-effects-row { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .cx-effect-pill {
    font-size: 10px; padding: 3px 10px; border-radius: 20px;
    background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12);
    color: rgba(244,237,224,0.5);
  }
  .cx-kills-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 12px; padding-top: 10px; border-top: 0.5px solid rgba(255,255,255,0.08);
  }
  .cx-kills-val { font-size: 22px; font-weight: 600; color: #d4af6a; }
  .cx-kills-key { font-size: 11px; color: rgba(244,237,224,0.28); }
  .cx-milestone { display: flex; gap: 6px; }
  .dp-ms {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(212,175,106,0.2); border: 1px solid rgba(212,175,106,0.35);
  }
  .dp-ms.done { background: #d4af6a; border-color: #d4af6a; }
  .cx-weapon-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
    gap: 8px; margin-bottom: 8px;
  }
  .cx-wcard {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 12px; background: rgba(255,255,255,0.04);
    cursor: pointer; transition: all 0.15s; outline: none;
  }
  .cx-wcard:hover, .cx-wcard:focus-visible {
    border-color: rgba(212,175,106,0.3); background: rgba(255,255,255,0.07);
  }
  .cx-wcard:focus-visible { box-shadow: 0 0 0 2px rgba(212,175,106,0.4); }
  .cx-wcard.evolved { border-color: rgba(212,175,106,0.22); }
  .cx-wcard.selected { border-color: rgba(212,175,106,0.6) !important; background: rgba(212,175,106,0.06) !important; }
  .cx-wcard.locked { opacity: 0.45; }
  .cx-whead { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .cx-wicon {
    width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
    background: rgba(212,175,106,0.08); border: 0.5px solid rgba(212,175,106,0.2);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .cx-wname { font-size: 13px; font-weight: 600; color: rgba(244,237,224,0.88); }
  .cx-wtype { font-size: 9px; color: rgba(244,237,224,0.28); margin-top: 2px; }
  .cx-wbar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
  .cx-wbar-lbl { font-size: 10px; color: rgba(244,237,224,0.28); width: 28px; }
  .cx-wbar-track { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; }
  .cx-wbar-fill { height: 100%; border-radius: 2px; }
  .cx-wrequires { font-size: 10px; color: rgba(212,175,106,0.55); margin-top: 6px; line-height: 1.5; }
  .cx-wreq-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .cx-req-chip {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border-radius: 999px;
    border: 0.5px solid rgba(126,205,232,0.22); background: rgba(126,205,232,0.08);
    color: rgba(220,241,248,0.9); font-size: 10px; cursor: pointer;
  }
  .cx-req-icon {
    width: 16px; height: 16px; border-radius: 50%; display: inline-flex;
    align-items: center; justify-content: center; background: rgba(126,205,232,0.14);
  }
  .cx-wlocked { text-align: center; padding: 12px 0; font-size: 11px; color: rgba(244,237,224,0.28); }
  .cx-records-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .cx-rec {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 14px; background: rgba(255,255,255,0.04); text-align: center;
  }
  .cx-rec-icon { font-size: 22px; margin-bottom: 8px; }
  .cx-rec-val { font-size: 20px; font-weight: 600; color: rgba(244,237,224,0.88); }
  .cx-rec-key { font-size: 11px; color: rgba(244,237,224,0.28); margin-top: 3px; }
  .cx-ach-list { display: flex; flex-direction: column; gap: 8px; }
  .cx-ach {
    display: flex; align-items: center; gap: 12px;
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 10px;
    padding: 10px 14px; background: rgba(255,255,255,0.04);
  }
  .cx-ach.done { border-color: rgba(212,175,106,0.28); }
  .cx-ach-icon {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
    background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1);
  }
  .cx-ach.done .cx-ach-icon {
    background: rgba(212,175,106,0.12); border-color: rgba(212,175,106,0.25);
  }
  .cx-ach-body { flex: 1; min-width: 0; }
  .cx-ach-name { font-size: 13px; font-weight: 600; color: rgba(244,237,224,0.88); margin-bottom: 2px; }
  .cx-ach-desc { font-size: 11px; color: rgba(244,237,224,0.45); }
  .cx-ach-reward { font-size: 10px; color: rgba(212,175,106,0.55); margin-top: 4px; }
  .cx-ach-check { font-size: 12px; font-weight: 600; color: #d4af6a; margin-left: auto; flex-shrink: 0; }
  .cx-ach-prog { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
  .cx-prog-bar { width: 80px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; }
  .cx-prog-fill { height: 100%; border-radius: 2px; background: #d4af6a; }
  .cx-prog-text { font-size: 10px; color: rgba(244,237,224,0.28); }
`;
