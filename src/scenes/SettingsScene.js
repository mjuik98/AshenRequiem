/**
 * SettingsScene — 설정 화면 씬
 *
 * TitleScene에서 진입. 변경사항 저장 후 TitleScene으로 복귀한다.
 * "저장" 클릭 시:
 *   1. session.options 업데이트 + localStorage 저장
 *   2. DPR 변경은 Game._resizeCanvas() 즉시 호출로 반영
 *   3. 오디오/품질 설정은 다음 PlayScene.enter() 시 반영
 */
import { SettingsView }    from '../ui/settings/SettingsView.js';
import { mountUI }         from '../ui/dom/mountUI.js';
import {
  applySessionOptionsToRuntime,
} from '../state/sessionOptions.js';
import { updateSessionOptionsAndSave } from '../state/sessionFacade.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';
import { loadTitleSceneModule } from './sceneLoaders.js';

export class SettingsScene {
  constructor(game) {
    this.game  = game;
    this.sceneId = 'SettingsScene';
    this._view = null;
    this._nav  = createSceneNavigationGuard();
  }

  enter() {
    this._nav.reset();
    const container = mountUI();
    this._view = new SettingsView(container);
    this._view.show(
      this.game.session,
      (newOpts) => this._handleSave(newOpts),
      ()        => this._goToTitle(),
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

  /**
   * 저장 처리:
   *   - session.options 병합 + localStorage 저장
   *   - DPR 변경 즉시 반영 (Game._resizeCanvas)
   *
   * @param {object} newOpts  SettingsView에서 수집된 최신 옵션 객체
   */
  _handleSave(newOpts) {
    if (this._nav.isNavigating()) return;
    updateSessionOptionsAndSave(this.game.session, newOpts);

    // DPR 변경 즉시 적용
    if (typeof this.game._resizeCanvas === 'function') {
      this.game._resizeCanvas();
    }

    applySessionOptionsToRuntime(this.game.session.options, {
      renderer: this.game.renderer,
    });

    this._goToTitle();
  }

  /** TitleScene으로 복귀 */
  async _goToTitle() {
    await this._nav.load(loadTitleSceneModule, ({ TitleScene }) => {
      this.game.sceneManager.changeScene(new TitleScene(this.game));
    }, (e) => {
      console.error('[SettingsScene] TitleScene 로드 실패:', e);
    });
  }
}
