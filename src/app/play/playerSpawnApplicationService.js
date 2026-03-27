import { applyPermanentUpgrades as applyPermanentUpgradesToPlayer } from '../../data/permanentUpgradeData.js';
import {
  buildPlayerStartAccessories,
  buildPlayerStartWeapons,
  resolveStartWeaponSelection,
  resolveSelectedArchetypeId,
  resolveSelectedRiskRelicId,
  resolveSelectedSeedConfig,
  resolveSelectedAscensionLevel,
  resolveSelectedStageId,
  resolveUnlockedLoadoutIds,
} from '../../domain/meta/loadout/startLoadoutDomain.js';
import { getAscensionByLevel } from '../../data/ascensionData.js';
import { getStageById } from '../../data/stageData.js';
import { getArchetypeById } from '../../data/archetypeData.js';
import { getRiskRelicById } from '../../data/riskRelicData.js';
import { createSeededRng } from '../../utils/random.js';
import { applyAccessoryEffects } from '../../progression/accessoryEffectRuntime.js';

export function resolvePlayerSpawnState(session = null, gameData = {}) {
  const selection = resolveStartWeaponSelection(gameData, session);
  const { unlockedWeapons, unlockedAccessories } = resolveUnlockedLoadoutIds(gameData, session);
  const selectedAscensionLevel = resolveSelectedAscensionLevel(session);
  const selectedArchetypeId = resolveSelectedArchetypeId(gameData, session);
  const selectedRiskRelicId = resolveSelectedRiskRelicId(gameData, session);
  const selectedStageId = resolveSelectedStageId(gameData, session);
  const seedConfig = resolveSelectedSeedConfig(session);
  return {
    startWeapons: buildPlayerStartWeapons(gameData, session),
    startAccessories: buildPlayerStartAccessories(gameData, session),
    unlockedWeapons,
    unlockedAccessories,
    permanentUpgrades: { ...(session?.meta?.permanentUpgrades ?? {}) },
    selectedAscensionLevel,
    ascension: { ...getAscensionByLevel(selectedAscensionLevel) },
    selectedArchetypeId,
    archetype: { ...(selection.selectedArchetype ?? getArchetypeById(selectedArchetypeId)) },
    selectedRiskRelicId,
    riskRelic: (selection.selectedRiskRelic ?? getRiskRelicById(selectedRiskRelicId))
      ? { ...(selection.selectedRiskRelic ?? getRiskRelicById(selectedRiskRelicId)) }
      : null,
    selectedStageId,
    stage: { ...getStageById(selectedStageId) },
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
