/**
 * src/scenes/CodexScene.js — 도감 씬
 *
 * TitleScene 또는 PauseView에서 진입.
 * 게임 진행 중 조우한 적·획득한 무기·런 기록을 열람할 수 있다.
 *
 * 진입 예시 (TitleScene):
 *   import { CodexScene } from './CodexScene.js';
 *   this.game.sceneManager.changeScene(new CodexScene(this.game, 'title'));
 *
 * 진입 예시 (PauseView 등 다른 씬):
 *   new CodexScene(this.game, 'play')
 *
 * session.meta 확장 필드:
 *   session.meta.enemyKills        : Record<string, number>  — 적 ID → 처치 수
 *   session.meta.enemiesEncountered: string[]                — 발견한 적 ID 목록
 *   session.meta.killedBosses      : string[]                — 처치한 보스 ID 목록
 *   session.meta.weaponsUsedAll    : string[]                — 한 번이라도 사용한 무기 ID 목록
 *   session.meta.accessoriesOwnedAll: string[]               — 한 번이라도 획득한 장신구 ID 목록
 *   session.meta.evolvedWeapons    : string[]                — 진화시킨 무기 ID 목록
 *   session.meta.totalRuns         : number                  — 총 런 수
 *
 * 위 필드들은 DeathSystem / WeaponSystem 등에서 이벤트 핸들러로 채워야 합니다.
 * 예시 핸들러 (PipelineBuilder._registerEventHandlers):
 *   registry.register('deaths', ({ entity }) => {
 *     if (entity.type !== 'enemy') return;
 *     const kills = session.meta.enemyKills ??= {};
 *     kills[entity.enemyDataId] = (kills[entity.enemyDataId] ?? 0) + 1;
 *   });
 */

import { CodexView }    from '../ui/codex/CodexView.js';
import { mountUI }      from '../ui/dom/mountUI.js';
import { ensureCodexMeta, reconcileSessionUnlocks } from '../state/sessionMeta.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';

export class CodexScene {
  /**
   * @param {import('../core/Game.js').Game} game
   * @param {'title'|'play'|'metashop'} [from='title']  돌아갈 씬 힌트
   */
  constructor(game, from = 'title') {
    this.game  = game;
    this.sceneId = 'CodexScene';
    this._from = from;
    this._view = null;
    this._nav  = createSceneNavigationGuard();
  }

  enter() {
    this._nav.reset();

    ensureCodexMeta(this.game.session);
    reconcileSessionUnlocks(this.game.session);

    const gameData  = this.game.gameData;
    const container = mountUI();

    this._view = new CodexView(container);
    this._view.show(
      gameData,
      this.game.session,
      () => this._goBack(),
    );
  }

  update() {}

  render() {
    if (this.game.renderer) {
      this.game.renderer.clear();
      this.game.renderer.drawBackground({ x: 0, y: 0 });
    }
  }

  exit() {
    this._view?.destroy();
    this._view = null;
  }

  // ── 내부 처리 ──────────────────────────────────────────────────────────────

  /** 진입 출처에 따라 적절한 씬으로 복귀한다. */
  async _goBack() {
    await this._nav.load(async () => {
      if (this._from === 'metashop') {
        return import('./MetaShopScene.js');
      } else {
        return import('./TitleScene.js');
      }
    }, (mod) => {
      const SceneClass = this._from === 'metashop' ? mod.MetaShopScene : mod.TitleScene;
      this.game.sceneManager.changeScene(new SceneClass(this.game));
    }, (e) => {
      console.error('[CodexScene] 씬 전환 실패:', e);
    });
  }
}
