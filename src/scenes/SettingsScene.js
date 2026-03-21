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
import { saveSession }     from '../state/createSessionState.js';
import { mountUI }         from '../ui/dom/mountUI.js';

export class SettingsScene {
  constructor(game) {
    this.game  = game;
    this._view = null;
    this._isNavigating = false;
    this._sceneChangeToken = 0;
  }

  enter() {
    this._isNavigating = false;
    this._sceneChangeToken += 1;
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
    if (this._isNavigating) return;

    this.game.session.options = {
      ...this.game.session.options,
      ...newOpts,
    };

    saveSession(this.game.session);

    // DPR 변경 즉시 적용
    if (typeof this.game._resizeCanvas === 'function') {
      this.game._resizeCanvas();
    }

    if (typeof this.game.renderer?.setGlowEnabled === 'function') {
      this.game.renderer.setGlowEnabled(this.game.session.options.glowEnabled);
    }
    if (typeof this.game.renderer?.setQualityPreset === 'function') {
      this.game.renderer.setQualityPreset(this.game.session.options.quality);
    }

    this._goToTitle();
  }

  /** TitleScene으로 복귀 */
  async _goToTitle() {
    if (this._isNavigating) return;
    this._isNavigating = true;
    const sceneToken = this._sceneChangeToken;

    try {
      const { TitleScene } = await import('./TitleScene.js');
      if (sceneToken !== this._sceneChangeToken) return;
      this.game.sceneManager.changeScene(new TitleScene(this.game));
    } catch (e) {
      console.error('[SettingsScene] TitleScene 로드 실패:', e);
      this._isNavigating = false;
    }
  }
}
