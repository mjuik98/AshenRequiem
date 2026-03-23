/**
 * src/systems/progression/UpgradeApplySystem.js — 업그레이드 적용 시스템
 * 파이프라인 priority 101.
 *
 * CHANGE: pendingLevelUpType 초기화 추가
 */

import { UpgradeSystem } from './UpgradeSystem.js';

export const UpgradeApplySystem = {
  update({ world, data }) {
    if (!world.pendingUpgrade || !world.player) return;
    const pendingUpgrade = world.pendingUpgrade;

    UpgradeSystem.applyUpgrade(
      world.player,
      pendingUpgrade,
      data?.synergyData,
      world.synergyState,
      data,
    );

    if (pendingUpgrade.type === 'weapon_new') {
      world.events.weaponAcquired?.push({ weaponId: pendingUpgrade.weaponId });
    }

    if (pendingUpgrade.type === 'accessory') {
      world.events.accessoryAcquired?.push({ accessoryId: pendingUpgrade.accessoryId });
    }

    if (pendingUpgrade.type === 'stat' && pendingUpgrade.effect?.stat === 'currency') {
      world.events.currencyEarned?.push({ amount: pendingUpgrade.effect.value ?? 0 });
    }

    world.pendingUpgrade        = null;
    world.pendingLevelUpChoices = null;
    world.pendingLevelUpType    = null;  // ← NEW: 원인 초기화
  },
};
