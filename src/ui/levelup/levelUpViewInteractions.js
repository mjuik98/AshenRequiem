export function bindLevelUpCardInteractions(renderedShell, {
  index,
  upgrade,
  onPick,
  onReroll,
  resolveChoiceByIndex = null,
} = {}) {
  if (typeof resolveChoiceByIndex === 'function' && renderedShell?.addEventListener) {
    const root = renderedShell;
    const onClick = (event) => {
      const target = event?.target ?? null;
      const rerollButton = typeof target?.closest === 'function'
        ? target.closest('.card-reroll-btn')
        : (typeof target?.className === 'string' && target.className.includes('card-reroll-btn') ? target : null);
      if (rerollButton && root.contains?.(rerollButton)) {
        const cardIndex = Number.parseInt(rerollButton.closest?.('[data-index]')?.dataset?.index ?? rerollButton.dataset?.index ?? '-1', 10);
        if (Number.isInteger(cardIndex) && cardIndex >= 0) {
          event.stopPropagation?.();
          onReroll?.(cardIndex);
        }
        return;
      }

      const shell = typeof target?.closest === 'function'
        ? target.closest('[data-index]')
        : (Object.hasOwn(target?.dataset ?? {}, 'index') ? target : null);
      if (!shell || !root.contains?.(shell)) return;
      const cardIndex = Number.parseInt(shell.dataset?.index ?? '-1', 10);
      if (!Number.isInteger(cardIndex) || cardIndex < 0) return;
      onPick?.(resolveChoiceByIndex(cardIndex), cardIndex);
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
    };
  }

  const card = renderedShell?.querySelector('.levelup-card');
  card?.addEventListener('click', () => onPick?.(upgrade, index));
  renderedShell?.querySelector('.card-reroll-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    onReroll?.(index);
  });
}
