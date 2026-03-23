export const TITLE_SCREEN_HTML = `
  <canvas id="title-bg-canvas" aria-hidden="true"></canvas>
  <div class="t-shade" aria-hidden="true"></div>
  <div class="t-vignette" aria-hidden="true"></div>
  <div class="t-flash" id="title-flash" aria-hidden="true"></div>

  <main class="t-shell" role="main">
    <section class="t-panel" aria-labelledby="game-title" aria-describedby="game-tagline">
      <p class="t-eyebrow">Dark Fantasy Survival Action</p>
      <div class="t-rule" aria-hidden="true"><span></span></div>

      <h1 class="t-title" id="game-title">
        <span class="t-title-top">Ashen</span>
        <span class="t-title-btm">Requiem</span>
      </h1>

      <p class="t-tagline" id="game-tagline">생존하거나, 잿더미가 되거나</p>

      <nav class="t-menu" aria-label="메인 메뉴">
        <button class="t-btn primary" id="title-start" data-action="start" type="button">
          <span class="t-btn-left">
            <span class="t-btn-label">Start Game</span>
            <span class="t-btn-meta">새로운 모험을 시작합니다</span>
          </span>
          <span class="t-btn-badge">▶</span>
        </button>

        <button class="t-btn" id="title-shop" data-action="shop" type="button">
          <span class="t-btn-left">
            <span class="t-btn-label">Meta Shop</span>
            <span class="t-btn-meta">영구 강화를 구매합니다</span>
          </span>
          <span class="t-btn-badge">⚗</span>
        </button>

        <button class="t-btn" data-action="codex" type="button">
          <span class="t-btn-left">
            <span class="t-btn-label">Codex</span>
            <span class="t-btn-meta">적·무기·기록 열람</span>
          </span>
          <span class="t-btn-badge">📖</span>
        </button>

        <button class="t-btn" data-action="settings" type="button">
          <span class="t-btn-left">
            <span class="t-btn-label">Settings</span>
            <span class="t-btn-meta">음향·그래픽·화면 설정</span>
          </span>
          <span class="t-btn-badge">⚙</span>
        </button>

        <button class="t-btn" data-action="quit" type="button">
          <span class="t-btn-left">
            <span class="t-btn-label">Quit</span>
            <span class="t-btn-meta">창 또는 탭을 닫습니다</span>
          </span>
          <span class="t-btn-badge">✕</span>
        </button>
      </nav>

      <div class="t-hints" aria-hidden="true">
        <span><kbd>Enter</kbd> 또는 <kbd>Space</kbd> 시작</span>
        <span>이동: <kbd>WASD</kbd></span>
      </div>

      <p class="t-live" id="title-live" aria-live="polite">게임 시작 입력을 기다리는 중입니다.</p>
    </section>
  </main>
`;

const TITLE_STYLES = `
  :root {
    --t-bg:         #05030a;
    --t-ink:        #f4ede0;
    --t-ink-dim:    rgba(244,237,224,0.72);
    --t-gold:       #c7a35d;
    --t-gold-hi:    #f1d18a;
    --t-line:       rgba(199,163,93,0.24);
    --t-panel:      rgba(8,6,14,0.56);
    --t-focus:      rgba(241,209,138,0.9);
  }

  #title-screen {
    position: absolute; inset: 0;
    overflow: hidden;
    color: var(--t-ink);
    font-family: "Cinzel", "Noto Serif KR", serif;
    background: radial-gradient(circle at top, #110d1a 0%, var(--t-bg) 55%, #020104 100%);
    z-index: 50;
  }

  #title-bg-canvas,
  .t-shade,
  .t-vignette,
  .t-flash {
    position: absolute; inset: 0;
    pointer-events: none;
  }

  #title-bg-canvas { z-index: 1; display: block; width: 100%; height: 100%; }

  .t-shade {
    z-index: 2;
    background:
      linear-gradient(180deg, rgba(4,2,8,0.08) 0%, rgba(4,2,8,0.18) 28%, rgba(0,0,0,0.38) 100%),
      radial-gradient(circle at 50% 22%, rgba(177,53,38,0.08) 0%, rgba(177,53,38,0) 28%);
  }
  .t-vignette {
    z-index: 3;
    background: radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 22%, rgba(0,0,0,0.68) 100%);
  }
  .t-flash {
    z-index: 20;
    background: rgba(255,242,216,0);
    transition: background 220ms ease;
  }

  .t-shell {
    position: relative; z-index: 10;
    display: grid; place-items: center;
    width: 100%; height: 100%;
    padding: 24px;
  }

  .t-panel {
    width: min(720px, calc(100vw - 32px));
    padding: clamp(28px, 4vw, 40px);
    border: 1px solid var(--t-line);
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)),
      var(--t-panel);
    box-shadow: 0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
    backdrop-filter: blur(8px);
    text-align: center;
    animation: t-panel-enter 720ms cubic-bezier(.18,.89,.32,1.08) both;
  }

  .t-eyebrow {
    margin: 0 0 16px;
    font-size: clamp(11px,1.4vw,13px);
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: rgba(241,209,138,0.76);
  }

  .t-rule {
    display: flex; align-items: center; gap: 12px;
    margin: 0 auto 22px;
    width: min(520px, 100%);
    opacity: 0.85;
  }
  .t-rule::before, .t-rule::after {
    content: ""; flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(199,163,93,0.48), transparent);
  }
  .t-rule span {
    display: inline-flex; width: 10px; height: 10px;
    transform: rotate(45deg);
    background: var(--t-gold);
    box-shadow: 0 0 14px rgba(199,163,93,0.45);
  }

  .t-title { margin: 0; line-height: 0.95; text-transform: uppercase; }
  .t-title-top, .t-title-btm {
    display: block;
    font-family: "Cinzel Decorative", "Cinzel", serif;
    letter-spacing: 0.16em;
  }
  .t-title-top {
    font-size: clamp(36px,5vw,62px);
    color: #f0e5d0;
    text-shadow: 0 0 24px rgba(255,255,255,0.06);
  }
  .t-title-btm {
    margin-top: 6px;
    font-size: clamp(44px,6.4vw,84px);
    color: var(--t-gold-hi);
    text-shadow: 0 0 28px rgba(199,163,93,0.28), 0 0 72px rgba(199,163,93,0.12);
  }
  @keyframes t-title-glow {
    from { filter: drop-shadow(0 0 8px rgba(199,163,93,0.3)); }
    to   { filter: drop-shadow(0 0 20px rgba(199,163,93,0.6)); }
  }
  .t-title-btm { animation: t-title-glow 3s ease-in-out infinite alternate; }

  .t-tagline {
    margin: 18px 0 0;
    font-family: "Noto Serif KR", serif;
    font-size: clamp(15px,1.9vw,18px);
    color: var(--t-ink-dim);
    letter-spacing: 0.08em;
  }

  .t-menu {
    display: grid; gap: 12px;
    margin: 26px auto 0;
    width: min(420px, 100%);
  }

  .t-btn {
    position: relative;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    width: 100%; padding: 16px 18px;
    border: 1px solid rgba(199,163,93,0.18);
    border-radius: 14px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0)),
      rgba(10,7,16,0.58);
    color: var(--t-ink);
    box-shadow: 0 10px 24px rgba(0,0,0,0.2);
    text-align: left; cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease,
                background 160ms ease, box-shadow 160ms ease;
  }
  .t-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(241,209,138,0.38);
    background:
      linear-gradient(180deg, rgba(241,209,138,0.06), rgba(255,255,255,0)),
      rgba(10,7,16,0.76);
    box-shadow: 0 14px 30px rgba(0,0,0,0.28);
  }
  .t-btn:focus-visible { outline: 2px solid var(--t-focus); outline-offset: 3px; }

  .t-btn.primary { border-color: rgba(199,163,93,0.34); }
  .t-btn.primary .t-btn-label { color: var(--t-gold-hi); }

  .t-btn-left { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .t-btn-label {
    font-size: 15px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
  }
  .t-btn-meta {
    font-family: "Noto Serif KR", serif;
    font-size: 12px; color: rgba(244,237,224,0.62);
  }
  .t-btn-badge {
    flex-shrink: 0; padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(244,237,224,0.74);
    font-size: 11px; letter-spacing: 0.08em;
  }

  .t-hints {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 10px 20px;
    margin: 22px 0 0;
    color: rgba(244,237,224,0.72); font-size: 12px;
  }
  .t-hints kbd {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.05);
    color: var(--t-ink);
    font-family: inherit; font-size: 11px; font-weight: 700;
    letter-spacing: 0.04em;
  }

  .t-live {
    min-height: 24px; margin: 18px 0 0;
    font-family: "Noto Serif KR", serif;
    font-size: 13px; color: rgba(241,209,138,0.9);
  }

  @keyframes t-panel-enter {
    from { opacity: 0; transform: translateY(18px) scale(0.985); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @media (max-width: 720px) {
    .t-shell { padding: 16px; }
    .t-panel { padding: 24px 18px; border-radius: 16px; }
    .t-btn { padding: 15px 14px; }
    .t-btn-label { letter-spacing: 0.14em; }
  }

  @media (prefers-reduced-motion: reduce) {
    .t-panel, .t-flash, .t-btn, .t-title-btm {
      animation: none !important; transition: none !important;
    }
  }
`;

export function ensureTitleFonts(doc = document) {
  if (doc.getElementById('title-font-links')) return;

  const fragment = doc.createDocumentFragment();
  const preconnectGoogle = doc.createElement('link');
  preconnectGoogle.rel = 'preconnect';
  preconnectGoogle.href = 'https://fonts.googleapis.com';

  const preconnectStatic = doc.createElement('link');
  preconnectStatic.rel = 'preconnect';
  preconnectStatic.href = 'https://fonts.gstatic.com';
  preconnectStatic.crossOrigin = '';

  const stylesheet = doc.createElement('link');
  stylesheet.id = 'title-font-links';
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;800&family=Cinzel+Decorative:wght@700&family=Noto+Serif+KR:wght@400;500;700&display=swap';

  fragment.appendChild(preconnectGoogle);
  fragment.appendChild(preconnectStatic);
  fragment.appendChild(stylesheet);
  doc.head.appendChild(fragment);
}

export function ensureTitleStyles(doc = document) {
  if (doc.getElementById('title-styles')) return;

  const style = doc.createElement('style');
  style.id = 'title-styles';
  style.textContent = TITLE_STYLES;
  doc.head.appendChild(style);
}
