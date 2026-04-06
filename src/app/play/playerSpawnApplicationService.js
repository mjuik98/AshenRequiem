import { applyPermanentUpgrades as applyPermanentUpgradesToPlayer } from '../../domain/play/progression/permanentUpgradeApplicator.js';
import {
  buildPlayerStartAccessories,
  buildPlayerStartWeapons,
  resolveStartWeaponSelection,
  resolveSelectedSeedConfig,
  resolveUnlockedLoadoutIds,
} from '../../domain/meta/loadout/startLoadoutDomain.js';
import { createSeededRng } from '../../utils/random.js';
import { applyAccessoryEffects } from '../../domain/play/progression/accessoryEffectRuntime.js';

export function resolvePlayerSpawnState(session = null, gameData = {}) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const { unlockedWeapons, unlockedAccessories } = resolveUnlockedLoadoutIds(gameData, session);
  const seedConfig = resolveSelectedSeedConfig(session);
  return {
    startWeapons: buildPlayerStartWeapons(gameData, session),
    startAccessories: buildPlayerStartAccessories(gameData, session),
    unlockedWeapons,
    unlockedAccessories,
    permanentUpgrades: { ...(session?.meta?.permanentUpgrades ?? {}) },
    selectedAscensionLevel: selection.selectedAscensionLevel ?? 0,
    ascension: selection.selectedAscension
      ? { ...selection.selectedAscension }
      : { level: selection.selectedAscensionLevel ?? 0 },
    selectedArchetypeId: selection.selectedArchetypeId ?? 'vanguard',
    archetype: selection.selectedArchetype
      ? { ...selection.selectedArchetype }
      : null,
    selectedRiskRelicId: selection.selectedRiskRelicId ?? null,
    riskRelic: selection.selectedRiskRelic
      ? { ...selection.selectedRiskRelic }
      : null,
    selectedStageId: selection.selectedStageId ?? null,
    stage: selection.selectedStage
      ? { ...selection.selectedStage }
      : null,
    seedMode: seedConfig.selectedSeedMode,
    seedLabel: seedConfig.seedLabel,
    rng: seedConfig.seedLabel ? createSeededRng(seedConfig.seedLabel) : null,
  };
}

export function applyPlayerPermanentUpgrades(
  player,
  permanentUpgrades = {},
  applyPermanentUpgradesImpl = applyPermanentUpgradesToPlayer,
) {
  if (!player || Object.keys(permanentUpgrades ?? {}).length === 0) return player;
  return applyPermanentUpgradesImpl(player, permanentUpgrades);
}

export function applyPlayerStartAccessories(player, startAccessories = []) {
  if (!player) return player;
  if (!Array.isArray(startAccessories) || startAccessories.length === 0) return player;

  player.accessories = player.accessories ?? [];
  for (const accessory of startAccessories) {
    if (!player.accessories.some((entry) => entry?.id === accessory?.id)) {
      player.accessories.push({ ...accessory });
    }
    applyAccessoryEffects(player, accessory.effects ?? []);
  }
  return player;
}

export function applyPlayerArchetype(player, archetype = null) {
  if (!player || !archetype) return player;
  player.archetypeId = archetype.id ?? null;
  applyAccessoryEffects(player, archetype.effects ?? []);
  return player;
}

export function applyPlayerRiskRelic(player, riskRelic = null) {
  if (!player || !riskRelic) return player;
  player.riskRelicId = riskRelic.id ?? null;
  applyAccessoryEffects(player, riskRelic.effects ?? []);
  return player;
}
