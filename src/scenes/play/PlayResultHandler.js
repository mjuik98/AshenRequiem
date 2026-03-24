/**
 * src/scenes/play/PlayResultHandler.js — 런 종료 처리 전담
 *
 * CHANGE: 결과 화면 확장 데이터 반환
 *   - 이전 최고 기록 스냅샷
 *   - 사용 무기 요약
 *   - 이번 런 신규 해금 rewardText
 *   - 기존 재화 추적 로직 유지
 */
import { updateSessionBest } from '../../state/createSessionState.js';
import { unlockData } from '../../data/unlockData.js';
import { evaluateUnlocks } from '../../systems/progression/unlockEvaluator.js';
import { appendUnique, ensureCodexMeta } from '../../state/sessionMeta.js';
import { persistSession } from '../../state/sessionFacade.js';

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
    const outcome = world.runOutcome?.type ?? 'defeat';
    ensureCodexMeta(this._session);
    this._session.meta.totalRuns = (this._session.meta.totalRuns ?? 0) + 1;

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
    this._session.meta.completedUnlocks = appendUnique(
      this._session.meta.completedUnlocks,
      unlockResult.newlyCompletedUnlocks,
    );
    this._session.meta.unlockedWeapons = appendUnique(
      this._session.meta.unlockedWeapons,
      unlockResult.newlyUnlockedWeapons,
    );
    this._session.meta.unlockedAccessories = appendUnique(
      this._session.meta.unlockedAccessories,
      unlockResult.newlyUnlockedAccessories,
    );
    persistSession(this._session);

    // CHANGE: 획득 재화 = 현재 재화 - 런 시작 재화
    const currencyEarned = Math.max(
      0,
      world.runCurrencyEarned ?? 0,
      this._session.meta.currency - this._startCurrency,
    );
    const weapons = (world.player?.weapons ?? []).map((weapon) => ({
      name: weapon.name ?? weapon.id,
      level: weapon.level ?? 1,
      isEvolved: Boolean(weapon.isEvolved),
    }));
    const newUnlocks = unlockResult.newlyCompletedUnlocks
      .map((unlockId) => unlockData.find((unlock) => unlock.id === unlockId)?.rewardText)
      .filter(Boolean);

    return {
      killCount:      runResult.kills,
      survivalTime:   runResult.survivalTime,
      level:          runResult.level,
      outcome,
      currencyEarned,
      totalCurrency:  this._session.meta.currency,
      bestTime:       this._prevBestTime,
      bestLevel:      this._prevBestLevel,
      bestKills:      this._prevBestKills,
      weapons,
      newUnlocks,
    };
  }
}
