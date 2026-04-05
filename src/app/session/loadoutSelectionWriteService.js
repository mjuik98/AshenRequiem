import {
  normalizeSeedMode,
  normalizeAscensionLevel,
  normalizeStageId,
  resolveSelectedArchetypeId,
  resolveSelectedRiskRelicId,
  resolveSelectedStartAccessoryId,
  resolveSelectedStartWeaponId,
} from '../../domain/meta/loadout/startLoadoutDomain.js';
import { ensureCodexMeta } from '../../state/session/sessionMetaState.js';
import { persistSession } from './sessionPersistenceService.js';

function resolveSelectedStartWeaponSaveResult(session, weaponId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedSelection = resolveSelectedStartWeaponId(gameData, session, weaponId);

  if (!normalizedSelection) {
    return {
      saved: false,
      selectedWeaponId: meta.selectedStartWeaponId,
    };
  }

  return {
    saved: normalizedSelection !== meta.selectedStartWeaponId || Boolean(weaponId),
    selectedWeaponId: normalizedSelection,
  };
}

export function setSelectedStartWeaponAndSave(session, weaponId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedStartWeaponSaveResult(session, weaponId, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedStartWeaponId = result.selectedWeaponId;
  persistSession(session);
  return result;
}

function resolveSelectedStartAccessorySaveResult(session, accessoryId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedSelection = resolveSelectedStartAccessoryId(gameData, session, accessoryId);

  return {
    saved: normalizedSelection !== meta.selectedStartAccessoryId || accessoryId === null || typeof accessoryId === 'string',
    selectedStartAccessoryId: normalizedSelection,
  };
}

export function setSelectedStartAccessoryAndSave(session, accessoryId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedStartAccessorySaveResult(session, accessoryId, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedStartAccessoryId = result.selectedStartAccessoryId;
  persistSession(session);
  return result;
}

function resolveSelectedArchetypeSaveResult(session, archetypeId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedSelection = resolveSelectedArchetypeId(gameData, session, archetypeId);

  return {
    saved: normalizedSelection !== meta.selectedArchetypeId || typeof archetypeId === 'string',
    selectedArchetypeId: normalizedSelection,
  };
}

export function setSelectedArchetypeAndSave(session, archetypeId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedArchetypeSaveResult(session, archetypeId, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedArchetypeId = result.selectedArchetypeId;
  persistSession(session);
  return result;
}

function resolveSelectedRiskRelicSaveResult(session, riskRelicId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedSelection = resolveSelectedRiskRelicId(gameData, session, riskRelicId);

  return {
    saved: normalizedSelection !== meta.selectedRiskRelicId || riskRelicId == null || typeof riskRelicId === 'string',
    selectedRiskRelicId: normalizedSelection,
  };
}

export function setSelectedRiskRelicAndSave(session, riskRelicId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedRiskRelicSaveResult(session, riskRelicId, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedRiskRelicId = result.selectedRiskRelicId;
  persistSession(session);
  return result;
}

function resolveSelectedAscensionSaveResult(session, ascensionLevel, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedLevel = normalizeAscensionLevel(gameData, ascensionLevel);

  return {
    saved: normalizedLevel !== meta.selectedAscensionLevel || Number.isFinite(ascensionLevel),
    selectedAscensionLevel: normalizedLevel,
  };
}

export function setSelectedAscensionAndSave(session, ascensionLevel, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedAscensionSaveResult(session, ascensionLevel, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedAscensionLevel = result.selectedAscensionLevel;
  persistSession(session);
  return result;
}

function resolveSelectedStageSaveResult(session, stageId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedId = normalizeStageId(gameData, stageId);

  return {
    saved: normalizedId !== meta.selectedStageId || typeof stageId === 'string',
    selectedStageId: normalizedId,
  };
}

export function setSelectedStageAndSave(session, stageId, gameData = {}) {
  const meta = ensureCodexMeta(session);
  const result = resolveSelectedStageSaveResult(session, stageId, gameData);
  if (!result.saved) {
    return result;
  }

  meta.selectedStageId = result.selectedStageId;
  persistSession(session);
  return result;
}

export function setRunSeedSelectionAndSave(session, {
  seedMode = 'none',
  seedText = '',
} = {}) {
  const meta = ensureCodexMeta(session);
  const normalizedMode = normalizeSeedMode(seedMode);
  const normalizedText = normalizedMode === 'custom' ? String(seedText ?? '').trim() : '';
  const result = {
    saved: normalizedMode !== meta.selectedSeedMode || normalizedText !== meta.selectedSeedText,
    selectedSeedMode: normalizedMode,
    selectedSeedText: normalizedText,
  };

  if (!result.saved) {
    return result;
  }

  meta.selectedSeedMode = result.selectedSeedMode;
  meta.selectedSeedText = result.selectedSeedText;
  persistSession(session);
  return result;
}
