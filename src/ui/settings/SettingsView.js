import {
  normalizeSessionOptions,
} from '../../state/sessionOptions.js';
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';
import {
  renderSettingsAudioSection,
  renderSettingsControlsSection,
  renderSettingsDataSection,
  renderSettingsDisplaySection,
  renderSettingsGraphicsSection,
} from './settingsViewSections.js';
import {
  SETTINGS_VIEW_CSS,
  SETTINGS_VIEW_STYLE_ID,
} from './settingsViewStyles.js';
import {
  bindSettingsViewRuntime,
  syncSettingsViewRuntime,
} from './settingsViewRuntime.js';
import {
  syncSettingsShellState,
} from './settingsViewRenderState.js';

/**
 * SettingsView — 설정 화면 DOM UI
 *
 * show(session, onSave, onBack) 호출로 초기화.
 * 사용자 조작은 내부 _opts에 즉시 반영되어 탭 전환 시에도 값이 유지된다.
 * 저장 버튼 클릭 시 onSave(newOptions) 콜백으로 최종값 전달.
 */

export class SettingsView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'sv-root ss-root';
    this._onSave = null;
    this._onBack = null;
    this._handlers = {};
    this._opts = normalizeSessionOptions();
    this._tab = 'audio';
    this._dialogRuntime = null;
    this._dataState = {
      importText: '',
      statusText: '',
      detailLines: [],
    };
    this._shellRefs = null;
    this._disposeRuntime = bindSettingsViewRuntime(this);
    this._injectStyles();
    container.appendChild(this.el);
  }

  show(session, onSave, onBack) {
    const handlers = this._normalizeHandlers(onSave, onBack);
    this._onSave = handlers.onSave;
    this._onBack = handlers.onBack;
    this._handlers = handlers;
    this._opts = normalizeSessionOptions(session.options ?? {});
    this._render();
    this._dialogRuntime = replaceDialogRuntime(this._dialogRuntime, {
      root: this.el,
      panelSelector: '.sv-panel',
      onRequestClose: () => this._onBack?.(),
    });
    this._dialogRuntime.focusInitial();
  }

  refresh(session) {
    this._opts = normalizeSessionOptions(session.options ?? {});
    this._render();
  }

  destroy() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime);
    this._disposeRuntime?.();
    this._shellRefs = null;
    this.el.remove();
  }

  _render() {
    syncSettingsShellState(this, {
      sectionHtml: this._renderActiveSection(),
    });
    syncSettingsViewRuntime(this);
  }

  _renderActiveSection() {
    if (this._tab === 'audio') return renderSettingsAudioSection(this._opts);
    if (this._tab === 'graphics') return renderSettingsGraphicsSection(this._opts);
    if (this._tab === 'display') return renderSettingsDisplaySection(this._opts);
    if (this._tab === 'data') return renderSettingsDataSection(this._dataState);
    return renderSettingsControlsSection(this._opts);
  }

  _normalizeHandlers(onSave, onBack) {
    if (typeof onSave === 'function' || typeof onBack === 'function') {
      return {
        onSave,
        onBack,
        onExport: null,
        onInspect: null,
        onPreviewImport: null,
        onImport: null,
        onReset: null,
        onRestoreBackup: null,
      };
    }

    const handlers = onSave ?? {};
    return {
      onSave: handlers.onSave ?? null,
      onBack: handlers.onBack ?? null,
      onExport: handlers.onExport ?? null,
      onInspect: handlers.onInspect ?? null,
      onPreviewImport: handlers.onPreviewImport ?? null,
      onImport: handlers.onImport ?? null,
      onReset: handlers.onReset ?? null,
      onRestoreBackup: handlers.onRestoreBackup ?? null,
    };
  }

  _applyDataResult(result, fallbackStatus) {
    if (!result) return;

    if (typeof result.snapshot === 'string') {
      this._dataState.importText = result.snapshot;
    }

    this._dataState.statusText = result.message ?? fallbackStatus;
    this._dataState.detailLines = Array.isArray(result.detailLines) ? [...result.detailLines] : [];

    if (result.options) {
      this._opts = normalizeSessionOptions(result.options);
    }

    this._render();
  }

  _injectStyles() {
    if (document.getElementById(SETTINGS_VIEW_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SETTINGS_VIEW_STYLE_ID;
    style.textContent = SETTINGS_VIEW_CSS;
    document.head.appendChild(style);
  }
}
