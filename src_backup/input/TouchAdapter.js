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

    this._onTouchStart = null;
    this._onTouchMove  = null;
    this._onTouchEnd   = null;
  }

  init() {
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
    if (!this._joystickActive) return;
    state.moveX = this._normX;
    state.moveY = this._normY;
  }

  destroy() {
    if (this._onTouchStart) {
      this._canvas.removeEventListener('touchstart', this._onTouchStart);
      this._canvas.removeEventListener('touchmove',  this._onTouchMove);
      this._canvas.removeEventListener('touchend',   this._onTouchEnd);
      this._canvas.removeEventListener('touchcancel',this._onTouchEnd);
    }
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
}
