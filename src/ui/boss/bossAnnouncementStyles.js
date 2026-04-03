const BOSS_ANNOUNCEMENT_STYLE_ID = 'boss-announce-styles';

const BOSS_ANNOUNCEMENT_CSS = `
  .boss-announce-root {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 45;
  }

  .ba-inner {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: ba-enter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .boss-announce-root.ba-fade-out .ba-inner {
    animation: ba-exit 0.5s ease-in forwards;
  }

  @keyframes ba-enter {
    from { opacity: 0; transform: scale(1.25) translateY(-12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes ba-exit {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(0.88) translateY(8px); }
  }

  .ba-warning {
    font-size: clamp(13px, 2.5vw, 18px);
    font-family: 'Segoe UI', monospace, sans-serif;
    font-weight: 900;
    letter-spacing: 0.6em;
    color: #ff1744;
    text-shadow:
      0 0 12px rgba(255, 23, 68, 0.8),
      0 0 30px rgba(255, 23, 68, 0.4);
    animation: ba-warning-blink 0.55s ease-in-out infinite alternate;
  }

  @keyframes ba-warning-blink {
    from { opacity: 0.7; }
    to   { opacity: 1; }
  }

  .ba-name {
    font-size: clamp(32px, 6vw, 64px);
    font-family: 'Segoe UI', 'Arial Black', sans-serif;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #fff;
    text-shadow:
      0 0 20px rgba(255, 64, 129, 0.9),
      0 0 50px rgba(255, 64, 129, 0.5),
      0 4px 0 rgba(0, 0, 0, 0.8);
    animation: ba-name-shake 0.08s ease-in-out 3 0.3s;
  }

  @keyframes ba-name-shake {
    0%   { transform: translateX(0); }
    25%  { transform: translateX(-4px); }
    75%  { transform: translateX(4px); }
    100% { transform: translateX(0); }
  }

  .ba-subtitle {
    font-size: clamp(12px, 2vw, 15px);
    font-family: 'Segoe UI', sans-serif;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .boss-announce-root::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(
      ellipse 80% 40% at 50% 50%,
      rgba(255, 23, 68, 0.12) 0%,
      transparent 70%
    );
    pointer-events: none;
    animation: ba-vignette 3.2s ease-in-out forwards;
  }

  @keyframes ba-vignette {
    0%   { opacity: 0; }
    10%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { opacity: 0; }
  }
`;

export function ensureBossAnnouncementStyles(documentRef = document) {
  if (documentRef.getElementById(BOSS_ANNOUNCEMENT_STYLE_ID)) return;
  const style = documentRef.createElement('style');
  style.id = BOSS_ANNOUNCEMENT_STYLE_ID;
  style.textContent = BOSS_ANNOUNCEMENT_CSS;
  documentRef.head.appendChild(style);
}
