/**
 * src/systems/progression/UpgradeApplySystem.js — 업그레이드 적용 시스템
 * 파이프라인 priority 101.
 *
 * CHANGE(P1): world.synergyState를 UpgradeSystem.applyUpgrade()에 전달
 */

import { UpgradeSystem } from './UpgradeSystem.js';

export const UpgradeApplySystem = {
  /**
   * world.pendingUpgrade가 있으면 소비하여 업그레이드를 적용한다.
   *
   * @param {{ world: object, data: object }} ctx
   */
  update({ world, data }) {
    if (!world.pendingUpgrade || !world.player) return;

    UpgradeSystem.applyUpgrade(
      world.player,
      world.pendingUpgrade,
      data?.synergyData,
      world.synergyState, // CHANGE(P1): synergyState 전달
    );

    world.pendingUpgrade = null;
    world.pendingLevelUpChoices = null;
  },
};
