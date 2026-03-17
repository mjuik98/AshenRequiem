/**
 * PlayModeStateMachine — PlayScene UI 전환 상태 머신
 *
 * BUGFIX:
 *   BUG-5: playing 복귀 시 _firedLevelUp만 false로 초기화하고
 *          _firedDead는 초기화하지 않아 플래그 비대칭 상태 발생.
 *
 *   영향 범위:
 *     현재 게임 구조에서는 dead → playing 전환이 재시작(씬 교체)으로 처리되므로
 *     즉각적인 크래시는 없으나, 향후 부활 아이템 / 치트 모드 / 테스트 시나리오에서
 *     두 번째 사망 이벤트가 onDead 콜백을 발동하지 않는 침묵 버그로 이어짐.
 *
 *   수정: playing 복귀 시 _firedLevelUp, _firedDead 모두 초기화
 *
 * 상태 전이 다이어그램:
 *   playing → levelup : _firedLevelUp=true, _firedDead=false
 *   playing → dead    : _firedDead=true, _firedLevelUp=false
 *   levelup → playing : _firedLevelUp=false, _firedDead=false  ← FIX
 *   dead    → playing : _firedLevelUp=false, _firedDead=false  ← FIX
 *   any     → paused  : 플래그 변경 없음 (일시정지는 재진입 허용)
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
      // FIX(BUG-5): _firedDead도 함께 초기화
      // 이전 코드는 _firedLevelUp만 초기화 → dead → playing 복귀 후
      // 다시 dead가 되어도 _firedDead=true로 남아 onDead가 재발동되지 않음
      this._firedLevelUp = false;
      this._firedDead    = false;
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
