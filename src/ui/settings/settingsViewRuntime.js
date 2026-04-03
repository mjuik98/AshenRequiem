import {
  SESSION_OPTION_DEFAULTS,
  normalizeSessionOptions,
} from '../../state/sessionOptions.js';

const OPTION_DEFAULTS = normalizeSessionOptions(SESSION_OPTION_DEFAULTS);

function hasClass(target, className) {
  return typeof target?.className === 'string'
    && target.className.split(/\s+/).includes(className);
}

function findClassTarget(root, target, className) {
  if (typeof target?.closest === 'function') {
    const matched = target.closest(`.${className}`);
    if (matched && root?.contains?.(matched)) return matched;
  }
  return hasClass(target, className) ? target : null;
}

function findActionTarget(root, target) {
  if (typeof target?.closest === 'function') {
    const matched = target.closest('[data-action]');
    if (matched && root?.contains?.(matched)) return matched;
  }
  return typeof target?.dataset?.action === 'string' ? target : null;
}

function focusSibling(root, selector, offset, currentTarget) {
  const items = [...root.querySelectorAll(selector)];
  const index = items.indexOf(currentTarget);
  if (index < 0 || items.length <= 0) return;
  items[(index + offset + items.length) % items.length]?.focus?.();
}

function activateSettingsTab(view, tabId) {
  if (typeof tabId !== 'string' || tabId.length <= 0) return;
  view._tab = tabId;
  view._render();
}

function toggleSettingsSwitch(view, toggleEl) {
  const key = toggleEl?.dataset?.key;
  if (typeof key !== 'string' || key.length <= 0) return;
  view._opts[key] = !view._opts[key];
  toggleEl.classList.toggle('sv-switch-on', view._opts[key]);
  toggleEl.setAttribute('aria-checked', String(view._opts[key]));
}

function selectSettingsQuality(view, qualityId) {
  if (typeof qualityId !== 'string' || qualityId.length <= 0) return;
  view._opts.quality = qualityId;
  view.el.querySelectorAll('.sv-quality-card').forEach((qualityCard) => {
    const active = qualityCard.dataset.quality === view._opts.quality;
    qualityCard.classList.toggle('sv-quality-active', active);
    qualityCard.setAttribute('aria-checked', String(active));
    qualityCard.tabIndex = active ? 0 : -1;
  });
}

function runSettingsDataAction(view, actionId) {
  if (actionId === 'export-session') {
    const snapshot = view._handlers.onExport?.();
    if (typeof snapshot === 'string') {
      view._dataState.importText = snapshot;
      view._dataState.statusText = '현재 세션 스냅샷을 내보냈습니다.';
      view._dataState.detailLines = [];
      view._render();
    }
    return;
  }

  if (actionId === 'inspect-storage') {
    const result = view._handlers.onInspect?.();
    view._applyDataResult(result, '저장소 슬롯 상태를 분석했습니다.');
    return;
  }

  if (actionId === 'preview-import') {
    const result = view._handlers.onPreviewImport?.(view._dataState.importText);
    view._applyDataResult(result, '세션 스냅샷 미리보기를 생성했습니다.');
    return;
  }

  if (actionId === 'restore-backup') {
    const result = view._handlers.onRestoreBackup?.();
    view._applyDataResult(result, 'backup 슬롯으로부터 세션을 복구했습니다.');
    return;
  }

  if (actionId === 'import-session') {
    const result = view._handlers.onImport?.(view._dataState.importText);
    view._applyDataResult(result, '세션 스냅샷을 가져왔습니다.');
    return;
  }

  if (actionId === 'reset-session') {
    const result = view._handlers.onReset?.();
    view._applyDataResult(result, '진행 데이터를 초기화했습니다.');
  }
}

export function syncSettingsViewRuntime(view) {
  const dataTextarea = view.el.querySelector('.sv-data-textarea');
  if (dataTextarea) {
    dataTextarea.value = view._dataState.importText;
  }
}

export function bindSettingsViewRuntime(view) {
  const root = view?.el;
  if (!root?.addEventListener) return () => {};

  const onClick = (event) => {
    const target = event.target;
    const navItem = findClassTarget(root, target, 'sv-nav-item');
    if (navItem) {
      activateSettingsTab(view, navItem.dataset.tab);
      return;
    }

    const switchTarget = findClassTarget(root, target, 'sv-switch');
    if (switchTarget) {
      toggleSettingsSwitch(view, switchTarget);
      return;
    }

    const qualityCard = findClassTarget(root, target, 'sv-quality-card');
    if (qualityCard) {
      selectSettingsQuality(view, qualityCard.dataset.quality);
      return;
    }

    const actionTarget = findActionTarget(root, target);
    if (actionTarget) {
      runSettingsDataAction(view, actionTarget.dataset.action);
      return;
    }

    if (findClassTarget(root, target, 'sv-btn-primary')) {
      view._onSave?.({ ...view._opts });
      return;
    }

    if (findClassTarget(root, target, 'sv-btn-back')) {
      view._onBack?.();
      return;
    }

    if (findClassTarget(root, target, 'sv-btn-reset')) {
      view._opts = normalizeSessionOptions(OPTION_DEFAULTS);
      view._render();
    }
  };

  const onKeyDown = (event) => {
    const target = event.target;
    const navItem = findClassTarget(root, target, 'sv-nav-item');
    if (navItem) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateSettingsTab(view, navItem.dataset.tab);
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        focusSibling(root, '.sv-nav-item', 1, navItem);
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        focusSibling(root, '.sv-nav-item', -1, navItem);
        return;
      }
    }

    const switchTarget = findClassTarget(root, target, 'sv-switch');
    if (switchTarget && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      toggleSettingsSwitch(view, switchTarget);
      return;
    }

    const qualityCard = findClassTarget(root, target, 'sv-quality-card');
    if (!qualityCard) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectSettingsQuality(view, qualityCard.dataset.quality);
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusSibling(root, '.sv-quality-card', 1, qualityCard);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusSibling(root, '.sv-quality-card', -1, qualityCard);
    }
  };

  const onInput = (event) => {
    const target = event.target;
    const slider = findClassTarget(root, target, 'sv-slider');
    if (slider) {
      const key = slider.dataset.key;
      view._opts[key] = Number(slider.value);
      const valueEl = root.querySelector(`#sv-val-${key}`);
      if (valueEl) valueEl.textContent = slider.value;
      return;
    }

    const dataTextarea = findClassTarget(root, target, 'sv-data-textarea');
    if (dataTextarea) {
      view._dataState.importText = dataTextarea.value;
    }
  };

  const onChange = (event) => {
    const target = findClassTarget(root, event.target, 'sv-binding-select');
    if (!target) return;

    const action = target.dataset.bindingAction;
    const slotIndex = Number(target.dataset.bindingSlot ?? 0);
    const keyBindings = {
      ...(view._opts.keyBindings ?? {}),
      [action]: [...(view._opts.keyBindings?.[action] ?? [])],
    };
    keyBindings[action][slotIndex] = target.value;
    keyBindings[action] = keyBindings[action].filter(Boolean);
    view._opts = normalizeSessionOptions({
      ...view._opts,
      keyBindings,
    });
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onChange);
  };
}
