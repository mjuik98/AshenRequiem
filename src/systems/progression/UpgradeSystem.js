/**
 * src/systems/progression/UpgradeSystem.js
 *
 * CHANGE(P1): applyUpgrade에 synergyState 파라미터 추가
 */

import { upgradeData }      from '../../data/upgradeData.js';
import { shuffle }           from '../../utils/random.js';
import { getWeaponDataById } from '../../data/weaponData.js';
import { SynergySystem }     from './SynergySystem.js';

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
        if (!player.weapons.find(w => w.id === upgrade.weaponId)) {
          weaponPicks.push(upgrade);
        }
      } else if (upgrade.type === 'weapon_upgrade') {
        const owned = player.weapons.find(w => w.id === upgrade.weaponId);
        if (owned) {
          const def      = getWeaponDataById(upgrade.weaponId);
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

  /**
   * 업그레이드를 플레이어에게 적용한다.
   *
   * @param {object}             player
   * @param {object}             upgrade
   * @param {object[]|undefined} synergyData    DI된 시너지 데이터
   * @param {object|undefined}   synergyState   world.synergyState
   */
  applyUpgrade(player, upgrade, synergyData, synergyState) {
    if (upgrade.type === 'weapon_new') {
      const def = getWeaponDataById(upgrade.weaponId);
      if (def) player.weapons.push({ ...def, currentCooldown: 0, level: 1 });

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

    // CHANGE(P1): synergyState 명시적 전달
    SynergySystem.applyAll({ player, synergyData, synergyState });
  },
};
