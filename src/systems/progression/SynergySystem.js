/**
 * src/systems/progression/SynergySystem.js
 *
 * 역할:
 *   보유 업그레이드 조합에서 시너지 조건을 확인하고,
 *   조건 충족 시 플레이어/무기에 추가 보너스를 적용한다.
 *
 * 사용 방법 (PlayScene 또는 UpgradeSystem 선택 완료 후 1회 호출):
 *   SynergySystem.applyAll({ player, upgradeData });
 *
 * upgradeData에 시너지 추가 방법:
 *   {
 *     id: 'frost_synergy',
 *     name: 'Frost Mastery',
 *     requires: ['frost_nova', 'magic_bolt'],   // 이 업그레이드를 모두 보유해야 발동
 *     modifiers: { playerModifiers: { moveSpeed: +20 } },
 *   }
 *
 * 계약:
 *   - 입력: player (보유 업그레이드 목록 포함), upgradeData (시너지 정의 포함)
 *   - 쓰기: player.activeSynergies 갱신, 시너지 modifier 적용
 *   - 출력: 없음
 *
 * 주의:
 *   - 매번 전체 재계산 (덮어쓰기) 방식 → 순서 의존 없음
 *   - 시너지 modifier는 기본값에서 더하는 방식 (곱하기 적용 시 weaponModifiers 확장 필요)
 */

/**
 * 플레이어가 특정 upgradeId를 보유하고 있는지 확인.
 * @param {object} player
 * @param {string} upgradeId
 * @returns {boolean}
 */
function playerHasUpgrade(player, upgradeId) {
  // 보유 업그레이드는 player.acquiredUpgrades (Set 또는 Map<id, level>) 형태를 가정
  if (player.acquiredUpgrades instanceof Set) {
    return player.acquiredUpgrades.has(upgradeId);
  }
  if (player.acquiredUpgrades instanceof Map) {
    return (player.acquiredUpgrades.get(upgradeId) ?? 0) > 0;
  }
  // 배열인 경우 (하위 호환)
  if (Array.isArray(player.acquiredUpgrades)) {
    return player.acquiredUpgrades.some(u =>
      (typeof u === 'string' ? u : u.id) === upgradeId
    );
  }
  return false;
}

export const SynergySystem = {
  /**
   * 활성 시너지를 전부 재계산하고 보너스를 적용한다.
   * UpgradeSystem.applyUpgrade() 직후 또는 런 시작 시 1회 호출.
   *
   * @param {{ player: object, upgradeData: object[] }} param
   */
  applyAll({ player, upgradeData }) {
    if (!player || !upgradeData) return;

    // 이전 시너지 보너스 초기화를 위해 activeSynergies 갱신
    player.activeSynergies = player.activeSynergies ?? [];
    const previousIds = new Set(player.activeSynergies.map(s => s.id));
    const newActive   = [];

    // 시너지 조건이 있는 업그레이드만 순회
    const synergies = upgradeData.filter(u => Array.isArray(u.requires) && u.requires.length > 0);

    for (const synergy of synergies) {
      const allMet = synergy.requires.every(reqId => playerHasUpgrade(player, reqId));
      if (!allMet) continue;

      newActive.push({ id: synergy.id, name: synergy.name });

      // 신규 시너지 발동 시만 modifier 적용
      if (!previousIds.has(synergy.id)) {
        this._applyModifiers(player, synergy.modifiers);
        console.log(`[SynergySystem] 시너지 발동: "${synergy.name}"`);
      }
    }

    player.activeSynergies = newActive;
  },

  /**
   * modifier 객체를 player에 적용.
   * @private
   */
  _applyModifiers(player, modifiers) {
    if (!modifiers) return;

    // 플레이어 수치 modifier
    if (modifiers.playerModifiers) {
      for (const [key, delta] of Object.entries(modifiers.playerModifiers)) {
        if (typeof player[key] === 'number') {
          player[key] += delta;
        }
      }
    }

    // 무기 수치 modifier (weaponId 지정 시 해당 무기에만, 없으면 전체)
    if (modifiers.weaponModifiers && Array.isArray(player.weapons)) {
      for (const weapon of player.weapons) {
        const wMod = modifiers.weaponModifiers[weapon.id]
          ?? modifiers.weaponModifiers['*'];  // '*' = 전체 무기 공통
        if (!wMod) continue;
        for (const [key, delta] of Object.entries(wMod)) {
          if (typeof weapon[key] === 'number') {
            weapon[key] += delta;
          }
        }
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────
// upgradeData.js에 시너지 항목 추가 예시 (참고용)
// ─────────────────────────────────────────────────────────────────
//
// {
//   id:          'frost_mastery',
//   name:        'Frost Mastery',
//   description: 'Frost Nova + Magic Bolt 동시 보유 시 이동속도 +20, 냉각 쿨타임 -20%',
//   requires:    ['frost_nova_upgrade', 'magic_bolt_upgrade'],
//   modifiers: {
//     playerModifiers: { moveSpeed: 20 },
//     weaponModifiers: {
//       frost_nova: { cooldown: -0.4 },
//     },
//   },
//   maxLevel: 1,   // 시너지는 보통 1회만 발동
// }
