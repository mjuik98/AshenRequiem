import { createSynergyState, resetSynergyState } from '../state/createSynergyState.js';

export function buildOwnedSynergyTokens(player) {
  const tokens = new Set();

  for (const weapon of player?.weapons ?? []) {
    if (weapon?.id) tokens.add(weapon.id);
  }

  for (const accessory of player?.accessories ?? []) {
    if (!accessory?.id) continue;
    tokens.add(accessory.id);
    tokens.add(`acc_${accessory.id}`);
  }

  for (const [upgradeId, count] of Object.entries(player?.upgradeCounts ?? {})) {
    if (count > 0 && upgradeId) tokens.add(upgradeId);
  }

  for (const upgradeId of player?.acquiredUpgrades ?? []) {
    if (upgradeId) tokens.add(upgradeId);
  }

  return tokens;
}

export function buildChoiceRequirementTokens(choice) {
  const tokens = new Set();
  if (!choice) return tokens;

  if (choice.id) tokens.add(choice.id);

  if (choice.type === 'weapon_new' || choice.type === 'weapon_upgrade' || choice.type === 'weapon_evolution') {
    if (choice.weaponId) tokens.add(choice.weaponId);
    if (choice.resultWeaponId) tokens.add(choice.resultWeaponId);
  }

  if (choice.type === 'accessory' || choice.type === 'accessory_upgrade') {
    if (choice.accessoryId) {
      tokens.add(choice.accessoryId);
      tokens.add(`acc_${choice.accessoryId}`);
    }
  }

  return tokens;
}

export function hasSynergyRelation(choice, player, synergyData = []) {
  const candidateTokens = buildChoiceRequirementTokens(choice);
  if (candidateTokens.size === 0) return false;

  const ownedTokens = buildOwnedSynergyTokens(player);

  return (synergyData ?? []).some((synergy) => {
    const requirements = synergy?.requires ?? [];
    const matchesChoice = requirements.some((requirement) => candidateTokens.has(requirement));
    if (!matchesChoice) return false;

    return requirements.some((requirement) => !candidateTokens.has(requirement) && ownedTokens.has(requirement));
  });
}

function rollbackSynergies(player, state) {
  if (state.appliedSpeedMult !== 1 && player.moveSpeed) {
    player.moveSpeed = Math.round(player.moveSpeed / state.appliedSpeedMult);
  }
  if (state.appliedLifesteal !== 0) {
    player.lifesteal = Math.max(0, (player.lifesteal ?? 0) - state.appliedLifesteal);
  }
  for (const [weaponId, bonuses] of Object.entries(state.appliedWeaponBonuses)) {
    const weapon = player.weapons?.find((candidate) => candidate.id === weaponId);
    if (!weapon) continue;
    if (bonuses.damageDelta) weapon.damage -= bonuses.damageDelta;
    if (bonuses.pierceDelta && weapon.pierce !== undefined) weapon.pierce -= bonuses.pierceDelta;
    if (bonuses.cooldownMult !== 1) weapon.cooldown = weapon.cooldown / bonuses.cooldownMult;
    if (bonuses.orbitDelta && weapon.orbitRadius !== undefined) weapon.orbitRadius -= bonuses.orbitDelta;
  }
}

function applySynergyState(player, state) {
  if (state.appliedSpeedMult !== 1) {
    player.moveSpeed = Math.round((player.moveSpeed ?? 200) * state.appliedSpeedMult);
  }
  if (state.appliedLifesteal !== 0) {
    player.lifesteal = (player.lifesteal ?? 0) + state.appliedLifesteal;
  }
  for (const [weaponId, bonuses] of Object.entries(state.appliedWeaponBonuses)) {
    const weapon = player.weapons?.find((candidate) => candidate.id === weaponId);
    if (!weapon) continue;
    if (bonuses.damageDelta) weapon.damage = (weapon.damage ?? 1) + bonuses.damageDelta;
    if (bonuses.pierceDelta && weapon.pierce !== undefined) weapon.pierce += bonuses.pierceDelta;
    if (bonuses.cooldownMult !== 1) {
      weapon.cooldown = Math.max(0.1, (weapon.cooldown ?? 1) * bonuses.cooldownMult);
    }
    if (bonuses.orbitDelta && weapon.orbitRadius !== undefined) weapon.orbitRadius += bonuses.orbitDelta;
  }
}

export function applySynergies({ player, synergyData, synergyState }) {
  if (!player || !synergyData) return synergyState ?? createSynergyState();

  const state = synergyState ?? createSynergyState();
  const ownedTokens = buildOwnedSynergyTokens(player);

  rollbackSynergies(player, state);
  resetSynergyState(state);

  for (const synergy of synergyData) {
    const requirements = synergy?.requires ?? [];
    if (requirements.length === 0 || !requirements.every((requirement) => ownedTokens.has(requirement))) {
      continue;
    }

    state.activeSynergies.push(synergy.id);

    const bonus = synergy.bonus;
    if (!bonus) continue;

    if (bonus.speedMult) state.appliedSpeedMult *= bonus.speedMult;
    if (bonus.lifestealDelta) state.appliedLifesteal += bonus.lifestealDelta;
    if (bonus.weaponId) {
      const weaponBonuses = state.appliedWeaponBonuses[bonus.weaponId] ?? {
        damageDelta: 0,
        pierceDelta: 0,
        cooldownMult: 1,
        orbitDelta: 0,
      };
      if (bonus.damageDelta) weaponBonuses.damageDelta += bonus.damageDelta;
      if (bonus.pierceDelta) weaponBonuses.pierceDelta += bonus.pierceDelta;
      if (bonus.cooldownMult) weaponBonuses.cooldownMult *= bonus.cooldownMult;
      if (bonus.orbitRadiusDelta) weaponBonuses.orbitDelta += bonus.orbitRadiusDelta;
      state.appliedWeaponBonuses[bonus.weaponId] = weaponBonuses;
    }
  }

  applySynergyState(player, state);
  player.activeSynergies = [...state.activeSynergies];
  return state;
}
