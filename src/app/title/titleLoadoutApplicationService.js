import { commitTitleStartWeaponSelection } from './titleRunSelectionCommit.js';
import { buildTitleRunResult } from './titleRunResult.js';
import { extractTitleRunDeps, normalizeTitleRunOptions } from './titleRunOptions.js';

export { commitTitleStartWeaponSelection } from './titleRunSelectionCommit.js';

export function startTitleRun(
  game,
  weaponId,
  ascensionLevelOrOptions = null,
  deps = {},
) {
  const {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = extractTitleRunDeps(ascensionLevelOrOptions, deps);

  const runOptions = normalizeTitleRunOptions(ascensionLevelOrOptions);
  const saveResult = commitSelectionImpl(game?.session, weaponId, runOptions, game?.gameData);
  return buildTitleRunResult({
    saved: Boolean(saveResult?.saved),
    saveResult,
    nextScene: saveResult?.saved ? (createPlaySceneImpl?.(game) ?? null) : null,
  });
}

export function createTitleLoadoutApplicationService(
  game,
  {
    commitSelectionImpl = commitTitleStartWeaponSelection,
    createPlaySceneImpl,
  } = {},
) {
  return {
    commitSelection(weaponId, ascensionLevel = null) {
      return commitSelectionImpl(game?.session, weaponId, ascensionLevel, game?.gameData);
    },
    startRun(weaponId, ascensionLevelOrOptions = null) {
      return startTitleRun(game, weaponId, ascensionLevelOrOptions, {
        commitSelectionImpl,
        createPlaySceneImpl,
      });
    },
  };
}
