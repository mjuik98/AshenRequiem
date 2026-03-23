import { PAUSE_AUDIO_DEFAULTS } from './pauseAudioControls.js';
import { buildPauseLoadoutItems } from './pauseLoadoutContent.js';
import {
  buildPauseViewIndexes,
  resolvePauseSelectedLoadoutKey,
} from './pauseViewModel.js';

export function applyPauseViewShowState(view, {
  player,
  data,
  onResume,
  onForfeit = null,
  onOptionsChange = null,
  world = null,
  session = null,
}) {
  clearTimeout(view._ttHideTimer);
  view._isClosingToMenu = false;
  view._onResume = onResume;
  view._onForfeit = onForfeit;
  view._onOptionsChange = onOptionsChange;
  view._data = data;
  view._indexes = buildPauseViewIndexes(data);
  view._player = player;
  view._world = world;
  view._session = session;
  view._loadoutItems = buildPauseLoadoutItems({ player });
  view._selectedLoadoutKey = resolvePauseSelectedLoadoutKey(
    view._loadoutItems,
    view._selectedLoadoutKey,
    player,
  );
  view._pauseOptions = {
    ...PAUSE_AUDIO_DEFAULTS,
    ...(session?.options ?? {}),
  };
  view._activeTabName = 'loadout';
}

export function resetPauseViewRuntime(view, { clearSelection = false } = {}) {
  clearTimeout(view._ttHideTimer);
  view._ttHideTimer = null;
  view._onResume = null;
  view._onForfeit = null;
  view._onOptionsChange = null;
  view._data = null;
  view._indexes = null;
  view._player = null;
  view._world = null;
  view._session = null;
  view._loadoutItems = [];
  view._pauseOptions = { ...PAUSE_AUDIO_DEFAULTS };
  view._activeTabName = 'loadout';
  view._isClosingToMenu = false;

  if (clearSelection) {
    view._selectedLoadoutKey = null;
  }
}
