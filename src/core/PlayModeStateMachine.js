/**
 * PlayModeStateMachine — PlayScene UI 전환 상태 머신
 *
 * WHY(P0):
 *   PlayScene에 _levelUpShown, _deadShown 플래그가 직접 존재하면
 *   씬이 커질수록 "이 플래그는 true인데 저건 false" 조합 버그가 누적된다.
 *   UI 전환 책임을 이 클래스에 위임하면:
 *     - Scene은 "어떤 모드인가"만 알고
 *     - "어떤 UI를 켰는가"는 StateMachine이 관리한다.
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

    // 각 상태에 대해 콜백을 이미 호출했는지 여부
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

    if (currentMode === 'playing' && this._prev !== 'playing') {
      this._firedLevelUp = false;
      this._onResume?.();
    }

    this._prev = currentMode;
    return false;
  }

  reset() {
    this._prev         = 'playing';
    this._firedLevelUp = false;
    this._firedDead    = false;
  }

  get isLevelUpActive() { return this._firedLevelUp; }
  get isDeadActive()    { return this._firedDead; }
}
