/**
 * src/scenes/play/PlayResultHandler.js — 런 종료 처리 전담 (신규)
 *
 * REFACTOR: PlayScene 세션 저장 책임 분리
 *   Before: PlayScene._showResultUI() 가 직접 updateSessionBest, saveSession 호출
 *           → PlayScene이 UI 표시 + 세션 저장 두 가지 책임을 가짐
 *           → 필드명 실수(BUG-2)가 발생하기 쉬운 구조
 *
 *   After:  PlayResultHandler 가 런 종료 처리를 단일 책임으로 관리
 *           → process(world) 한 번 호출로 세션 갱신 + 저장 + 결과 객체 반환
 *           → PlayScene 은 this._resultHandler.process(world) 결과를 UI에 넘기기만 함
 *
 * BUGFIX 포함 (BUG-2):
 *   updateSessionBest 에 전달하는 필드명 계약을 이 클래스가 보장.
 *   createSessionState.js 의 { kills, survivalTime, level } 계약과 일치.
 *
 * 사용법 (PlayScene.enter()):
 *   this._resultHandler = new PlayResultHandler(this.game.session);
 *
 * 사용법 (PlayScene._showResultUI()):
 *   const stats = this._resultHandler.process(this.world);
 *   this._ui.showResult(stats, () => { ... });
 */

import { updateSessionBest, saveSession } from '../../state/createSessionState.js';

export class PlayResultHandler {
  /**
   * @param {import('../../state/createSessionState.js').SessionState} session
   */
  constructor(session) {
    this._session = session;
  }

  /**
   * 런 종료 처리: 세션 갱신 → 저장 → 결과 객체 반환.
   *
   * @param {import('../../state/worldTypes.js').WorldState} world
   * @returns {{ killCount: number, survivalTime: number, level: number }}
   */
  process(world) {
    const runResult = {
      kills:        world.killCount,
      survivalTime: world.elapsedTime,
      level:        world.player?.level ?? 1,
      weaponsUsed:  (world.player?.weapons ?? []).map(w => w.id),
    };

    updateSessionBest(this._session, runResult);
    saveSession(this._session);

    // ResultView 에 전달하는 stats 형식 반환
    return {
      killCount:    runResult.kills,
      survivalTime: runResult.survivalTime,
      level:        runResult.level,
    };
  }
}
