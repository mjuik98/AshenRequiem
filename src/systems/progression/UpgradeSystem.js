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
   * 플레이어 상태를 기반으로 최대 3개 선택지 생성
   */
  generateChoices(player) {
    const available = [];

    for (const upgrade of upgradeData) {
      if (upgrade.type === 'weapon_new') {
        // 이미 보유한 무기는 제외
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (!owned) available.push(upgrade);

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) {
          // maxLevel 초과 무기는 선택지에서 제외
          const def = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) available.push(upgrade);
        }

      } else {
        // 스탯 업그레이드는 항상 후보
        available.push(upgrade);
      }
    }

    const shuffled = shuffle(available);
    // 선택지가 3개 미만이어도 안전하게 처리
    return shuffled.slice(0, Math.min(3, shuffled.length));
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

    } else if (upgrade.type === 'weapon_upgrade') {
      // weapon_upgrade 전용 분기 — level 증가 후 apply
      const owned = player.weapons.find(w => w.id === upgrade.weaponId);
      const def = getWeaponDataById(upgrade.weaponId);
      const maxLevel = def?.maxLevel ?? Infinity;
      if (owned && owned.level < maxLevel) {
        owned.level++;
        upgrade.apply(player);
      }

    } else if (upgrade.apply) {
      upgrade.apply(player);
    }
  },
};
