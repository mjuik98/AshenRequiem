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

    UpgradeSystem.applyUpgrade(
      world.player,
      world.pendingUpgrade,
      data?.synergyData,
      world.synergyState,
    );

    if (world.pendingUpgrade.type === 'weapon_new') {
      world.events.weaponAcquired?.push({ weaponId: world.pendingUpgrade.weaponId });
    }

    world.pendingUpgrade        = null;
    world.pendingLevelUpChoices = null;
    world.pendingLevelUpType    = null;  // ← NEW: 원인 초기화
  },
};
