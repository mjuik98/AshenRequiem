export const CODEX_ACCESSORY_TAB_CSS = `
  .cx-accessory-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 8px; margin-bottom: 16px;
  }
  .cx-acard {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
    padding: 12px; background: rgba(255,255,255,0.04);
    cursor: pointer; transition: all 0.15s; outline: none;
  }
  .cx-acard:hover, .cx-acard:focus-visible {
    border-color: rgba(126,205,232,0.35); background: rgba(255,255,255,0.07);
  }
  .cx-acard:focus-visible { box-shadow: 0 0 0 2px rgba(126,205,232,0.3); }
  .cx-acard.selected { border-color: rgba(126,205,232,0.6) !important; background: rgba(126,205,232,0.08) !important; }
  .cx-acard.locked { opacity: 0.45; }
  .cx-ahead { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
  .cx-aicon {
    width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
    background: rgba(126,205,232,0.1); border: 0.5px solid rgba(126,205,232,0.22);
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .cx-acopy { min-width: 0; flex: 1; }
  .cx-aname { font-size: 13px; font-weight: 600; color: rgba(244,237,224,0.88); }
  .cx-arow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .cx-ararity, .cx-alevel {
    font-size: 9px; letter-spacing: 0.4px; padding: 2px 7px; border-radius: 999px;
    border: 0.5px solid rgba(255,255,255,0.1);
  }
  .cx-ararity.common { color: rgba(244,237,224,0.55); background: rgba(255,255,255,0.06); }
  .cx-ararity.rare { color: #7ecde8; background: rgba(126,205,232,0.12); border-color: rgba(126,205,232,0.22); }
  .cx-alevel { color: rgba(244,237,224,0.35); }
  .cx-acatalyst {
    font-size: 9px; letter-spacing: 0.4px; padding: 2px 7px; border-radius: 999px;
    border: 0.5px solid rgba(212,175,106,0.24); background: rgba(212,175,106,0.08); color: rgba(226,194,126,0.86);
  }
  .cx-aeffect {
    font-size: 11px; line-height: 1.5; min-height: 34px;
    color: rgba(244,237,224,0.55);
  }
  .cx-accessory-detail {
    border: 0.5px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
    scroll-margin-top: 18px;
  }
  .cx-detail-hero { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px; }
  .cx-detail-icon {
    width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; display: flex;
    align-items: center; justify-content: center; font-size: 22px;
    background: rgba(126,205,232,0.12); border: 0.5px solid rgba(126,205,232,0.24);
  }
  .cx-detail-copy { min-width: 0; flex: 1; }
  .cx-detail-name { font-size: 17px; font-weight: 700; color: rgba(244,237,224,0.92); }
  .cx-detail-subline {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 6px;
  }
  .cx-detail-desc { margin-top: 8px; font-size: 12px; line-height: 1.6; color: rgba(244,237,224,0.66); }
  .cx-detail-block + .cx-detail-block {
    margin-top: 14px; padding-top: 14px; border-top: 0.5px solid rgba(255,255,255,0.07);
  }
  .cx-detail-label {
    font-size: 10px; letter-spacing: 1.7px; text-transform: uppercase;
    color: rgba(244,237,224,0.38); margin-bottom: 8px;
  }
  .cx-detail-copyline { font-size: 12px; line-height: 1.6; color: rgba(244,237,224,0.84); }
  .cx-detail-level-groups { display: flex; flex-direction: column; gap: 10px; }
  .cx-level-group {
    padding: 10px 12px; border-radius: 11px;
    border: 0.5px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
  }
  .cx-level-group-label {
    margin-bottom: 8px; font-size: 11px; font-weight: 700;
    color: rgba(244,237,224,0.88);
  }
  .cx-level-track {
    display: flex; flex-wrap: wrap; gap: 7px;
  }
  .cx-level-chip {
    display: flex; flex-direction: column; gap: 3px;
    min-width: 68px; padding: 7px 9px; border-radius: 9px;
    border: 0.5px solid rgba(126,205,232,0.16);
    background: linear-gradient(180deg, rgba(126,205,232,0.08), rgba(126,205,232,0.03));
  }
  .cx-level-chip-kicker {
    font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase;
    color: rgba(191,229,240,0.7);
  }
  .cx-level-chip-value {
    font-size: 11px; line-height: 1.4; color: rgba(244,237,224,0.86);
  }
  .cx-discovery-hint {
    padding: 10px 12px; border-radius: 10px; background: rgba(126,205,232,0.08);
    border: 0.5px solid rgba(126,205,232,0.16); color: rgba(191,229,240,0.86); font-size: 11px; line-height: 1.5;
  }
  .cx-detail-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .cx-link-chip {
    display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 999px;
    border: 0.5px solid rgba(212,175,106,0.22); background: rgba(212,175,106,0.08);
    color: rgba(244,237,224,0.88); font-size: 11px; cursor: pointer;
  }
  .cx-link-icon {
    width: 18px; height: 18px; border-radius: 50%; display: inline-flex;
    align-items: center; justify-content: center; background: rgba(255,255,255,0.08);
  }
  .cx-link-arrow { color: rgba(212,175,106,0.7); font-weight: 700; }
`;
