/**
 * MetaShopScene — 영구 강화 상점 씬
 *
 * CHANGE: "게임 시작" → "메인화면으로" 복귀 버튼 대응
 *   onBack 콜백 → TitleScene으로 복귀
 */
import { MetaShopView }            from '../ui/metashop/MetaShopView.js';
import { mountUI }                 from '../ui/dom/mountUI.js';
import { createMetaShopSceneApplicationService } from '../app/meta/metaShopSceneApplicationService.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';
import { logRuntimeError } from '../utils/runtimeLogger.js';

export class MetaShopScene {
  constructor(game) {
    this.game  = game;
    this.sceneId = 'MetaShopScene';
    this._view = null;
    this._nav  = createSceneNavigationGuard();
    this._service = null;
  }

  enter() {
    this._nav.reset();
    this._service = createMetaShopSceneApplicationService({
      session: this.game.session,
      gameData: this.game.gameData,
    });
    const { session, viewOptions } = this._service.getViewPayload();
    const container = mountUI();
    this._view = new MetaShopView(container);
    this._view.show(
      session,
      (id) => this._handlePurchase(id),
      ()   => this._goToTitle(),
      viewOptions,
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
    this._service = null;
  }

  // ── 내부 처리 ──────────────────────────────────────────────────────

  _handlePurchase(upgradeId) {
    const result = this._service?.purchaseUpgrade(upgradeId);

    if (result?.shouldRefresh) {
      this._view.refresh(result.session, result.viewOptions);
    }

    return result;
  }

  /** 메인화면(TitleScene)으로 복귀 */
  async _goToTitle() {
    await this._nav.change(() => {
      const nextScene = this.game?.sceneFactory?.createTitleScene?.(this.game);
      this.game.sceneManager.changeScene(nextScene);
    }, (e) => {
      logRuntimeError('MetaShopScene', 'TitleScene 로드 실패:', e);
    });
  }
}
