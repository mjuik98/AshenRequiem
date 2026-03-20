/**
 * MetaShopScene — 영구 강화 상점 씬
 *
 * 흐름:
 *   게임 종료 → ResultView "강화 상점" 버튼 → MetaShopScene
 *   구매 완료 or "게임 시작" 버튼 → PlayScene
 *
 * 규칙:
 *   Session 수정은 purchasePermanentUpgrade() + saveSession() 경유
 *   씬은 흐름 제어만 담당
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
      ()   => this._startGame(),
    );
  }

  update() {}
  render() {
    // 배경만 클리어 (캔버스 아티팩트 방지)
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

  _startGame() {
    // 동적 import로 순환 참조 회피
    import('./PlayScene.js').then(({ PlayScene }) => {
      this.game.sceneManager.changeScene(new PlayScene(this.game));
    });
  }
}
