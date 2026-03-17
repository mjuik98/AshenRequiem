import { upgradeData }       from '../../data/upgradeData.js';
import { shuffle }            from '../../utils/random.js';
import { getWeaponDataById }  from '../../data/weaponData.js';
import { synergyData }        from '../../data/synergyData.js';

/**
 * UpgradeSystem — 업그레이드 선택지 생성 + 적용
 *
 * FIX(bug): 선택지 1~2개 반환 시 LevelUpView 레이아웃 깨짐 → 항상 3개 보장
 * FIX(bug): weapon_upgrade 강화 수치가 upgradeData 필드에서 읽힘
 *   (damageDelta / cooldownMult / orbitRadiusDelta / pierceDelta)
 * FIX(bug): _buildFallbackChoices — 이미 포함된 항목 제외 후 반환
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

  /** FIX(bug): existingIds 제외 + 중복 없이 반환 */
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

        // FIX: 데이터 필드에서 강화 수치 읽기 (하드코딩 제거)
        const dmgDelta      = upgrade.damageDelta      ?? 1;
        const cdMult        = upgrade.cooldownMult     ?? 0.92;
        const orbitRDelta   = upgrade.orbitRadiusDelta ?? 0;
        const pierceDelta   = upgrade.pierceDelta      ?? 0;

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
      player.upgradeCounts = player.upgradeCounts || {};
      player.upgradeCounts[upgrade.id] = (player.upgradeCounts[upgrade.id] || 0) + 1;
    }

    // 시너지 검사 및 적용 (P3 확장)
    this.checkAndApplySynergies(player);
  },

  checkAndApplySynergies(player) {
    const owned = new Set([
      ...Object.keys(player.upgradeCounts ?? {})
        .filter(id => (player.upgradeCounts[id] ?? 0) > 0),
      ...player.weapons.map(w => w.id),
    ]);

    for (const syn of synergyData) {
      if (player.activeSynergies?.has(syn.id)) continue;
      if (syn.requires.every(r => owned.has(r))) {
        this.applySynergy(player, syn);
        (player.activeSynergies ??= new Set()).add(syn.id);
      }
    }
  },

  applySynergy(player, syn) {
    const b = syn.bonus;
    if (b.maxHpDelta) {
      player.maxHp += b.maxHpDelta;
      player.hp = Math.min(player.hp + b.maxHpDelta, player.maxHp);
    }
    if (b.speedMult)       player.speed    = Math.round(player.speed * b.speedMult);
    if (b.lifestealDelta)  player.lifesteal = Math.min(1, (player.lifesteal ?? 0) + b.lifestealDelta);
    if (b.weaponId) {
      const w = player.weapons.find(w => w.id === b.weaponId);
      if (w) {
        if (b.damageDelta)      w.damage      += b.damageDelta;
        if (b.cooldownMult)     w.cooldown    *= b.cooldownMult;
        if (b.pierceDelta)      w.pierce      += b.pierceDelta;
        if (b.orbitRadiusDelta) w.orbitRadius += b.orbitRadiusDelta;
      }
    }
    console.log(`[Synergy] "${syn.name}" 발동!`);
  },
};
