export const HUD_VIEW_STYLE_ID = 'hud-styles';
export const HUD_VIEW_CSS = `
  .hud-root {
    position: absolute; top: 0; left: 0; right: 0;
    pointer-events: none;
  }
  .hud-xp-bar-container {
    position: fixed;
    top: 0; left: 0; right: 0;
    width: 100%; height: 6px;
    background: rgba(0,0,0,0.5);
    overflow: hidden;
    z-index: 100;
  }
  .hud-xp-bar {
    height: 100%; width: 0%;
    background: linear-gradient(90deg, #66bb6a, #aed581);
    transition: width 0.15s ease;
  }
  .hud-top {
    padding-top: 8px;
  }
  .hud-stats {
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 13px; color: #eee; font-family: 'Noto Sans KR', 'Segoe UI', sans-serif;
    padding: 4px 12px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
  }
  .hud-right-stats {
    display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px;
    max-width: 420px;
  }
  .hud-level,
  .hud-right-stats span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(10,14,22,0.82), rgba(10,14,22,0.62));
    border: 1px solid rgba(255,255,255,0.08);
  }
  .hud-level { border-color: rgba(212,175,106,0.22); }
  .hud-gold { color: #ffd54f; }
  .hud-curse { color: #ef9a9a; }
  .ash-access-high-visibility .hud-level,
  .ash-access-high-visibility .hud-right-stats span {
    background: rgba(3, 7, 12, 0.92);
    border-color: rgba(255,255,255,0.22);
    color: #ffffff;
  }
  .ash-access-high-visibility .hud-gold { color: #ffe082; }
  .ash-access-high-visibility .hud-curse { color: #ffb4b4; }
  .ash-access-large-text .hud-stats { font-size: 15px; }
  .ash-access-large-text .hud-level,
  .ash-access-large-text .hud-right-stats span {
    min-height: 32px;
    padding: 0 12px;
  }
  .hud-chest-queue {
    position: fixed;
    top: 14px; left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 5px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 213, 79, 0.55);
    border-radius: 20px;
    padding: 4px 12px;
    pointer-events: none;
    z-index: 101;
    animation: hud-chest-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  @keyframes hud-chest-pop {
    from { opacity: 0; transform: translateX(-50%) scale(0.7); }
    to   { opacity: 1; transform: translateX(-50%) scale(1);   }
  }
  .hud-chest-icon {
    font-size: 14px;
    animation: hud-chest-bounce 1.2s ease-in-out infinite;
  }
  @keyframes hud-chest-bounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-3px); }
  }
  .hud-chest-count {
    font-size: 13px; font-weight: 700;
    color: #ffd54f;
    text-shadow: 0 0 8px rgba(255, 213, 79, 0.6);
    font-family: 'Segoe UI', sans-serif;
  }
  .ash-access-reduced-motion .hud-xp-bar,
  .ash-access-reduced-motion .hud-chest-queue,
  .ash-access-reduced-motion .hud-chest-icon {
    transition: none;
    animation: none;
  }
`;

export function ensureHudViewStyles(documentRef = document) {
  if (documentRef.getElementById(HUD_VIEW_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = HUD_VIEW_STYLE_ID;
  style.textContent = HUD_VIEW_CSS;
  documentRef.head.appendChild(style);
}
