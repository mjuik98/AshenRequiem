import { upgradeData } from '../../data/upgradeData.js';
import { shuffle } from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * FIX(balance): stat 타입 업그레이드에 maxCount 상한 체크 추가.
 *   player.upgradeCounts[upgrade.id] >= upgrade.maxCount 이면 선택지에서 제외.
 *   applyUpgrade 에서 적용 시 upgradeCounts 를 기록.
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
          const def = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) available.push(upgrade);
        }

      } else {
        // FIX(balance): stat 업그레이드 — maxCount 초과 시 제외
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (upgrade.maxCount === undefined || taken < upgrade.maxCount) {
          available.push(upgrade);
        }
      }
    }

    const shuffled = shuffle(available);
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

    // FIX(balance): 적용 횟수 기록 (stat 타입뿐 아니라 전체 tracking)
    if (!player.upgradeCounts) player.upgradeCounts = {};
    player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] ?? 0) + 1;
  },
};
