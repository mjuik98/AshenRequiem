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

export function bindMetaShopViewRuntime(view) {
  const root = view?.el;
  if (!root?.addEventListener) return () => {};

  const onClick = (event) => {
    const target = event.target;
    const selectButton = findClassTarget(root, target, 'ms-select-btn');
    if (selectButton) {
      view._selectedUpgradeId = selectButton.dataset.selectId ?? null;
      view._render(view._session);
      return;
    }

    const filterButton = findClassTarget(root, target, 'ms-filter-tab');
    if (filterButton) {
      view._activeCategory = filterButton.dataset.filterId ?? 'all';
      view._render(view._session);
      return;
    }

    const sortButton = findClassTarget(root, target, 'ms-sort-btn');
    if (sortButton) {
      view._activeSort = sortButton.dataset.sortId ?? 'recommended';
      view._render(view._session);
      return;
    }

    const buyButton = findClassTarget(root, target, 'ms-buy-btn');
    if (buyButton && buyButton.disabled !== true) {
      view._onPurchase?.(buyButton.dataset.id || view._selectedUpgradeId);
      return;
    }

    if (findClassTarget(root, target, 'ms-back-btn')) {
      view._onBack?.();
    }
  };

  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('click', onClick);
  };
}
