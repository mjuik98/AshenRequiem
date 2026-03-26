/**
 * src/systems/progression/UpgradeApplySystem.js — 업그레이드 적용 시스템
 * 파이프라인 priority 101.
 *
 * CHANGE: pendingLevelUpType 초기화 추가
 */

import { UpgradeSystem } from './UpgradeSystem.js';

export const UpgradeApplySystem = {
  update({ world, data }) {
    if (!world.progression.pendingUpgrade || !world.entities.player) return;
    const pendingUpgrade = world.progression.pendingUpgrade;

    UpgradeSystem.applyUpgrade(
      world.entities.player,
      pendingUpgrade,
      data?.synergyData,
      world.progression.synergyState,
      data,
    );

    if (pendingUpgrade.type === 'weapon_new') {
      world.queues.events.weaponAcquired?.push({ weaponId: pendingUpgrade.weaponId });
    }

    if (pendingUpgrade.type === 'weapon_evolution') {
      world.queues.events.weaponEvolved?.push({
        recipeId: pendingUpgrade.recipeId ?? pendingUpgrade.id,
        weaponId: pendingUpgrade.weaponId,
        evolvedWeaponId: pendingUpgrade.resultWeaponId,
        weaponName: pendingUpgrade.name,
        announceText: pendingUpgrade.announceText ?? `${pendingUpgrade.name}으로 진화했다!`,
      });
    }

    if (pendingUpgrade.type === 'accessory') {
      world.queues.events.accessoryAcquired?.push({ accessoryId: pendingUpgrade.accessoryId });
    }

    if (pendingUpgrade.type === 'stat' && pendingUpgrade.effect?.stat === 'currency') {
      world.queues.events.currencyEarned?.push({ amount: pendingUpgrade.effect.value ?? 0 });
    }

    world.progression.pendingUpgrade = null;
    world.progression.pendingLevelUpChoices = null;
    world.progression.pendingLevelUpType = null;
  },
};
