/**
 * src/systems/progression/SynergySystem.js
 *
 * REFACTOR: update() Pipeline 인터페이스 정규화
 */

import { synergyData } from '../../data/synergyData.js';

function isConditionMet(player, requires) {
  if (!requires || requires.length === 0) return false;
  return requires.every(reqId => (player.upgradeCounts?.[reqId] ?? 0) > 0);
}

function applySynergyBonus(player, synergy) {
  if (!synergy.bonus) return;
  const bonus = synergy.bonus;

  if (bonus.lifestealDelta) {
    player.lifesteal = (player.lifesteal ?? 0) + bonus.lifestealDelta;
  }
  if (bonus.speedMult) {
    player.moveSpeed = Math.round((player.moveSpeed ?? 200) * bonus.speedMult);
  }
  if (bonus.damageDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon) weapon.damage = (weapon.damage ?? 1) + bonus.damageDelta;
  }
  if (bonus.pierceDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon && weapon.pierce !== undefined) weapon.pierce += bonus.pierceDelta;
  }
  if (bonus.cooldownMult && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon) weapon.cooldown = Math.max(0.1, (weapon.cooldown ?? 1) * bonus.cooldownMult);
  }
  if (bonus.orbitRadiusDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon && weapon.orbitRadius !== undefined) weapon.orbitRadius += bonus.orbitRadiusDelta;
  }
}

export const SynergySystem = {
  update({ world: { player } }) {
    if (!player) return;
    this.applyAll({ player });
  },

  applyAll({ player }) {
    if (!player) return;

    player.activeSynergies     = [];
    player._synergyDamageBonus = 1;
    player._synergySeedBonus   = 1;
    player._synergyHpBonus     = 0;

    for (const synergy of synergyData) {
      if (isConditionMet(player, synergy.requires)) {
        player.activeSynergies.push(synergy.id);
        applySynergyBonus(player, synergy);
      }
    }
  },

  _testWithData({ player }, testSynergyData) {
    if (!player) return;
    player.activeSynergies     = [];
    player._synergyDamageBonus = 1;
    player._synergySeedBonus   = 1;
    player._synergyHpBonus     = 0;
    for (const synergy of testSynergyData) {
      if (isConditionMet(player, synergy.requires)) {
        player.activeSynergies.push(synergy.id);
        applySynergyBonus(player, synergy);
      }
    }
  },
};
