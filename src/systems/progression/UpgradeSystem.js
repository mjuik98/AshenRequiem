import { upgradeData } from '../../data/upgradeData.js';
import { shuffle } from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * 입력: player 상태, 보유 무기, upgradeData
 */
export const UpgradeSystem = {
  /**
   * 플레이어 상태를 기반으로 3개 선택지 생성
   */
  generateChoices(player) {
    const available = [];

    for (const upgrade of upgradeData) {
      if (upgrade.type === 'weapon_new') {
        // 이미 보유한 무기는 제외
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (!owned) available.push(upgrade);
      } else if (upgrade.type === 'weapon_upgrade') {
        // 보유한 무기만 강화 가능
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) available.push(upgrade);
      } else {
        // 스탯 업그레이드는 항상 후보
        available.push(upgrade);
      }
    }

    // 셔플 후 최대 3개
    return shuffle(available).slice(0, 3);
  },

  /**
   * 선택한 업그레이드 적용
   */
  applyUpgrade(player, upgrade) {
    if (upgrade.type === 'weapon_new') {
      const weaponDef = getWeaponDataById(upgrade.weaponId);
      if (weaponDef) {
        player.weapons.push({
          ...weaponDef,
          currentCooldown: 0,
          level: 1,
        });
      }
    } else if (upgrade.apply) {
      upgrade.apply(player);
    }
  },
};
