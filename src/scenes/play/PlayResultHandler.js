import { createPlayResultApplicationService } from '../../app/play/playResultApplicationService.js';

export class PlayResultHandler {
  /**
   * @param {import('../../state/createSessionState.js').SessionState} session
   */
  constructor(session) {
    this._service = createPlayResultApplicationService(session);
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
    return this._service.process(world);
  }
}
