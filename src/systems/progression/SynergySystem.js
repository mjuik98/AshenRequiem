/**
 * src/systems/progression/SynergySystem.js
 *
 * REFACTOR: synergyData 직접 import 제거 → DI 강제 (R-18)
 * REFACTOR: update() Pipeline 인터페이스 정규화
 * REFACTOR: _testWithData() 제거 (R-05)
 */

function isConditionMet(player, requires) {
  if (!requires || requires.length === 0) return false;
  return requires.every(reqId => (player.upgradeCounts?.[reqId] ?? 0) > 0);
}

function applySynergyBonus(player, synergy) {
  if (!synergy.bonus) return;
  const bonus = synergy.bonus;

  if (bonus.lifestealDelta) {
    player.lifesteal = (player.lifesteal ?? 0) + bonus.lifestealDelta;
  }
  if (bonus.speedMult) {
    player.moveSpeed = Math.round((player.moveSpeed ?? 200) * bonus.speedMult);
  }
  if (bonus.damageDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon) weapon.damage = (weapon.damage ?? 1) + bonus.damageDelta;
  }
  if (bonus.pierceDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon && weapon.pierce !== undefined) weapon.pierce += bonus.pierceDelta;
  }
  if (bonus.cooldownMult && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon) weapon.cooldown = Math.max(0.1, (weapon.cooldown ?? 1) * bonus.cooldownMult);
  }
  if (bonus.orbitRadiusDelta && bonus.weaponId) {
    const weapon = player.weapons?.find(w => w.id === bonus.weaponId);
    if (weapon && weapon.orbitRadius !== undefined) weapon.orbitRadius += bonus.orbitRadiusDelta;
  }
}

export const SynergySystem = {
  /**
   * 파이프라인 update — data.synergyData를 통해 DI된 데이터를 사용한다.
   */
  update({ world, data }) {
    if (!world?.player) return;
    if (!data?.synergyData) return;
    this.applyAll({ player: world.player, synergyData: data.synergyData });
  },

  /**
   * 시너지 조건을 재검사하고 보너스를 완전 재계산한다.
   * R-18: synergyData DI 보장.
   * FIX(BUG-SYNERGY-MULT): 매 프레임 호출 시 보너스가 중첩(Multiplication/Delta)되지 않도록
   * 이전 프레임에 적용했던 시너지 효과를 먼저 역산(Restore)한 후 재계산한다.
   *
   * @param {{ player: object, synergyData: object[] }} param
   */
  applyAll({ player, synergyData }) {
    if (!player) return;
    if (!synergyData) return;

    // 1. 이전 시너지 효과 역산 (Idempotency 보장)
    if (player._lastSynergySpeedMult && player._lastSynergySpeedMult !== 1) {
      player.moveSpeed = Math.round(player.moveSpeed / player._lastSynergySpeedMult);
    }
    if (player._lastSynergyLifesteal) {
      player.lifesteal = (player.lifesteal ?? 0) - player._lastSynergyLifesteal;
    }

    // 무기 스탯 역산
    if (player._lastWeaponBonuses) {
      for (const [weaponId, bonuses] of Object.entries(player._lastWeaponBonuses)) {
        const weapon = player.weapons?.find(w => w.id === weaponId);
        if (weapon) {
          if (bonuses.damageDelta)    weapon.damage   -= bonuses.damageDelta;
          if (bonuses.pierceDelta)    weapon.pierce   -= bonuses.pierceDelta;
          if (bonuses.cooldownMult)  weapon.cooldown = weapon.cooldown / bonuses.cooldownMult;
          if (bonuses.orbitDelta)     weapon.orbitRadius -= bonuses.orbitDelta;
        }
      }
    }

    // 2. 상태 초기화
    player.activeSynergies      = [];
    player._synergyDamageBonus  = 1;
    player._synergySeedBonus    = 1;
    player._synergyHpBonus      = 0;
    player._lastSynergySpeedMult = 1;
    player._lastSynergyLifesteal = 0;
    player._lastWeaponBonuses    = {}; // { [weaponId]: { damageDelta, ... } }

    // 3. 시너지 조건 검사 및 보너스 누적
    for (const synergy of synergyData) {
      if (isConditionMet(player, synergy.requires)) {
        player.activeSynergies.push(synergy.id);
        
        const bonus = synergy.bonus;
        if (!bonus) continue;

        // 플레이어 스탯 누적
        if (bonus.speedMult) {
          player._lastSynergySpeedMult *= bonus.speedMult;
        }
        if (bonus.lifestealDelta) {
          player._lastSynergyLifesteal += bonus.lifestealDelta;
        }

        // 무기 스탯 누적 (나중에 일괄 적용을 위해 기록)
        if (bonus.weaponId) {
          const wId = bonus.weaponId;
          const wb = player._lastWeaponBonuses[wId] || { 
            damageDelta: 0, pierceDelta: 0, cooldownMult: 1, orbitDelta: 0 
          };
          
          if (bonus.damageDelta)    wb.damageDelta += bonus.damageDelta;
          if (bonus.pierceDelta)    wb.pierceDelta += bonus.pierceDelta;
          if (bonus.cooldownMult)  wb.cooldownMult *= bonus.cooldownMult;
          if (bonus.orbitRadiusDelta) wb.orbitDelta  += bonus.orbitRadiusDelta;
          
          player._lastWeaponBonuses[wId] = wb;
        }
      }
    }

    // 4. 최종 보너스 적용
    if (player._lastSynergySpeedMult !== 1) {
      player.moveSpeed = Math.round(player.moveSpeed * player._lastSynergySpeedMult);
    }
    if (player._lastSynergyLifesteal !== 0) {
      player.lifesteal = (player.lifesteal ?? 0) + player._lastSynergyLifesteal;
    }

    for (const [weaponId, bonuses] of Object.entries(player._lastWeaponBonuses)) {
      const weapon = player.weapons?.find(w => w.id === weaponId);
      if (weapon) {
        if (bonuses.damageDelta)    weapon.damage   = (weapon.damage ?? 1) + bonuses.damageDelta;
        if (bonuses.pierceDelta)    weapon.pierce   = (weapon.pierce !== undefined) ? weapon.pierce + bonuses.pierceDelta : weapon.pierce;
        if (bonuses.cooldownMult !== 1) weapon.cooldown = Math.max(0.1, (weapon.cooldown ?? 1) * bonuses.cooldownMult);
        if (bonuses.orbitDelta)     weapon.orbitRadius = (weapon.orbitRadius !== undefined) ? weapon.orbitRadius + bonuses.orbitDelta : weapon.orbitRadius;
      }
    }
  },
};
