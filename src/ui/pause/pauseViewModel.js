import {
  getDefaultPauseSelection,
  normalizePauseSynergyRequirementId,
} from './pauseLoadoutContent.js';

export function resolvePauseSelectedLoadoutKey(items, selectedLoadoutKey, player) {
  if (!Array.isArray(items) || items.length === 0) return null;
  if (selectedLoadoutKey) {
    const current = items.find((item) => item.selectionKey === selectedLoadoutKey);
    if (current) return current.selectionKey;
  }

  return (
    items.find((item) => item.kind === 'weapon' || item.kind === 'accessory')?.selectionKey
    ?? getDefaultPauseSelection({ player })?.selectionKey
    ?? items[0]?.selectionKey
    ?? null
  );
}

export function buildPauseViewIndexes(data = {}) {
  const weaponById = new Map((data.weaponData ?? []).map((weapon) => [weapon?.id, weapon]));
  const accessoryById = new Map((data.accessoryData ?? []).map((accessory) => [accessory?.id, accessory]));
  const synergiesByWeaponId = new Map();
  const synergiesByAccessoryId = new Map();

  for (const synergy of data.synergyData ?? []) {
    for (const requirement of synergy?.requires ?? []) {
      const id = normalizePauseSynergyRequirementId(requirement);
      if (!id) continue;

      if (weaponById.has(id)) {
        const list = synergiesByWeaponId.get(id) ?? [];
        list.push(synergy);
        synergiesByWeaponId.set(id, list);
      }

      if (accessoryById.has(id)) {
        const list = synergiesByAccessoryId.get(id) ?? [];
        list.push(synergy);
        synergiesByAccessoryId.set(id, list);
      }
    }
  }

  return { weaponById, accessoryById, synergiesByWeaponId, synergiesByAccessoryId };
}

export function formatPauseElapsedTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${minutes}:${secs}`;
}
