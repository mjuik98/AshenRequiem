/**
 * SettingsScene — 설정 화면 씬
 *
 * TitleScene에서 진입. 변경사항 저장 후 TitleScene으로 복귀한다.
 * "저장" 클릭 시:
 *   1. session.options 업데이트 + localStorage 저장
 *   2. bootstrap 경계가 주입한 resize capability로 DPR 변경을 즉시 반영
 *   3. 오디오/품질 설정은 다음 PlayScene.enter() 시 반영
 */
import { SettingsView }    from '../ui/settings/SettingsView.js';
import { mountUI }         from '../ui/dom/mountUI.js';
import { createSettingsSceneHandlers } from '../app/session/settingsSceneApplicationService.js';
import { createSceneNavigationGuard } from './sceneNavigation.js';
import { createSettingsRuntimeDependencies } from './settingsRuntimeDependencies.js';
import { logRuntimeError } from '../utils/runtimeLogger.js';

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
    const handlers = createSettingsSceneHandlers({
      session: this.game.session,
      createRuntimeDeps: () => createSettingsRuntimeDependencies(this.game),
      onRequestClose: () => this._goToTitle(),
      isNavigating: () => this._nav.isNavigating(),
    });
    this._view = new SettingsView(container);
    this._view.show(
      this.game.session,
      handlers,
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

  /** TitleScene으로 복귀 */
  async _goToTitle() {
    await this._nav.change(() => {
      const nextScene = this.game?.sceneFactory?.createTitleScene?.(this.game);
      this.game.sceneManager.changeScene(nextScene);
    }, (e) => {
      logRuntimeError('SettingsScene', 'TitleScene 로드 실패:', e);
    });
  }
}
