function bindKeyboardActivation(node, activate, { stopPropagation = false } = {}) {
  node.addEventListener('keydown', /** @param {KeyboardEvent} event */ (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      activate();
    }
  });
}

export function syncCodexTabPanels(root, activeTab) {
  const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('.cx-tab'));
  tabs.forEach((candidate) => {
    const isActive = candidate.dataset.tab === activeTab;
    candidate.classList.toggle('active', isActive);
    candidate.setAttribute('aria-selected', String(isActive));
  });

  root.querySelectorAll('.cx-tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `cx-tab-${activeTab}`);
  });
}

export function bindCodexTabButtons(root, onSelectTab) {
  const tabs = /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('.cx-tab'));
  tabs.forEach((button) => {
    button.addEventListener('click', () => {
      onSelectTab(button.dataset.tab ?? 'enemy');
    });
  });
}

export function bindCodexSelectableCards(nodes, datasetKey, onSelect, options = {}) {
  nodes.forEach((node) => {
    const activate = () => {
      const id = node.dataset?.[datasetKey] ?? null;
      if (id) onSelect(id);
    };
    node.addEventListener('click', activate);
    bindKeyboardActivation(node, activate, options);
  });
}

export function bindCodexButtonGroup(nodes, datasetKey, onSelect, options = {}) {
  nodes.forEach((node) => {
    const activate = () => {
      const value = node.dataset?.[datasetKey];
      if (value != null) onSelect(value, node);
    };
    node.addEventListener('click', (event) => {
      if (options.stopPropagation) event.stopPropagation();
      activate();
    });
    bindKeyboardActivation(node, activate, options);
  });
}
