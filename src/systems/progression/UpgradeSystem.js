import { upgradeData } from '../../data/upgradeData.js';
import { shuffle } from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * FIX(bug): 선택지 1~2개 반환 가능성 수정.
 *   이전: 무기/stat 풀이 모두 소진되면 result < 3 으로 LevelUpView 레이아웃이 깨짐.
 *   이후: _buildFallbackChoices() 로 이미 maxLevel 무기도 포함해 항상 3개 보장.
 *         선택지가 실제로 0개일 때만 playMode = 'playing' 복귀 (극단적 예외 처리).
 *
 * REF(refactor): 내부 메서드 분리 → generateChoices 가독성 개선.
 *   _buildAvailablePool()  — 선택 가능한 업그레이드 수집
 *   _pickBalanced()        — weapon 1개 보장 + 나머지 stat 채우기
 *   _buildFallbackChoices() — 풀 부족 시 이미 maxLevel 무기 포함 후보 보충
 *
 * PATCH(balance): 무기 관련 업그레이드 최소 1개 보장 유지.
 */
export const UpgradeSystem = {
  generateChoices(player) {
    const { weaponPicks, statPicks } = this._buildAvailablePool(player);
    let result = this._pickBalanced(weaponPicks, statPicks);

    // FIX(bug): 3개 미만일 때 fallback 후보로 보충
    if (result.length < 3) {
      const fallback = this._buildFallbackChoices(player, result);
      for (const f of fallback) {
        if (result.length >= 3) break;
        result.push(f);
      }
    }

    return shuffle(result).slice(0, Math.min(3, result.length));
  },

  /**
   * 현재 플레이어 상태 기준 선택 가능한 업그레이드를 수집한다.
   * weapon_new: 미보유 무기
   * weapon_upgrade: 보유 중이고 maxLevel 미달인 무기
   * stat: maxCount 미초과인 스탯 업그레이드
   */
  _buildAvailablePool(player) {
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
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (upgrade.maxCount === undefined || taken < upgrade.maxCount) {
          statPicks.push(upgrade);
        }
      }
    }

    return { weaponPicks, statPicks };
  },

  /**
   * weapon 최소 1개 보장 + 나머지 2 슬롯을 stat 으로 채운다.
   * weapon 이 없으면 전체 랜덤.
   */
  _pickBalanced(weaponPicks, statPicks) {
    const shuffledWeapon = shuffle(weaponPicks);
    const shuffledStat   = shuffle(statPicks);
    const result = [];

    if (shuffledWeapon.length > 0) {
      result.push(shuffledWeapon[0]);
    }

    for (const s of shuffledStat) {
      if (result.length >= 3) break;
      result.push(s);
    }

    for (let i = 1; i < shuffledWeapon.length && result.length < 3; i++) {
      result.push(shuffledWeapon[i]);
    }

    return result;
  },

  /**
   * FIX(bug): 선택지 3개 미만 보충용 fallback 후보 생성.
   * 이미 result 에 포함된 항목은 제외.
   * 후보: maxLevel 에 도달한 무기 업그레이드 (회색 처리 표시는 LevelUpView 담당)
   *       또는 maxCount 초과 stat (상한선에 도달했지만 선택지 채우기용).
   *
   * 극후반부에 "선택할 것이 없음" 상황을 방지한다.
   */
  _buildFallbackChoices(player, alreadyPicked) {
    const pickedIds = new Set(alreadyPicked.map(u => u.id));
    const fallback  = [];

    for (const upgrade of upgradeData) {
      if (pickedIds.has(upgrade.id)) continue;

      if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) fallback.push(upgrade); // maxLevel 도달했어도 포함
      } else if (upgrade.type !== 'weapon_new') {
        fallback.push(upgrade); // maxCount 초과 stat 도 포함
      }
    }

    return shuffle(fallback);
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

    if (!player.upgradeCounts) player.upgradeCounts = {};
    player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] ?? 0) + 1;
  },
};
