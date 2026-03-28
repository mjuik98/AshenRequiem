/**
 * src/input/TouchAdapter.js — 모바일 터치 입력 어댑터
 *
 * InputManager에 addAdapter(new TouchAdapter(canvas))로 추가하면
 * 키보드와 터치 입력이 동시에 동작한다. 기존 시스템 코드 수정 없음.
 *
 * 가상 조이스틱 방식:
 *   - 화면 왼쪽 절반 터치 → 이동 조이스틱
 *   - 화면 오른쪽 절반 터치 → 추후 액션 버튼 영역 (현재 미사용)
 *
 * 사용법:
 *   // Game.js (또는 모바일 탐지 후 조건부 등록)
 *   if ('ontouchstart' in window) {
 *     this.input.addAdapter(new TouchAdapter(this.canvas));
 *   }
 *
 * 현재 상태: 기본 구현 완성, 추가 UI(조이스틱 시각화) 필요 시 확장
 */
const JOYSTICK_DEADZONE = 0.15;  // 데드존 (0 ~ 1 정규화 기준)
const JOYSTICK_MAX_DIST = 60;    // 최대 드래그 거리 (px)

export class TouchAdapter {
  /**
   * @param {HTMLCanvasElement} canvas  이벤트 대상 캔버스
   */
  constructor(canvas) {
    this._canvas = canvas;

    this._joystickActive    = false;
    this._joystickOriginX   = 0;
    this._joystickOriginY   = 0;
    this._joystickCurrentX  = 0;
    this._joystickCurrentY  = 0;
    this._joystickTouchId   = null;

    this._normX = 0;
    this._normY = 0;
    this._pauseRequested = false;

    this._onTouchStart = null;
    this._onTouchMove  = null;
    this._onTouchEnd   = null;
    this._hudRoot = null;
    this._joystickBase = null;
    this._joystickKnob = null;
    this._moveGuide = null;
    this._actionGuide = null;
    this._pauseButton = null;
    this._onPauseTap = null;
  }

  init() {
    this._createTouchHud();

    this._onTouchStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        // 화면 왼쪽 절반만 조이스틱으로 처리
        const rect = this._canvas.getBoundingClientRect();
        const relX = touch.clientX - rect.left;
        if (relX < rect.width / 2 && this._joystickTouchId === null) {
          this._joystickTouchId  = touch.identifier;
          this._joystickOriginX  = touch.clientX;
          this._joystickOriginY  = touch.clientY;
          this._joystickCurrentX = touch.clientX;
          this._joystickCurrentY = touch.clientY;
          this._joystickActive   = true;
        }
      }
      this._updateNorm();
      this._syncTouchHud();
    };

    this._onTouchMove = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickCurrentX = touch.clientX;
          this._joystickCurrentY = touch.clientY;
        }
      }
      this._updateNorm();
      this._syncTouchHud();
    };

    this._onTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._joystickTouchId) {
          this._joystickTouchId  = null;
          this._joystickActive   = false;
          this._normX = 0;
          this._normY = 0;
        }
      }
      this._syncTouchHud();
    };

    this._canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this._canvas.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    this._canvas.addEventListener('touchend',   this._onTouchEnd,   { passive: false });
    this._canvas.addEventListener('touchcancel',this._onTouchEnd,   { passive: false });
  }

  /**
   * @param {import('./InputState.js').InputState} state
   */
  poll(state) {
    if (this._joystickActive) {
      state.moveX = this._normX;
      state.moveY = this._normY;
    }
    if (this._pauseRequested) {
      state.actions.add('pause');
      this._pauseRequested = false;
    }
  }

  destroy() {
    if (this._onTouchStart) {
      this._canvas.removeEventListener('touchstart', this._onTouchStart);
      this._canvas.removeEventListener('touchmove',  this._onTouchMove);
      this._canvas.removeEventListener('touchend',   this._onTouchEnd);
      this._canvas.removeEventListener('touchcancel',this._onTouchEnd);
    }
    this._pauseButton?.removeEventListener?.('click', this._onPauseTap);
    this._pauseButton?.removeEventListener?.('touchstart', this._onPauseTap);
    this._hudRoot?.remove?.();
  }

  _updateNorm() {
    if (!this._joystickActive) return;

    const dx   = this._joystickCurrentX - this._joystickOriginX;
    const dy   = this._joystickCurrentY - this._joystickOriginY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < JOYSTICK_DEADZONE * JOYSTICK_MAX_DIST) {
      this._normX = 0;
      this._normY = 0;
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_MAX_DIST);
    const factor      = clampedDist / JOYSTICK_MAX_DIST;
    this._normX = (dx / dist) * factor;
    this._normY = (dy / dist) * factor;
  }

  _createTouchHud() {
    const documentRef = this._canvas?.ownerDocument ?? globalThis.document;
    if (!documentRef?.createElement) return;

    const host = this._canvas?.parentNode ?? documentRef.body;
    if (!host?.appendChild) return;

    const root = documentRef.createElement('div');
    root.className = 'touch-hud';
    Object.assign(root.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '18',
    });

    const joystickBase = documentRef.createElement('div');
    joystickBase.className = 'touch-joystick-base';
    Object.assign(joystickBase.style, {
      position: 'absolute',
      width: '92px',
      height: '92px',
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'rgba(5, 9, 16, 0.26)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      transform: 'translate(-50%, -50%)',
      display: 'none',
    });

    const joystickKnob = documentRef.createElement('div');
    joystickKnob.className = 'touch-joystick-knob';
    Object.assign(joystickKnob.style, {
      position: 'absolute',
      width: '42px',
      height: '42px',
      borderRadius: '50%',
      background: 'rgba(242, 207, 132, 0.82)',
      transform: 'translate(-50%, -50%)',
      display: 'none',
    });

    const moveGuide = documentRef.createElement('div');
    moveGuide.className = 'touch-move-guide';
    moveGuide.textContent = 'MOVE';
    Object.assign(moveGuide.style, {
      position: 'absolute',
      left: '20px',
      bottom: '18px',
      padding: '8px 12px',
      borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(6, 10, 16, 0.34)',
      color: 'rgba(244, 237, 224, 0.76)',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.12em',
      pointerEvents: 'none',
    });

    const actionGuide = documentRef.createElement('div');
    actionGuide.className = 'touch-action-guide';
    actionGuide.textContent = 'AIM / TAP';
    Object.assign(actionGuide.style, {
      position: 'absolute',
      right: '20px',
      bottom: '18px',
      padding: '8px 12px',
      borderRadius: '999px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(6, 10, 16, 0.34)',
      color: 'rgba(244, 237, 224, 0.76)',
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '0.12em',
      pointerEvents: 'none',
    });

    const pauseButton = documentRef.createElement('button');
    pauseButton.className = 'touch-pause-button';
    pauseButton.type = 'button';
    pauseButton.textContent = 'II';
    Object.assign(pauseButton.style, {
      position: 'absolute',
      top: '14px',
      right: '14px',
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      border: '1px solid rgba(255,255,255,0.14)',
      background: 'rgba(6, 10, 16, 0.52)',
      color: '#f4ede0',
      fontWeight: '700',
      pointerEvents: 'auto',
    });

    this._onPauseTap = (event) => {
      event?.preventDefault?.();
      this._pauseRequested = true;
    };
    pauseButton.addEventListener('click', this._onPauseTap);
    pauseButton.addEventListener('touchstart', this._onPauseTap, { passive: false });
    if (typeof pauseButton.click !== 'function') {
      pauseButton.click = () => {
        this._onPauseTap({ preventDefault() {} });
      };
    }

    root.appendChild(moveGuide);
    root.appendChild(actionGuide);
    root.appendChild(joystickBase);
    root.appendChild(joystickKnob);
    root.appendChild(pauseButton);
    host.appendChild(root);

    this._hudRoot = root;
    this._joystickBase = joystickBase;
    this._joystickKnob = joystickKnob;
    this._moveGuide = moveGuide;
    this._actionGuide = actionGuide;
    this._pauseButton = pauseButton;
  }

  _syncTouchHud() {
    if (!this._joystickBase || !this._joystickKnob) return;

    if (!this._joystickActive) {
      this._joystickBase.style.display = 'none';
      this._joystickKnob.style.display = 'none';
      return;
    }

    this._joystickBase.style.display = 'block';
    this._joystickKnob.style.display = 'block';
    this._joystickBase.style.left = `${this._joystickOriginX}px`;
    this._joystickBase.style.top = `${this._joystickOriginY}px`;
    const dx = this._joystickCurrentX - this._joystickOriginX;
    const dy = this._joystickCurrentY - this._joystickOriginY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0;
    const clampedDist = Math.min(dist, JOYSTICK_MAX_DIST);
    const ratio = dist > 0 ? clampedDist / dist : 0;
    const knobX = this._joystickOriginX + dx * ratio;
    const knobY = this._joystickOriginY + dy * ratio;
    this._joystickKnob.style.left = `${knobX}px`;
    this._joystickKnob.style.top = `${knobY}px`;
  }
}
