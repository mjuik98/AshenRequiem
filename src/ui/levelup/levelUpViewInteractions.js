export function bindLevelUpCardInteractions(renderedShell, {
  index,
  upgrade,
  onPick,
  onReroll,
} = {}) {
  const card = renderedShell?.querySelector('.levelup-card');
  card?.addEventListener('click', () => onPick?.(upgrade, index));
  renderedShell?.querySelector('.card-reroll-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    onReroll?.(index);
  });
}
