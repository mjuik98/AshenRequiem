export function applyPauseTabState(root, name) {
  if (!root || !name) return;

  root.querySelectorAll('.pv-tab').forEach((tab) => {
    const active = tab.dataset.tabName === name;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  root.querySelectorAll('.pv-tab-content').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `pv-tab-${name}`);
  });
}

export function bindPauseTabs(root, onActivate) {
  const tabs = [...(root?.querySelectorAll('.pv-tab') ?? [])];
  if (tabs.length === 0) return;

  tabs.forEach((tab, index) => {
    const activate = () => onActivate?.(tab.dataset.tabName);
    tab.addEventListener('click', activate);
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        tabs[(index + 1) % tabs.length]?.focus();
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        tabs[(index - 1 + tabs.length) % tabs.length]?.focus();
      }

      if (event.key === 'Home') {
        event.preventDefault();
        tabs[0]?.focus();
      }

      if (event.key === 'End') {
        event.preventDefault();
        tabs[tabs.length - 1]?.focus();
      }
    });
  });
}

export function bindPauseLoadoutCards(root, onSelect) {
  root?.querySelectorAll('.pv-slot-card[data-loadout-key]').forEach((card) => {
    const key = card.dataset.loadoutKey;
    if (!key) return;

    card.addEventListener('click', () => onSelect?.(key));
    card.addEventListener('focus', () => onSelect?.(key));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(key);
      }
    });
  });
}

export function emitPauseOptionsChange(onOptionsChange, pauseOptions) {
  onOptionsChange?.({ ...(pauseOptions ?? {}) });
}
