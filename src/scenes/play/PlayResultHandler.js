/**
 * src/scenes/play/PlayResultHandler.js — 런 종료 처리 전담
 *
 * CHANGE: 이번 런 획득 재화(currencyEarned) 추적 추가
 *   생성자에서 시작 재화를 기록 → process() 시 차액으로 획득량 계산
 */
import { updateSessionBest, saveSession } from '../../state/createSessionState.js';
import { unlockData } from '../../data/unlockData.js';
import { evaluateUnlocks } from '../../systems/progression/unlockEvaluator.js';

export class PlayResultHandler {
  /**
   * @param {import('../../state/createSessionState.js').SessionState} session
   */
  constructor(session) {
    this._session      = session;
    // CHANGE: 런 시작 시점의 재화 기록 (이번 런 획득량 계산용)
    this._startCurrency = session.meta.currency;
  }

  /**
   * 런 종료 처리: 세션 갱신 → 저장 → 결과 객체 반환.
   *
   * @param {import('../../state/worldTypes.js').WorldState} world
   * @returns {{
   *   killCount: number, survivalTime: number, level: number,
   *   outcome: 'victory'|'defeat',
   *   currencyEarned: number, totalCurrency: number
   * }}
   */
  process(world) {
    const outcome = world.runOutcome?.type ?? 'defeat';
    const runResult = {
      kills:        world.killCount,
      survivalTime: world.elapsedTime,
      level:        world.player?.level ?? 1,
      weaponsUsed:  (world.player?.weapons ?? []).map(w => w.id),
    };

    updateSessionBest(this._session, runResult);
    const unlockResult = evaluateUnlocks({
      session: this._session,
      runResult,
      unlockData,
    });
    this._session.meta.completedUnlocks = _appendUnique(
      this._session.meta.completedUnlocks,
      unlockResult.newlyCompletedUnlocks,
    );
    this._session.meta.unlockedWeapons = _appendUnique(
      this._session.meta.unlockedWeapons,
      unlockResult.newlyUnlockedWeapons,
    );
    this._session.meta.unlockedAccessories = _appendUnique(
      this._session.meta.unlockedAccessories,
      unlockResult.newlyUnlockedAccessories,
    );
    saveSession(this._session);

    // CHANGE: 획득 재화 = 현재 재화 - 런 시작 재화
    const currencyEarned = Math.max(0, this._session.meta.currency - this._startCurrency);

    return {
      killCount:      runResult.kills,
      survivalTime:   runResult.survivalTime,
      level:          runResult.level,
      outcome,
      currencyEarned,
      totalCurrency:  this._session.meta.currency,
    };
  }
}

function _appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}
