import { createPlayResultApplicationService } from '../../app/play/playResultApplicationService.js';

export function createPlayResultHandler(session, options) {
  return new PlayResultHandler(session, options);
}

export function processPlayResult(session, world, {
  createServiceImpl = createPlayResultApplicationService,
  gameData = null,
} = {}) {
  return createServiceImpl(session, { gameData }).process(world);
}

export class PlayResultHandler {
  /**
   * @param {import('../../state/session/sessionMigrations.js').SessionState} session
   */
  constructor(session, {
    createServiceImpl = createPlayResultApplicationService,
    gameData = null,
  } = {}) {
    this._service = createServiceImpl(session, { gameData });
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
