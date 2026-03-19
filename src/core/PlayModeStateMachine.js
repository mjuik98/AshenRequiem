/**
 * src/core/PlayModeStateMachine.js — PlayScene UI 전환 상태 머신
 *
 * BUGFIX:
 *   BUG-7: tick()의 playing 복귀 분기 마지막에 this._prev = 'playing' 갱신 누락
 *
 *     재현 시나리오:
 *       1. levelup 상태에서 onLevelUp 발동 (_prev = 'levelup')
 *       2. 업그레이드 선택 → playMode = 'playing'으로 복귀
 *       3. tick('playing') 호출: _prev !== 'playing' 조건 충족 → onResume 발동
 *       4. 단, this._prev = 'playing' 갱신이 누락되면 _prev = 'levelup' 유지
 *       5. 다음 프레임에서도 tick('playing') 호출: _prev 여전히 'levelup'
 *          → isResumeFromUI=true → onResume 또 발동 (매 프레임 발동!)
 *
 *     영향:
 *       onResume에 사운드 재생, HUD 갱신, 애니메이션 트리거 등이 연결되어 있으면
 *       플레이 중 매 프레임 해당 효과가 반복 실행됨.
 *
 *   기존 BUG-5 수정 (이전 패치에서 완료):
 *     playing 복귀 시 _firedLevelUp, _firedDead 모두 초기화
 *
 * 상태 전이 다이어그램:
 *   playing → levelup : _firedLevelUp=true, _firedDead=false,  _prev='levelup'
 *   playing → dead    : _firedDead=true,    _firedLevelUp=false, _prev='dead'
 *   levelup → playing : _firedLevelUp=false, _firedDead=false,  _prev='playing'  ← FIX
 *   dead    → playing : _firedLevelUp=false, _firedDead=false,  _prev='playing'  ← FIX
 *   any     → paused  : 플래그 변경 없음, _prev='paused'
 */
export class PlayModeStateMachine {
  /**
   * @param {object} handlers
   * @param {() => void} handlers.onLevelUp  - playMode === 'levelup' 최초 진입 시 호출
   * @param {() => void} handlers.onDead     - playMode === 'dead'    최초 진입 시 호출
   * @param {() => void} [handlers.onResume] - playMode === 'playing' 복귀 시 호출 (선택)
   */
  constructor({ onLevelUp, onDead, onResume = null } = {}) {
    this._onLevelUp = onLevelUp;
    this._onDead    = onDead;
    this._onResume  = onResume;

    /** @type {'playing'|'levelup'|'dead'|'paused'} */
    this._prev = 'playing';

    this._firedLevelUp = false;
    this._firedDead    = false;
  }

  /**
   * 프레임마다 호출한다.
   * 반환값이 true 이면 호출자(PlayScene.update)는 이후 처리를 skip해야 한다.
   *
   * @param {'playing'|'levelup'|'paused'|'dead'} currentMode
   * @returns {boolean} true = 이 프레임 파이프라인 실행 중단
   */
  tick(currentMode) {
    if (currentMode === 'levelup') {
      if (!this._firedLevelUp) {
        this._firedLevelUp = true;
        this._firedDead    = false;
        this._onLevelUp?.();
      }
      this._prev = 'levelup';
      return true;
    }

    if (currentMode === 'dead') {
      if (!this._firedDead) {
        this._firedDead    = true;
        this._firedLevelUp = false;
        this._onDead?.();
      }
      this._prev = 'dead';
      return true;
    }

    if (currentMode === 'paused') {
      this._prev = 'paused';
      return true;
    }

    // playing 복귀
    if (currentMode === 'playing' && this._prev !== 'playing') {
      // FIX(BUG-3 기존): dead/levelup에서 playing 복귀 시에만 onResume 발동.
      // paused → (dead 경유 없이) → playing 복귀는 onResume 발동 허용.
      // paused → dead 발생 후 → playing은 onResume 오발동 방지.
      const isResumeFromPause =
        this._prev === 'paused' && !this._firedDead && !this._firedLevelUp;
      const isResumeFromUI =
        this._prev === 'levelup' || this._prev === 'dead';

      this._firedLevelUp = false;
      this._firedDead    = false;

      if (isResumeFromPause || isResumeFromUI) {
        this._onResume?.();
      }
    }

    // FIX(BUG-7): _prev를 'playing'으로 반드시 갱신
    // Before (버그): 이 줄이 누락되어 _prev가 이전 상태('levelup'/'dead' 등)로 유지됨
    //               → 다음 프레임에서도 _prev !== 'playing' 조건이 계속 충족
    //               → onResume이 매 프레임 반복 발동
    // After (수정): 정상적으로 _prev = 'playing'으로 전환됨
    this._prev = 'playing';  // ← FIX(BUG-7)
    return false;
  }

  /**
   * 외부에서 상태를 강제 초기화할 때 사용 (PlayScene.exit() 등).
   */
  reset() {
    this._prev         = 'playing';
    this._firedLevelUp = false;
    this._firedDead    = false;
  }
}
