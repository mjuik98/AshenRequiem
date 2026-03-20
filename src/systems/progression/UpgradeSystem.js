/**
 * src/systems/progression/UpgradeSystem.js
 *
 * MERGED:
 *   - Phase 2 Final: 슬롯 시스템(최대 무기 4, 장신구 2), 다중 투사체(projectileCountDelta),
 *                    크리티컬(critChance, critMultiplier), 진화 무기 보관 지원.
 *   - Phase 4: 신규 능력치(cooldownMult, projectileSpeedMult, projectileSizeMult, xpMult) 지원 유지.
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
    const weaponLikePicks = [];
    const statPicks       = [];

    const accCount       = player.accessories?.length  ?? 0;
    const maxWeaponSlots = player.maxWeaponSlots        ?? 2;
    const maxAccSlots    = player.maxAccessorySlots     ?? 0;

    for (const upgrade of upgradeData) {

      if (upgrade.type === 'weapon_new') {
        // 슬롯 여유 있고, 진화 무기가 아니고, 미보유 시
        const def = getWeaponDataById(upgrade.weaponId);
        if (!def?.isEvolved && player.weapons.length < maxWeaponSlots
            && !player.weapons.find(w => w.id === upgrade.weaponId)) {
          weaponLikePicks.push(upgrade);
        }

      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (!owned) continue;

        if (upgrade.maxCount !== undefined) {
          // maxCount 기반 — skipLevelUp 업그레이드(다중 발사 등)
          const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
          if (taken < upgrade.maxCount) weaponLikePicks.push(upgrade);
        } else {
          // 무기 레벨 기반 일반 강화
          const def      = getWeaponDataById(upgrade.weaponId);
          const maxLevel = def?.maxLevel ?? Infinity;
          if (owned.level < maxLevel) weaponLikePicks.push(upgrade);
        }

      } else if (upgrade.type === 'accessory') {
        // 장신구 슬롯 여유 있고, 미보유 시
        if (accCount < maxAccSlots) {
          const alreadyHas = player.accessories?.some(a => a.id === upgrade.accessoryId);
          if (!alreadyHas) weaponLikePicks.push(upgrade);
        }

      } else if (upgrade.type === 'slot') {
        // 슬롯 해금 — 최대치 미달 시
        const taken = player.upgradeCounts?.[upgrade.id] ?? 0;
        if (taken < (upgrade.maxCount ?? 2)) statPicks.push(upgrade);

      } else if (upgrade.type === 'stat') {
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
      if (accDef && (player.accessories?.length ?? 0) < (player.maxAccessorySlots ?? 0)) {
        player.accessories = player.accessories ?? [];
        player.accessories.push({ ...accDef });
        _applyAccessoryEffects(player, accDef.effects ?? []);
      }

    } else if (upgrade.type === 'slot') {
      // 슬롯 해금
      if (upgrade.slotType === 'weapon') {
        player.maxWeaponSlots = Math.min((player.maxWeaponSlots ?? 2) + 1, 4);
      } else if (upgrade.slotType === 'accessory') {
        player.maxAccessorySlots = Math.min((player.maxAccessorySlots ?? 0) + 1, 2);
      }

    } else if (upgrade.type === 'stat') {
      const eff = upgrade.effect;
      if (eff) {
        if (eff.stat === 'hp') {
          player.hp = Math.min(player.maxHp, player.hp + eff.value);
        } else if (eff.stat === 'maxHp') {
          player.maxHp += eff.value;
          player.hp    += eff.value;
        } else if (eff.stat === 'cooldownMult') {
          // Phase 4: 쿨다운 배율 클램핑
          player.cooldownMult = Math.max(0.1, (player.cooldownMult ?? 1.0) + eff.value);
        } else if (player[eff.stat] !== undefined) {
          player[eff.stat] += eff.value;
        } else {
          // 존재하지 않는 필드에도 가산 가능 (critChance 등)
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

      // Phase 4: 신규 능력치 배율
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

      // Patch: 신규 특수 효과
      case 'bonusProjectileCount':
        player.bonusProjectileCount = (player.bonusProjectileCount ?? 0) + eff.value;
        break;
      case 'critChance':
        player.critChance = (player.critChance ?? 0.05) + eff.value;
        break;
      case 'critMultiplier':
        // critMultiplier는 flat 가산 (2.0 기본 + 0.30 = 2.30)
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
