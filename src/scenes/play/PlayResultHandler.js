import { processPlayResult } from './playResultRuntime.js';

export class PlayResultHandler {
  /**
   * @param {import('../../state/createSessionState.js').SessionState} session
   */
  constructor(session) {
    this._session      = session;
    this._startCurrency = session.meta.currency;
    this._prevBestTime = session.best?.survivalTime ?? 0;
    this._prevBestLevel = session.best?.level ?? 1;
    this._prevBestKills = session.best?.kills ?? 0;
  }

  /**
   * 런 종료 처리: 세션 갱신 → 저장 → 결과 객체 반환.
   *
   * @param {import('../../state/worldTypes.js').WorldState} world
   * @returns {{
   *   killCount: number, survivalTime: number, level: number,
   *   outcome: 'victory'|'defeat',
   *   currencyEarned: number, totalCurrency: number,
   *   bestTime: number, bestLevel: number, bestKills: number,
   *   weapons: Array<{ name: string, level: number, isEvolved: boolean }>,
   *   newUnlocks: string[]
   * }}
   */
  process(world) {
    return processPlayResult(world, this._session, {
      startCurrency: this._startCurrency,
      prevBestTime: this._prevBestTime,
      prevBestLevel: this._prevBestLevel,
      prevBestKills: this._prevBestKills,
    });
  }
}
