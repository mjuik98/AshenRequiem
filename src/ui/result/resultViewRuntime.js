import { renderResultViewMarkup } from './resultViewMarkup.js';

function findActionTarget(root, target, selector) {
  if (!root?.contains?.(target)) return null;
  if (typeof target?.closest === 'function') {
    const matched = target.closest(selector);
    if (matched && root.contains(matched)) return matched;
  }
  if (typeof target?.matches === 'function' && target.matches(selector)) return target;
  if (selector.startsWith('.') && typeof target?.className === 'string') {
    const className = selector.slice(1);
    return target.className.split(/\s+/).includes(className) ? target : null;
  }
  return null;
}

export function bindResultViewRuntime(view) {
  const root = view?.el;
  if (!root?.addEventListener) return () => {};

  const onClick = (event) => {
    const target = event?.target ?? null;
    if (findActionTarget(root, target, '.result-restart-btn')) {
      const onRestart = view._onRestart;
      view.hide();
      onRestart?.();
      return;
    }

    if (findActionTarget(root, target, '.result-title-btn')) {
      const onTitle = view._onTitle;
      view.hide();
      onTitle?.();
    }
  };

  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('click', onClick);
  };
}

export function renderResultViewRuntime(view, stats, {
  onTitleCallback = null,
  renderMarkupImpl = renderResultViewMarkup,
} = {}) {
  view.el.innerHTML = renderMarkupImpl(stats, { onTitleCallback });
}
