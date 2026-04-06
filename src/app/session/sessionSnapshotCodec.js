import { createSessionState } from '../../state/session/sessionMigrations.js';
import { normalizeSessionOptions } from '../../state/sessionOptions.js';

function cloneValue(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function replaceSessionState(session, nextState) {
  session.last = cloneValue(nextState.last);
  session.best = cloneValue(nextState.best);
  session.meta = cloneValue(nextState.meta);
  session.options = cloneValue(nextState.options);
  session.activeRun = cloneValue(nextState.activeRun);
  session._version = nextState._version;
  return session;
}

export function buildResetState(session) {
  const resetState = createSessionState();
  const preservedOptions = normalizeSessionOptions(session?.options ?? {});
  const preservedMeta = {
    selectedStartWeaponId: session?.meta?.selectedStartWeaponId ?? resetState.meta.selectedStartWeaponId,
    selectedStartAccessoryId: session?.meta?.selectedStartAccessoryId ?? resetState.meta.selectedStartAccessoryId,
    selectedArchetypeId: session?.meta?.selectedArchetypeId ?? resetState.meta.selectedArchetypeId,
    selectedRiskRelicId: session?.meta?.selectedRiskRelicId ?? resetState.meta.selectedRiskRelicId,
    selectedStageId: session?.meta?.selectedStageId ?? resetState.meta.selectedStageId,
    selectedSeedMode: session?.meta?.selectedSeedMode ?? resetState.meta.selectedSeedMode,
    selectedSeedText: session?.meta?.selectedSeedText ?? resetState.meta.selectedSeedText,
    selectedAscensionLevel: session?.meta?.selectedAscensionLevel ?? resetState.meta.selectedAscensionLevel,
  };

  return {
    ...resetState,
    meta: {
      ...resetState.meta,
      ...preservedMeta,
    },
    options: preservedOptions,
  };
}
