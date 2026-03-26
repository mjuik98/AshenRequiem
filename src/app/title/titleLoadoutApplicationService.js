import { setSelectedStartWeaponAndSave } from '../../state/sessionFacade.js';

export function commitTitleStartWeaponSelection(
  session,
  weaponId,
  gameData = {},
  {
    saveSelectionImpl = setSelectedStartWeaponAndSave,
  } = {},
) {
  return saveSelectionImpl(session, weaponId, gameData);
}

export function startTitleRun(
  game,
  weaponId,
  {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = {},
) {
  const saveResult = commitSelectionImpl(game?.session, weaponId, game?.gameData);
  if (!saveResult?.saved) {
    return {
      saved: false,
      selectedWeaponId: saveResult?.selectedWeaponId ?? null,
      nextScene: null,
    };
  }

  return {
    saved: true,
    selectedWeaponId: saveResult.selectedWeaponId,
    nextScene: createPlaySceneImpl?.(game) ?? null,
  };
}

export function createTitleLoadoutApplicationService(
  game,
  {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = {},
) {
  return {
    commitSelection(weaponId) {
      return commitSelectionImpl(game?.session, weaponId, game?.gameData);
    },
    startRun(weaponId) {
      return startTitleRun(game, weaponId, {
        commitSelectionImpl,
        createPlaySceneImpl,
      });
    },
  };
}
