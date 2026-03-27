/**
 * MetaShopScene — 영구 강화 상점 씬
 *
 * CHANGE: "게임 시작" → "메인화면으로" 복귀 버튼 대응
 *   onBack 콜백 → TitleScene으로 복귀
 */
import { MetaShopView }            from '../ui/metashop/MetaShopView.js';
import { mountUI }                 from '../ui/dom/mountUI.js';
import { purchaseMetaShopUpgrade } from '../app/meta/metaShopApplicationService.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';
import { loadTitleSceneModule } from './sceneLoaders.js';
import { logRuntimeError } from '../utils/runtimeLogger.js';

export class MetaShopScene {
  constructor(game) {
    this.game  = game;
    this.sceneId = 'MetaShopScene';
    this._view = null;
    this._nav  = createSceneNavigationGuard();
  }

  enter() {
    this._nav.reset();
    const container = mountUI();
    this._view = new MetaShopView(container);
    this._view.show(
      this.game.session,
      (id) => this._handlePurchase(id),
      ()   => this._goToTitle(),
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

  // ── 내부 처리 ──────────────────────────────────────────────────────

  _handlePurchase(upgradeId) {
    const result = purchaseMetaShopUpgrade(this.game.session, upgradeId);

    if (result.success) {
      this._view.refresh(this.game.session);
    }
  }

  /** 메인화면(TitleScene)으로 복귀 */
  async _goToTitle() {
    await this._nav.load(loadTitleSceneModule, ({ TitleScene }) => {
      this.game.sceneManager.changeScene(new TitleScene(this.game));
    }, (e) => {
      logRuntimeError('MetaShopScene', 'TitleScene 로드 실패:', e);
    });
  }
}
