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
  exportSessionSnapshot,
  importSessionSnapshot,
  inspectStoredSessionSnapshots,
  previewSessionSnapshotImport,
  resetSessionProgress,
  restoreStoredSessionSnapshot,
  saveSettingsAndApplyRuntime,
} from '../app/meta/settingsApplicationService.js';
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
    this._view = new SettingsView(container);
    this._view.show(
      this.game.session,
      {
        onSave: (newOpts) => this._handleSave(newOpts),
        onBack: () => this._goToTitle(),
        onExport: () => exportSessionSnapshot({ session: this.game.session }),
        onInspect: () => this._handleInspectStorage(),
        onPreviewImport: (rawSnapshot) => this._handlePreviewImport(rawSnapshot),
        onImport: (rawSnapshot) => this._handleImport(rawSnapshot),
        onReset: () => this._handleReset(),
        onRestoreBackup: () => this._handleRestoreBackup(),
      },
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
    saveSettingsAndApplyRuntime({
      session: this.game.session,
      nextOptions: newOpts,
      ...this._createRuntimeDeps(),
    });

    this._goToTitle();
  }

  _handleImport(rawSnapshot) {
    try {
      importSessionSnapshot({
        session: this.game.session,
        rawSnapshot,
        ...this._createRuntimeDeps(),
      });

      return {
        snapshot: exportSessionSnapshot({ session: this.game.session }),
        options: this.game.session.options,
        message: '세션 데이터를 가져왔습니다.',
        detailLines: [],
      };
    } catch (error) {
      logRuntimeError('SettingsScene', '세션 가져오기 실패:', error);
      return {
        snapshot: rawSnapshot,
        message: '세션 데이터를 가져오지 못했습니다. JSON 형식을 확인하세요.',
        detailLines: [],
      };
    }
  }

  _handlePreviewImport(rawSnapshot) {
    try {
      const preview = previewSessionSnapshotImport({
        session: this.game.session,
        rawSnapshot,
      });
      return {
        snapshot: rawSnapshot,
        options: this.game.session.options,
        message: '가져오기 미리보기를 생성했습니다.',
        detailLines: preview.diffLines.length > 0
          ? preview.diffLines
          : ['현재 세션과 차이가 없습니다.'],
      };
    } catch (error) {
      logRuntimeError('SettingsScene', '세션 미리보기 실패:', error);
      return {
        snapshot: rawSnapshot,
        message: '세션 미리보기를 생성하지 못했습니다. JSON 형식을 확인하세요.',
        detailLines: [],
      };
    }
  }

  _handleReset() {
    resetSessionProgress({
      session: this.game.session,
      ...this._createRuntimeDeps(),
    });

    return {
      snapshot: exportSessionSnapshot({ session: this.game.session }),
      options: this.game.session.options,
      message: '진행 데이터를 초기화했습니다. 옵션과 현재 시작 설정은 유지됩니다.',
      detailLines: [],
    };
  }

  _handleInspectStorage() {
    const inspection = inspectStoredSessionSnapshots();
    const primaryText = inspection.primary.status === 'ok'
      ? `primary 재화 ${inspection.primary.session.meta?.currency ?? 0}`
      : `primary ${inspection.primary.status}`;
    const backupText = inspection.backup.status === 'ok'
      ? `backup 재화 ${inspection.backup.session.meta?.currency ?? 0}`
      : `backup ${inspection.backup.status}`;
    const corruptText = inspection.corrupt.status === 'missing'
      ? 'corrupt 없음'
      : `corrupt ${inspection.corrupt.status}`;

    return {
      snapshot: this._view ? exportSessionSnapshot({ session: this.game.session }) : '',
      options: this.game.session.options,
      message: `${primaryText} · ${backupText} · ${corruptText}`,
      detailLines: [],
    };
  }

  _handleRestoreBackup() {
    try {
      restoreStoredSessionSnapshot({
        session: this.game.session,
        target: 'backup',
        ...this._createRuntimeDeps(),
      });
      return {
        snapshot: exportSessionSnapshot({ session: this.game.session }),
        options: this.game.session.options,
        message: 'backup 슬롯에서 세션을 복구했습니다.',
        detailLines: [],
      };
    } catch (error) {
      logRuntimeError('SettingsScene', 'backup restore 실패:', error);
      return {
        snapshot: exportSessionSnapshot({ session: this.game.session }),
        message: 'backup 슬롯을 복구하지 못했습니다.',
        detailLines: [],
      };
    }
  }

  /** TitleScene으로 복귀 */
  async _goToTitle() {
    await this._nav.change(() => {
      const nextScene = this.game?.sceneFactory?.createTitleScene?.(this.game);
      this.game.sceneManager.changeScene(nextScene);
    }, (e) => {
      logRuntimeError('SettingsScene', 'TitleScene 로드 실패:', e);
    });
  }

  _createRuntimeDeps() {
    return createSettingsRuntimeDependencies(this.game);
  }
}
