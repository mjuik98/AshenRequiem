/**
 * src/systems/progression/UpgradeSystem.js
 *
 * CHANGE: 레벨업 보상 개편
 *   - 스탯/슬롯 업그레이드 제거 → 무기/장신구 중심
 *   - accessory_upgrade 타입 추가 (보유 장신구 Lv5까지 강화)
 *   - stat_heal은 무기/장신구 후보가 없을 때만 폴백으로 등장
 */

import { upgradeData }      from '../../data/upgradeData.js';
import { shuffle }           from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';
import { getAccessoryById }  from '../../data/accessoryData.js';
import { SynergySystem }     from './SynergySystem.js';

export const UpgradeSystem = {

  generateChoices(player) {
    const picks = this._buildAvailablePool(player);
    let result  = shuffle(picks).slice(0, 3);

    // 폴백: 무기/장신구 후보가 3개 미만이면 stat_heal로 채움
    if (result.length < 3) {
      const healUpgrade = upgradeData.find(u => u.id === 'stat_heal');
      if (healUpgrade) {
        while (result.length < 3) {
          result.push({ ...healUpgrade });
        }
      }
    }

    return result;
  },

  /**
   * 무기/장신구 관련 선택지만 수집한다.
   * stat/slot 타입은 완전히 제외된다.
   */
  _buildAvailablePool(player) {
    const picks = [];

    const maxWeaponSlots = player.maxWeaponSlots     ?? 3;
    const maxAccSlots    = player.maxAccessorySlots   ?? 3;

    for (const upgrade of upgradeData) {

      if (upgrade.type === 'weapon_new') {
        // 슬롯 여유 있고, 진화 무기가 아니고, 미보유 시
        const def = getWeaponDataById(upgrade.weaponId);
        if (!def?.isEvolved && player.weapons.length < maxWeaponSlots
            && !player.weapons.find(w => w.id === upgrade.weaponId)) {
          picks.push(upgrade);
        }

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (!owned) continue;

        if (upgrade.maxCount !== undefined) {
          // maxCount 기반 — skipLevelUp 업그레이드(다중 발사 등)
          const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
          if (taken < upgrade.maxCount) picks.push(upgrade);
        } else {
          // 무기 레벨 기반 일반 강화
          const def      = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) picks.push(upgrade);
        }

      } else if (upgrade.type === 'accessory') {
        // 장신구 슬롯 여유 있고, 미보유 시
        if ((player.accessories?.length ?? 0) < maxAccSlots) {
          const alreadyHas = player.accessories?.some(a => a.id === upgrade.accessoryId);
          if (!alreadyHas) picks.push(upgrade);
        }

      } else if (upgrade.type === 'accessory_upgrade') {
        // 보유 장신구 중 maxLevel 미달인 것만 후보
        const owned = player.accessories?.find(a => a.id === upgrade.accessoryId);
        if (!owned) continue;
        const def      = getAccessoryById(upgrade.accessoryId);
        const maxLevel = def?.maxLevel ?? 5;
        if ((owned.level ?? 1) < maxLevel) picks.push(upgrade);
      }

      // stat, slot 타입은 의도적으로 무시 — 레벨업 풀에서 완전 제외
    }

    return picks;
  },

  /**
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
        if (player.globalDamageMult && player.globalDamageMult !== 1) {
          newWeapon.damage = Math.max(1, Math.round(newWeapon.damage * player.globalDamageMult));
        }
        player.weapons.push(newWeapon);
      }

    } else if (upgrade.type === 'weapon_upgrade') {
      const owned = player.weapons.find(w => w.id === upgrade.weaponId);
      if (owned) {
        // skipLevelUp: 무기 레벨을 소모하지 않는 특수 업그레이드(다중 발사 등)
        if (!upgrade.skipLevelUp) {
          owned.level++;
        }

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

        // 다중 투사체 업그레이드
        const projCountDelta = upgrade.projectileCountDelta ?? 0;
        if (projCountDelta > 0) {
          owned.projectileCount = (owned.projectileCount ?? 1) + projCountDelta;
        }
      }

    } else if (upgrade.type === 'accessory') {
      const accDef = getAccessoryById(upgrade.accessoryId);
      if (accDef && (player.accessories?.length ?? 0) < (player.maxAccessorySlots ?? 3)) {
        player.accessories = player.accessories ?? [];
        // Lv.1로 장착, effects도 복사
        const newAcc = { ...accDef, level: 1 };
        player.accessories.push(newAcc);
        _applyAccessoryEffects(player, accDef.effects ?? []);
      }

    } else if (upgrade.type === 'accessory_upgrade') {
      // 보유 장신구 레벨업 — valuePerLevel 적용
      const owned = player.accessories?.find(a => a.id === upgrade.accessoryId);
      if (owned) {
        const def = getAccessoryById(upgrade.accessoryId);
        const maxLevel = def?.maxLevel ?? 5;
        if ((owned.level ?? 1) < maxLevel) {
          owned.level = (owned.level ?? 1) + 1;
          // valuePerLevel 만큼 효과 추가 적용
          const levelUpEffects = (def?.effects ?? []).map(e => {
            if (e.stat === 'damageMult') {
              return { stat: e.stat, value: 1 + (e.valuePerLevel ?? 0) };
            }
            return { stat: e.stat, value: e.valuePerLevel ?? 0 };
          }).filter(e => e.value !== 0 && e.value !== 1);
          _applyAccessoryEffects(player, levelUpEffects);
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
        } else {
          player[eff.stat] = (player[eff.stat] ?? 0) + eff.value;
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

// ── 장신구 효과 적용 ──────────────────────────────────────────────────────────

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
        (player.weapons ?? []).forEach(w => {
          w.damage = Math.max(1, Math.round(w.damage * eff.value));
        });
        player.globalDamageMult = (player.globalDamageMult ?? 1) * eff.value;
        break;

      // 신규 능력치 배율
      case 'cooldownMult':
        player.cooldownMult = Math.max(0.1, (player.cooldownMult ?? 1.0) + eff.value);
        break;
      case 'projectileSpeedMult':
        player.projectileSpeedMult = (player.projectileSpeedMult ?? 1.0) + eff.value;
        break;
      case 'projectileSizeMult':
        player.projectileSizeMult = (player.projectileSizeMult ?? 1.0) + eff.value;
        break;
      case 'xpMult':
        player.xpMult = (player.xpMult ?? 1.0) + eff.value;
        break;

      // 특수 효과
      case 'bonusProjectileCount':
        player.bonusProjectileCount = (player.bonusProjectileCount ?? 0) + eff.value;
        break;
      case 'critChance':
        player.critChance = (player.critChance ?? 0.05) + eff.value;
        break;
      case 'critMultiplier':
        player.critMultiplier = (player.critMultiplier ?? 2.0) + eff.value;
        break;

      default:
        if (player[eff.stat] !== undefined) {
          player[eff.stat] += eff.value;
        }
        break;
    }
  }
}
