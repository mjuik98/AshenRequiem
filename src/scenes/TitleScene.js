import { PlayScene } from './PlayScene.js';

/**
 * TitleScene — 타이틀 화면
 *
 * Canvas 배경 애니메이션(별, 달, 성, 안개, 비) + DOM 패널 구조를 통합한 버전.
 * enter() 에서 폰트·DOM·Canvas를 초기화하고, exit() 에서 rAF·리스너를 정리한다.
 *
 * 설계 원칙 준수:
 *  - Scene는 흐름 제어만 담당 → startGame() 내부에서 sceneManager.changeScene() 호출
 *  - Renderer 책임은 Canvas 배경에만 국한 (게임 규칙 없음)
 *  - 모든 이벤트 리스너는 exit() 에서 반드시 제거
 */
export class TitleScene {
  constructor(game) {
    this.game         = game;
    this._el          = null;
    this._canvas      = null;
    this._ctx         = null;
    this._frameId     = 0;
    this._state       = null;

    // exit() 에서 제거하기 위해 바인딩된 핸들러를 보관
    this._onMouseMove = null;
    this._onResize    = null;
    this._onKeyDown   = null;
  }

  // ────────────────────────────────────────────────────────────
  enter() {
    this._ensureFonts();
    this._buildDOM();
    this._initCanvas();
    this._bindEvents();
  }

  update() {}
  render() {}

  exit() {
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = 0;
    }

    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize',    this._onResize);
    window.removeEventListener('keydown',   this._onKeyDown);

    if (this._el) { this._el.remove(); this._el = null; }

    this._canvas = null;
    this._ctx    = null;
    this._state  = null;
  }

  // ────────────────────────────────────────────────────────────
  // 내부 초기화
  // ────────────────────────────────────────────────────────────

  _ensureFonts() {
    if (document.getElementById('title-font-links')) return;
    const frag = document.createDocumentFragment();

    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = '';

    const link = document.createElement('link');
    link.id   = 'title-font-links';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;800&family=Cinzel+Decorative:wght@700&family=Noto+Serif+KR:wght@400;500;700&display=swap';

    frag.appendChild(pre1);
    frag.appendChild(pre2);
    frag.appendChild(link);
    document.head.appendChild(frag);
  }

  _buildDOM() {
    this._injectStyles();

    this._el = document.createElement('div');
    this._el.id = 'title-screen';
    this._el.innerHTML = `
      <canvas id="title-bg-canvas" aria-hidden="true"></canvas>
      <div class="t-shade"   aria-hidden="true"></div>
      <div class="t-vignette" aria-hidden="true"></div>
      <div class="t-flash"   id="title-flash" aria-hidden="true"></div>

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

            <button class="t-btn is-disabled" data-action="settings" type="button" aria-disabled="true">
              <span class="t-btn-left">
                <span class="t-btn-label">Settings</span>
                <span class="t-btn-meta">준비 중</span>
              </span>
              <span class="t-btn-badge">—</span>
            </button>

            <button class="t-btn is-disabled" data-action="quit" type="button" aria-disabled="true">
              <span class="t-btn-left">
                <span class="t-btn-label">Quit</span>
                <span class="t-btn-meta">브라우저 MVP 제외</span>
              </span>
              <span class="t-btn-badge">—</span>
            </button>
          </nav>

          <div class="t-hints" aria-hidden="true">
            <span><kbd>Enter</kbd> 또는 <kbd>Space</kbd> 시작</span>
            <span>이동: <kbd>WASD</kbd></span>
            <span>디버그: <kbd>\`</kbd></span>
          </div>

          <p class="t-live" id="title-live" aria-live="polite">게임 시작 입력을 기다리는 중입니다.</p>
        </section>
      </main>
    `;

    document.getElementById('ui-container').appendChild(this._el);
  }

  _initCanvas() {
    this._canvas = document.getElementById('title-bg-canvas');
    this._ctx    = this._canvas.getContext('2d');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._state = {
      width: 0, height: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      pointerX: window.innerWidth  * 0.5,
      pointerY: window.innerHeight * 0.4,
      smoothedX: window.innerWidth  * 0.5,
      smoothedY: window.innerHeight * 0.4,
      stars: [], rain: [], fogBands: [],
      lastTime: 0,
      prefersReducedMotion,
    };

    this._resize();

    if (prefersReducedMotion) {
      this._draw(0, 0);
    } else {
      const tick = (ts) => {
        if (!this._ctx) return;
        const time  = ts * 0.001;
        const delta = Math.min(0.033, time - (this._state.lastTime || time));
        this._state.lastTime = time;
        this._state.smoothedX += (this._state.pointerX - this._state.smoothedX) * 0.04;
        this._state.smoothedY += (this._state.pointerY - this._state.smoothedY) * 0.04;
        this._draw(time, delta);
        this._frameId = requestAnimationFrame(tick);
      };
      this._frameId = requestAnimationFrame(tick);
    }
  }

  _bindEvents() {
    const liveEl   = document.getElementById('title-live');
    const flashEl  = document.getElementById('title-flash');

    const pulseFlash = () => {
      if (!flashEl) return;
      flashEl.style.background = 'rgba(255, 242, 216, 0.12)';
      setTimeout(() => { if (flashEl) flashEl.style.background = 'rgba(255, 242, 216, 0)'; }, 260);
    };

    const setMessage = (text) => { if (liveEl) liveEl.textContent = text; };

    const startGame = () => {
      pulseFlash();
      setMessage('씬 전환 중…');
      // 짧은 딜레이로 flash 연출 후 씬 전환
      setTimeout(() => {
        this.game.sceneManager.changeScene(new PlayScene(this.game));
      }, 120);
    };

    const handleDisabled = (action) => {
      const msgs = {
        settings: '설정 UI는 아직 준비 중입니다.',
        quit:     '브라우저 빌드에서는 탭을 닫아 종료할 수 있습니다.',
      };
      pulseFlash();
      setMessage(msgs[action] || '아직 사용할 수 없는 메뉴입니다.');
    };

    // 버튼 클릭
    this._el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'start') { startGame(); return; }
        handleDisabled(action);
      });
    });

    // 키보드
    this._onKeyDown = (e) => {
      if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener('keydown', this._onKeyDown);

    // 마우스 패럴랙스
    this._onMouseMove = (e) => {
      if (!this._state) return;
      this._state.pointerX = e.clientX;
      this._state.pointerY = e.clientY;
    };
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });

    // 리사이즈
    this._onResize = () => { if (this._state) this._resize(); };
    window.addEventListener('resize', this._onResize);
  }

  // ────────────────────────────────────────────────────────────
  // Canvas 렌더링
  // ────────────────────────────────────────────────────────────

  _resize() {
    const s = this._state;
    s.width  = window.innerWidth;
    s.height = window.innerHeight;
    s.dpr    = Math.min(window.devicePixelRatio || 1, 2);
    this._canvas.width  = Math.floor(s.width  * s.dpr);
    this._canvas.height = Math.floor(s.height * s.dpr);
    this._canvas.style.width  = s.width  + 'px';
    this._canvas.style.height = s.height + 'px';
    this._ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    this._buildBackground();
    this._draw(0, 0);
  }

  _buildBackground() {
    const s = this._state;
    const starCount = Math.max(90, Math.floor(s.width * s.height / 12000));
    const rainCount = s.prefersReducedMotion ? 0 : Math.max(36, Math.floor(s.width / 18));

    s.stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * s.width,
      y: Math.random() * s.height * 0.62,
      radius: 0.4 + Math.random() * 1.5,
      alpha:  0.2 + Math.random() * 0.6,
      speed:  0.25 + Math.random() * 1.4,
      phase:  Math.random() * Math.PI * 2,
      layer:  Math.random() < 0.55 ? 0.6 : 1,
    }));

    s.rain = Array.from({ length: rainCount }, () => ({
      x:      Math.random() * s.width,
      y:      Math.random() * s.height,
      length: 6 + Math.random() * 14,
      speed:  220 + Math.random() * 220,
      alpha:  0.06 + Math.random() * 0.12,
    }));

    s.fogBands = Array.from({ length: 3 }, (_, i) => ({
      baseY:     s.height * (0.74 + i * 0.07),
      amplitude: 8 + i * 4,
      speed:     0.11 + i * 0.05,
      alpha:     0.05 + i * 0.03,
    }));
  }

  _draw(time, delta) {
    const ctx = this._ctx;
    const s   = this._state;
    if (!ctx || !s) return;
    ctx.clearRect(0, 0, s.width, s.height);
    this._drawSky(time);
    this._drawMoon(time);
    this._drawCastle();
    this._drawGround(time);
    this._drawRain(delta);
  }

  _drawSky(time) {
    const ctx = this._ctx, s = this._state;
    const grad = ctx.createLinearGradient(0, 0, 0, s.height);
    grad.addColorStop(0,    '#090512');
    grad.addColorStop(0.25, '#120c1c');
    grad.addColorStop(0.55, '#160d0e');
    grad.addColorStop(1,    '#050308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s.width, s.height);

    const gx = s.width  * 0.5 + (s.smoothedX - s.width  * 0.5) * 0.02;
    const gy = s.height * 0.22 + (s.smoothedY - s.height * 0.5) * 0.01;
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(s.width, s.height) * 0.4);
    glow.addColorStop(0,    'rgba(161,52,35,0.12)');
    glow.addColorStop(0.25, 'rgba(161,52,35,0.04)');
    glow.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, s.width, s.height);

    for (const star of s.stars) {
      const twinkle = s.prefersReducedMotion ? 1 : (0.65 + Math.sin(time * star.speed + star.phase) * 0.35);
      const px = star.x + (s.smoothedX - s.width  * 0.5) * 0.004 * star.layer;
      const py = star.y + (s.smoothedY - s.height * 0.5) * 0.002 * star.layer;
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = '#f3e1b8';
      ctx.beginPath();
      ctx.arc(px, py, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawMoon(time) {
    const ctx = this._ctx, s = this._state;
    const x = s.width  * 0.5  + (s.smoothedX - s.width  * 0.5) * 0.012;
    const y = s.height * 0.22 + (s.smoothedY - s.height * 0.5) * 0.006;
    const r = Math.min(s.width, s.height) * 0.07;

    const corona = ctx.createRadialGradient(x, y, r * 0.65, x, y, r * 4.5);
    corona.addColorStop(0,   'rgba(178,51,30,0.16)');
    corona.addColorStop(0.3, 'rgba(178,51,30,0.07)');
    corona.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(x, y, r * 4.5, 0, Math.PI * 2);
    ctx.fill();

    const moon = ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, 0, x, y, r);
    moon.addColorStop(0,    '#f0dec2');
    moon.addColorStop(0.38, '#d09961');
    moon.addColorStop(0.76, '#92441f');
    moon.addColorStop(1,    '#45120b');
    ctx.fillStyle   = moon;
    ctx.shadowColor = 'rgba(180,72,22,0.35)';
    ctx.shadowBlur  = 28;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const pulse = s.prefersReducedMotion ? 0.28 : (0.18 + (Math.sin(time * 0.7) + 1) * 0.08);
    ctx.strokeStyle = `rgba(242,176,110,${pulse})`;
    ctx.lineWidth   = Math.max(4, r * 0.16);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.06, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawCastle() {
    const ctx = this._ctx, s = this._state;
    const offsetX = (s.smoothedX - s.width * 0.5) * 0.014;
    const offsetY = (s.smoothedY - s.height * 0.5) * 0.006;
    const cx   = s.width * 0.5 + offsetX;
    const baseY = s.height * 0.8 + offsetY;
    const w = s.width, h = s.height;

    // 원경 능선
    ctx.fillStyle = '#060408';
    ctx.beginPath();
    ctx.moveTo(0, h); ctx.lineTo(0, h * 0.8);
    ctx.lineTo(w * 0.14, h * 0.74); ctx.lineTo(w * 0.28, h * 0.69);
    ctx.lineTo(w * 0.5,  h * 0.67); ctx.lineTo(w * 0.72, h * 0.69);
    ctx.lineTo(w * 0.86, h * 0.74); ctx.lineTo(w, h * 0.8);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

    // 성 본체
    ctx.fillStyle = '#09060d';
    ctx.beginPath();
    ctx.moveTo(0, h); ctx.lineTo(0, baseY);
    ctx.lineTo(cx - 160, baseY);
    ctx.lineTo(cx - 160, h * 0.52); ctx.lineTo(cx - 92, h * 0.52);
    ctx.lineTo(cx - 92,  h * 0.42); ctx.lineTo(cx - 54, h * 0.42);
    ctx.lineTo(cx - 54,  h * 0.33); ctx.lineTo(cx - 28, h * 0.33);
    ctx.lineTo(cx - 28,  h * 0.22); ctx.lineTo(cx - 10, h * 0.22);
    ctx.lineTo(cx, h * 0.1);
    ctx.lineTo(cx + 10,  h * 0.22); ctx.lineTo(cx + 28, h * 0.22);
    ctx.lineTo(cx + 28,  h * 0.33); ctx.lineTo(cx + 54, h * 0.33);
    ctx.lineTo(cx + 54,  h * 0.42); ctx.lineTo(cx + 92, h * 0.42);
    ctx.lineTo(cx + 92,  h * 0.52); ctx.lineTo(cx + 160, baseY);
    ctx.lineTo(w, baseY); ctx.lineTo(w, h);
    ctx.closePath(); ctx.fill();

    this._drawTower(cx - 260, h * 0.57, 22, 120);
    this._drawTower(cx + 260, h * 0.57, 22, 120);
    this._drawTower(cx - 360, h * 0.62, 18, 92);
    this._drawTower(cx + 360, h * 0.62, 18, 92);

    this._drawWindow(cx - 88, h * 0.61, '#f6b259');
    this._drawWindow(cx + 88, h * 0.61, '#f6b259');
    this._drawWindow(cx,      h * 0.47, '#ffd786');
    this._drawWindow(cx,      h * 0.29, '#fff0b1');
  }

  _drawTower(x, y, hw, height) {
    const ctx = this._ctx;
    ctx.fillStyle = '#08050a';
    ctx.fillRect(x - hw, y, hw * 2, height);
    for (let i = 0; i < 4; i++) {
      ctx.clearRect(x - hw + i * (hw * 0.5), y - 7, hw * 0.55, 7);
    }
  }

  _drawWindow(x, y, color) {
    const ctx = this._ctx;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
    const rgb  = parseInt(color.slice(1), 16);
    const [r,g,b] = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
    glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(x - 3, y - 10, 6, 12);
  }

  _drawGround(time) {
    const ctx = this._ctx, s = this._state;
    const ground = ctx.createLinearGradient(0, s.height * 0.68, 0, s.height);
    ground.addColorStop(0,   'rgba(0,0,0,0)');
    ground.addColorStop(0.3, 'rgba(8,3,4,0.32)');
    ground.addColorStop(1,   'rgba(0,0,0,0.94)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, s.height * 0.68, s.width, s.height * 0.32);

    for (let idx = 0; idx < s.fogBands.length; idx++) {
      const band = s.fogBands[idx];
      ctx.beginPath();
      ctx.moveTo(0, s.height);
      for (let x = 0; x <= s.width; x += 8) {
        const wave = Math.sin(x * 0.006 + time * band.speed + idx) * band.amplitude;
        ctx.lineTo(x, band.baseY + wave);
      }
      ctx.lineTo(s.width, s.height);
      ctx.closePath();
      ctx.fillStyle = `rgba(56,28,18,${band.alpha})`;
      ctx.fill();
    }
  }

  _drawRain(delta) {
    const ctx = this._ctx, s = this._state;
    if (!s.rain.length) return;
    ctx.strokeStyle = 'rgba(178,189,222,1)';
    ctx.lineWidth   = 0.75;
    for (const drop of s.rain) {
      drop.y += drop.speed * delta;
      drop.x += drop.speed * delta * 0.12;
      if (drop.y > s.height + drop.length) {
        drop.y = -drop.length;
        drop.x = Math.random() * s.width;
      }
      ctx.globalAlpha = drop.alpha;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + drop.length * 0.16, drop.y + drop.length);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ────────────────────────────────────────────────────────────
  // 스타일 주입
  // ────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('title-styles')) return;
    const s = document.createElement('style');
    s.id = 'title-styles';
    s.textContent = `
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
        from { filter: drop-shadow(0 0 8px  rgba(199,163,93,0.3)); }
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

      .t-btn.is-disabled {
        opacity: 0.72; cursor: default;
      }
      .t-btn.is-disabled:hover {
        transform: none;
        border-color: rgba(199,163,93,0.18);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)),
          rgba(10,7,16,0.58);
        box-shadow: 0 10px 24px rgba(0,0,0,0.2);
      }

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
        to   { opacity: 1; transform: translateY(0)    scale(1);     }
      }

      @media (max-width: 720px) {
        .t-shell   { padding: 16px; }
        .t-panel   { padding: 24px 18px; border-radius: 16px; }
        .t-btn     { padding: 15px 14px; }
        .t-btn-label { letter-spacing: 0.14em; }
      }

      @media (prefers-reduced-motion: reduce) {
        .t-panel, .t-flash, .t-btn, .t-title-btm {
          animation: none !important; transition: none !important;
        }
      }
    `;
    document.head.appendChild(s);
  }
}
