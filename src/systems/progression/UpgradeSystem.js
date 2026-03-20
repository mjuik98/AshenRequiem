/**
 * src/systems/progression/UpgradeSystem.js
 *
 * CHANGE (Phase 2): 장신구(accessory) 타입 처리 추가
 *   - generateChoices: 장신구 슬롯 제한(2개), 중복 장착 방지
 *   - applyUpgrade: 'accessory' 케이스 추가
 *   - weapon_new: globalDamageMult 반영 (장신구/영구강화 데미지 배율)
 */

import { upgradeData }      from '../../data/upgradeData.js';
import { shuffle }           from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';
import { getAccessoryById }  from '../../data/accessoryData.js';
import { SynergySystem }     from './SynergySystem.js';

export const UpgradeSystem = {

  generateChoices(player) {
    const { weaponLikePicks, statPicks } = this._buildAvailablePool(player);
    let result = this._pickBalanced(weaponLikePicks, statPicks);

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
    const weaponLikePicks = [];  // 무기 신규/강화 + 장신구
    const statPicks       = [];

    const accCount = player.accessories?.length ?? 0;

    for (const upgrade of upgradeData) {
      if (upgrade.type === 'weapon_new') {
        if (!player.weapons.find(w => w.id === upgrade.weaponId)) {
          weaponLikePicks.push(upgrade);
        }

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) {
          const def      = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) weaponLikePicks.push(upgrade);
        }

      } else if (upgrade.type === 'accessory') {
        // CHANGE: 슬롯 여유 있고 동일 장신구 미장착 시만 등장
        if (accCount < 2) {
          const alreadyHas = player.accessories?.some(a => a.id === upgrade.accessoryId);
          if (!alreadyHas) weaponLikePicks.push(upgrade);
        }

      } else {
        // stat
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (upgrade.maxCount === undefined || taken < upgrade.maxCount) {
          statPicks.push(upgrade);
        }
      }
    }

    return { weaponLikePicks, statPicks };
  },

  _pickBalanced(weaponLikePicks, statPicks) {
    const sw = shuffle(weaponLikePicks);
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

  /**
   * 업그레이드를 플레이어에게 적용한다.
   *
   * @param {object}             player
   * @param {object}             upgrade
   * @param {object[]|undefined} synergyData
   * @param {object|undefined}   synergyState
   */
  applyUpgrade(player, upgrade, synergyData, synergyState) {

    if (upgrade.type === 'weapon_new') {
      const def = getWeaponDataById(upgrade.weaponId);
      if (def) {
        const newWeapon = { ...def, currentCooldown: 0, level: 1 };
        // CHANGE: globalDamageMult 반영 (장신구/영구강화 누산 배율)
        if (player.globalDamageMult && player.globalDamageMult !== 1) {
          newWeapon.damage = Math.max(1, Math.round(newWeapon.damage * player.globalDamageMult));
        }
        player.weapons.push(newWeapon);
      }

    } else if (upgrade.type === 'weapon_upgrade') {
      const owned = player.weapons.find(w => w.id === upgrade.weaponId);
      if (owned) {
        owned.level++;
        const dmgDelta    = upgrade.damageDelta      ?? 1;
        const cdMult      = upgrade.cooldownMult     ?? 0.92;
        const orbitRDelta = upgrade.orbitRadiusDelta ?? 0;
        const pierceDelta = upgrade.pierceDelta      ?? 0;

        owned.damage   = (owned.damage   || 1) + dmgDelta;
        owned.cooldown = Math.max(0.1, (owned.cooldown || 1) * cdMult);

        if (orbitRDelta > 0 && owned.orbitRadius !== undefined) {
          owned.orbitRadius += orbitRDelta;
        }
        if (pierceDelta > 0 && owned.pierce !== undefined
            && owned.behaviorId !== 'orbit' && owned.behaviorId !== 'areaBurst') {
          owned.pierce += pierceDelta;
        }
      }

    } else if (upgrade.type === 'accessory') {
      // CHANGE (Phase 2): 장신구 장착
      const accDef = getAccessoryById(upgrade.accessoryId);
      if (accDef && (player.accessories?.length ?? 0) < 2) {
        player.accessories = player.accessories ?? [];
        player.accessories.push({ ...accDef });
        _applyAccessoryEffects(player, accDef.effects ?? []);
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
    }

    player.upgradeCounts = player.upgradeCounts ?? {};
    player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] ?? 0) + 1;

    player.acquiredUpgrades = player.acquiredUpgrades ?? new Set();
    player.acquiredUpgrades.add(upgrade.id);

    SynergySystem.applyAll({ player, synergyData, synergyState });
  },
};

// ── 장신구 효과 적용 헬퍼 ──────────────────────────────────────────────────────

/**
 * 장신구 effects 배열을 순회하며 플레이어 스탯에 즉시 반영한다.
 * damageMult는 현재 무기 전체에 곱하고 globalDamageMult에도 누산한다.
 */
function _applyAccessoryEffects(player, effects) {
  for (const eff of effects) {
    switch (eff.stat) {
      case 'moveSpeed':
        player.moveSpeed += eff.value;
        break;
      case 'maxHp':
        player.maxHp += eff.value;
        player.hp = Math.min(player.hp + eff.value, player.maxHp);
        break;
      case 'lifesteal':
        player.lifesteal = (player.lifesteal ?? 0) + eff.value;
        break;
      case 'magnetRadius':
        player.magnetRadius = (player.magnetRadius ?? 60) + eff.value;
        break;
      case 'invincibleDuration':
        player.invincibleDuration = (player.invincibleDuration ?? 0.5) + eff.value;
        break;
      case 'damageMult':
        // 현재 보유 무기 모두에 배율 적용
        (player.weapons ?? []).forEach(w => {
          w.damage = Math.max(1, Math.round(w.damage * eff.value));
        });
        // 이후 획득 무기를 위해 누산 기록
        player.globalDamageMult = (player.globalDamageMult ?? 1) * eff.value;
        break;
      default:
        if (player[eff.stat] !== undefined) {
          player[eff.stat] += eff.value;
        }
        break;
    }
  }
}
