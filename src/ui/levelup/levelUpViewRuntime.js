import {
  buildLevelUpCardMarkup,
  buildLevelUpHeaderMarkup,
} from './levelUpContent.js';
import { bindLevelUpCardInteractions } from './levelUpViewInteractions.js';

function renderLevelUpCardsMarkup({
  choices = [],
  rerollsRemaining = 0,
  banishMode = false,
} = {}) {
  return choices.map((upgrade, index) => buildLevelUpCardMarkup({
    upgrade,
    index,
    rerollsRemaining,
    banishMode,
  })).join('');
}

export function bindLevelUpViewRuntime(view, {
  bindLevelUpCardInteractionsImpl = bindLevelUpCardInteractions,
} = {}) {
  const disposers = [];
  const root = view?.el;
  if (root?.addEventListener) {
    const onClick = (event) => {
      const target = event?.target ?? null;
      const isToggleButton = target?.dataset?.action === 'toggle-banish-mode'
        || (typeof target?.className === 'string' && target.className.split(/\s+/).includes('levelup-mode-btn'));
      if (!isToggleButton) return;
      view._onToggleBanishMode?.();
    };
    root.addEventListener('click', onClick);
    disposers.push(() => root.removeEventListener('click', onClick));
  }

  const disposeCardRuntime = bindLevelUpCardInteractionsImpl(root, {
    resolveChoiceByIndex: (index) => view?._choices?.[index] ?? null,
    onPick: (selectedUpgrade, selectedIndex) => view._pick(selectedUpgrade, selectedIndex),
    onReroll: (selectedIndex) => view._onReroll?.(selectedIndex),
  });
  disposers.push(() => disposeCardRuntime?.());

  return () => {
    for (const dispose of disposers) {
      dispose?.();
    }
  };
}

export function renderLevelUpViewRuntime(view, {
  choices = [],
  title = '⬆ LEVEL UP',
  rerollsRemaining = 0,
  banishesRemaining = 0,
  banishMode = false,
} = {}) {
  view._choices = Array.isArray(choices) ? choices : [];
  view.el.innerHTML = buildLevelUpHeaderMarkup({
    title,
    rerollsRemaining,
    banishesRemaining,
    banishMode,
  });
  const cardsEl = view.el.querySelector('.levelup-cards');
  if (cardsEl) {
    cardsEl.innerHTML = renderLevelUpCardsMarkup({
      choices: view._choices,
      rerollsRemaining,
      banishMode,
    });
  }
}
