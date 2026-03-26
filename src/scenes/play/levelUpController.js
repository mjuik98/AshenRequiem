import {
  banishLevelUpChoice,
  buildLevelUpOverlayState,
  rerollLevelUpChoice,
  resumeFromLevelUp,
  selectLevelUpChoice,
  toggleLevelUpBanishMode,
} from '../../progression/levelUpFlowRuntime.js';

export function createLevelUpController({
  getWorld,
  getData = () => null,
  isBlocked = () => false,
  showLevelUp,
}) {
  function getCurrentWorld() {
    const world = getWorld?.();
    return world ?? null;
  }

  function getCurrentData() {
    return getData?.() ?? null;
  }

  function show() {
    const world = getCurrentWorld();
    if (!world) return;

    const overlayState = buildLevelUpOverlayState(world, getCurrentData());
    if (!overlayState) {
      resumeFromLevelUp(world);
      return;
    }

    showLevelUp?.({
      ...overlayState,
      onSelect: (selectedUpgrade, index) => select(selectedUpgrade, index),
      onReroll: (index) => reroll(index),
      onToggleBanishMode: () => toggleBanishMode(),
    });
  }

  function select(selectedUpgrade, index) {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    if (world.progression.levelUpActionMode === 'banish') {
      const outcome = banishLevelUpChoice(world, index, getCurrentData());
      if (outcome !== 'playing') show();
      return;
    }
    selectLevelUpChoice(world, selectedUpgrade);
  }

  function reroll(index) {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    if (!rerollLevelUpChoice(world, index, getCurrentData())) {
      show();
      return;
    }
    show();
  }

  function toggleBanishMode() {
    const world = getCurrentWorld();
    if (!world || isBlocked()) return;
    toggleLevelUpBanishMode(world);
    show();
  }

  return {
    show,
    select,
    reroll,
    toggleBanishMode,
  };
}
