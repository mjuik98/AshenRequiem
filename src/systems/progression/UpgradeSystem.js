import { upgradeData } from '../../data/upgradeData.js';
import { shuffle } from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * PATCH(balance): generateChoices 에서 무기 관련 업그레이드 최소 1개 보장.
 *   이전: 전체 pool 랜덤 셔플 → stat 업그레이드만 나올 가능성 있음.
 *   이후: weapon_new / weapon_upgrade 가 존재하면 반드시 1개 포함.
 *         나머지 2 슬롯은 stat 업그레이드로 채움.
 *         weapon 관련이 없으면 기존처럼 전체 랜덤.
 */
export const UpgradeSystem = {
  generateChoices(player) {
    const weaponPicks = [];
    const statPicks   = [];

    for (const upgrade of upgradeData) {
      if (upgrade.type === 'weapon_new') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (!owned) weaponPicks.push(upgrade);

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) {
          const def = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) weaponPicks.push(upgrade);
        }

      } else {
        // stat — maxCount 초과 시 제외
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (upgrade.maxCount === undefined || taken < upgrade.maxCount) {
          statPicks.push(upgrade);
        }
      }
    }

    // PATCH(balance): 무기 관련이 있으면 최소 1개 보장
    const shuffledWeapon = shuffle(weaponPicks);
    const shuffledStat   = shuffle(statPicks);

    const result = [];

    if (shuffledWeapon.length > 0) {
      result.push(shuffledWeapon[0]);
    }

    // 나머지 슬롯을 stat 으로 채우되, 전체 3개 초과 방지
    for (const s of shuffledStat) {
      if (result.length >= 3) break;
      result.push(s);
    }

    // weapon 만으로 3개 채울 수 있으면 추가
    for (let i = 1; i < shuffledWeapon.length && result.length < 3; i++) {
      result.push(shuffledWeapon[i]);
    }

    return shuffle(result).slice(0, Math.min(3, result.length));
  },

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

    // 적용 횟수 기록
    if (!player.upgradeCounts) player.upgradeCounts = {};
    player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] ?? 0) + 1;
  },
};
