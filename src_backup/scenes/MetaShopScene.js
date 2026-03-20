/**
 * MetaShopScene — 영구 강화 상점 씬
 *
 * CHANGE: "게임 시작" → "메인화면으로" 복귀 버튼 대응
 *   onBack 콜백 → TitleScene으로 복귀
 */
import { MetaShopView }            from '../ui/metashop/MetaShopView.js';
import { getPermanentUpgradeById } from '../data/permanentUpgradeData.js';
import { purchasePermanentUpgrade, saveSession } from '../state/createSessionState.js';
import { mountUI }                 from '../ui/dom/mountUI.js';

export class MetaShopScene {
  constructor(game) {
    this.game  = game;
    this._view = null;
  }

  enter() {
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
    const def = getPermanentUpgradeById(upgradeId);
    if (!def) return;

    const currentLevel = this.game.session.meta.permanentUpgrades[upgradeId] ?? 0;
    if (currentLevel >= def.maxLevel) return;

    const cost    = def.costPerLevel(currentLevel);
    const success = purchasePermanentUpgrade(this.game.session, upgradeId, cost);

    if (success) {
      saveSession(this.game.session);
      this._view.refresh(this.game.session);
    }
  }

  /** 메인화면(TitleScene)으로 복귀 */
  _goToTitle() {
    import('./TitleScene.js').then(({ TitleScene }) => {
      this.game.sceneManager.changeScene(new TitleScene(this.game));
    });
  }
}
