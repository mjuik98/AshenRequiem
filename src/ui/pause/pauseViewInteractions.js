import {
  bindPauseLoadoutCards,
  bindPauseTabs,
} from './pauseViewBindings.js';

export function bindPauseFooterActions(root, {
  onResume,
  onForfeit,
  isClosingToMenu = () => false,
}) {
  root?.querySelector('#pv-resume-btn')?.addEventListener('click', () => {
    if (isClosingToMenu()) return;
    onResume?.();
  });

  root?.querySelector('#pv-forfeit-btn')?.addEventListener('click', () => {
    if (isClosingToMenu()) return;
    onForfeit?.();
  });
}

export function bindPauseInteractionHandlers(root, {
  onActivateTabName,
  onSelectLoadoutKey,
}) {
  bindPauseTabs(root, onActivateTabName);
  bindPauseLoadoutCards(root, onSelectLoadoutKey);
}
