const BOSS_HUD_STYLE_ID = 'boss-hud-styles';

const BOSS_HUD_CSS = `
  .boss-hud {
    position: absolute; bottom: 52px; left: 50%;
    transform: translateX(-50%);
    display: none; flex-direction: column; align-items: center;
    gap: 5px; pointer-events: none; z-index: 20; min-width: 340px;
  }
  .boss-name {
    font-size: 13px; font-weight: 700; color: #ff80ab;
    letter-spacing: 2px; text-shadow: 0 0 10px #ff4081;
  }
  .boss-bar-wrap {
    width: 100%; height: 10px;
    background: rgba(0,0,0,0.6); border-radius: 5px; overflow: hidden;
    border: 1px solid rgba(255,64,129,0.4);
  }
  .boss-hp-fill {
    height: 100%; width: 100%;
    background: linear-gradient(90deg, #ff1744, #ff4081);
    border-radius: 5px; transition: width 0.2s ease;
  }
  .boss-hp-label { font-size: 11px; color: #aaa; }
`;

export function ensureBossHudStyles(documentRef = document) {
  if (documentRef.getElementById(BOSS_HUD_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = BOSS_HUD_STYLE_ID;
  style.textContent = BOSS_HUD_CSS;
  documentRef.head.appendChild(style);
}
