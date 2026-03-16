import { upgradeData }      from '../../data/upgradeData.js';
import { shuffle }          from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * FIX(bug): 선택지 1~2개 반환 시 LevelUpView 레이아웃이 깨지던 문제 수정
 *   → _buildFallbackChoices() 로 항상 3개 보장
 * PATCH: 무기 관련 업그레이드 최소 1개 보장 유지
 */
export const UpgradeSystem = {
  generateChoices(player) {
    const { weaponPicks, statPicks } = this._buildAvailablePool(player);
    let result = this._pickBalanced(weaponPicks, statPicks);

    if (result.length < 3) {
      const fallback = this._buildFallbackChoices(player, result);
      for (const f of fallback) {
        if (result.length >= 3) break;
        result.push(f);
      }
    }

    return shuffle(result).slice(0, Math.min(3, result.length));
  },

  _buildAvailablePool(player) {
    const weaponPicks = [], statPicks = [];

    for (const upgrade of upgradeData) {
      if (upgrade.type === 'weapon_new') {
        if (!player.weapons.find(w => w.id === upgrade.weaponId)) weaponPicks.push(upgrade);

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) {
          const def      = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) weaponPicks.push(upgrade);
        }

      } else {
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (upgrade.maxCount === undefined || taken < upgrade.maxCount) statPicks.push(upgrade);
      }
    }

    return { weaponPicks, statPicks };
  },

  _pickBalanced(weaponPicks, statPicks) {
    const sw = shuffle(weaponPicks);
    const ss = shuffle(statPicks);
    const result = [];
    if (sw.length > 0) result.push(sw[0]);
    for (const s of ss) { if (result.length >= 3) break; result.push(s); }
    for (let i = 1; i < sw.length && result.length < 3; i++) result.push(sw[i]);
    return result;
  },

  _buildFallbackChoices(player, existing) {
    const existingIds = new Set(existing.map(u => u.id));
    return upgradeData.filter(u => !existingIds.has(u.id));
  },

  applyUpgrade(player, upgrade) {
    if (upgrade.type === 'weapon_new') {
      const def = getWeaponDataById(upgrade.weaponId);
      if (def) player.weapons.push({ ...def, currentCooldown: 0, level: 1 });

    } else if (upgrade.type === 'weapon_upgrade') {
      const owned = player.weapons.find(w => w.id === upgrade.weaponId);
      if (owned) {
        owned.level++;
        owned.damage   = (owned.damage   || 1) + 1;
        owned.cooldown = Math.max(0.1, (owned.cooldown || 1) * 0.92);
        if (owned.behaviorId === 'orbit' && owned.orbitRadius) {
          owned.orbitRadius += 4;
        }
        if (owned.pierce && owned.behaviorId !== 'orbit' && owned.behaviorId !== 'areaBurst') {
          owned.pierce++;
        }
      }

    } else if (upgrade.type === 'stat') {
      const eff = upgrade.effect;
      if (eff) {
        if (eff.stat === 'hp') {
          player.hp = Math.min(player.maxHp, player.hp + eff.value);
        } else if (eff.stat === 'maxHp') {
          player.maxHp += eff.value;
          player.hp    += eff.value;
        } else if (player[eff.stat] !== undefined) {
          player[eff.stat] += eff.value;
        }
      }
      // 적용 횟수 추적
      player.upgradeCounts = player.upgradeCounts || {};
      player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] || 0) + 1;
    }
  },
};
