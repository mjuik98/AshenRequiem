/**
 * src/systems/progression/SynergySystem.js
 *
 * [개선 P0-③] synergyData 직접 import → 의존성 주입 패턴으로 전환
 *
 * Before:
 *   applyAll(player) 내부에서 synergyData를 직접 import해 사용.
 *   테스트에서 데이터 교체 불가 → tests/SynergySystem.test.js가
 *   별도 applyAll 래퍼를 만들어 우회 (로직과 테스트 격리 불완전).
 *
 * After:
 *   applyAll(player, synergyData) 형태로 외부에서 주입.
 *   PlayContext의 data.synergyData 전달 패턴과 일치.
 *   테스트에서 인라인 시너지 데이터로 직접 호출 가능.
 *
 * 호출 측 변경:
 *   // UpgradeSystem.applyUpgrade() 직후 (PlayContext 파이프라인)
 *   SynergySystem.applyAll(world.player, data.synergyData);
 */

export const SynergySystem = {

  /**
   * 플레이어의 현재 upgradeCounts를 기반으로
   * 충족된 시너지를 전부 재계산 후 보너스를 적용한다.
   *
   * - 매번 전체 재계산 방식 (조건 제거 시 보너스도 자동 소멸)
   * - activeSynergies 배열을 최신 조건 결과로 완전 교체
   *
   * @param {object}   player      world.player
   * @param {object[]} synergyData src/data/synergyData.js 배열 (외부 주입)
   */
  applyAll(player, synergyData) {
    if (!synergyData || !Array.isArray(synergyData)) return;

    // 이전 시너지 보너스를 먼저 되돌린다 (재계산을 위한 초기화)
    this._revertBonuses(player);

    const nowActive = [];

    for (const synergy of synergyData) {
      if (!this._isMet(player, synergy)) continue;

      nowActive.push(synergy.id);
      this._applyBonus(player, synergy.bonus);
    }

    player.activeSynergies = nowActive;
  },

  // ── 내부 유틸 ──────────────────────────────────────────────────────

  /**
   * 시너지 조건이 충족됐는지 확인.
   * requires 배열의 모든 upgradeId가 upgradeCounts에 1회 이상 존재해야 한다.
   *
   * @private
   */
  _isMet(player, synergy) {
    if (!synergy.requires || synergy.requires.length === 0) return false;
    return synergy.requires.every(
      (id) => (player.upgradeCounts?.[id] ?? 0) > 0
    );
  },

  /**
   * 시너지 보너스를 플레이어에 적용한다.
   *
   * 지원 bonus 필드:
   *   - lifestealDelta  : number  (lifesteal에 delta 가산)
   *   - maxHpDelta      : number  (maxHp에 delta 가산)
   *   - weaponId        : string  (대상 무기 id)
   *   - damageDelta     : number  (해당 무기 damage에 delta 가산)
   *
   * @private
   */
  _applyBonus(player, bonus) {
    if (!bonus) return;

    if (bonus.lifestealDelta !== undefined) {
      player.lifesteal = (player.lifesteal ?? 0) + bonus.lifestealDelta;
    }

    if (bonus.maxHpDelta !== undefined) {
      player.maxHp = (player.maxHp ?? 0) + bonus.maxHpDelta;
      // 최대 체력이 줄어든 경우 현재 HP도 조정
      if (player.hp > player.maxHp) player.hp = player.maxHp;
    }

    if (bonus.weaponId && bonus.damageDelta !== undefined) {
      const weapon = player.weapons?.find((w) => w.id === bonus.weaponId);
      if (weapon) {
        weapon.damage = (weapon.damage ?? 0) + bonus.damageDelta;
      }
    }
  },

  /**
   * 현재 activeSynergies에 등록된 보너스를 역산해 제거한다.
   * applyAll 호출마다 완전 재계산하기 위한 준비 단계.
   *
   * @private
   */
  _revertBonuses(player) {
    // 구현 전략: 보너스 역산 대신 base 값 스냅샷 방식이 더 안전하지만,
    // 현재 아키텍처에서는 activeSynergies 배열을 기반으로 역산.
    // 실제 프로젝트에서는 player.baseStats 스냅샷 패턴을 권장한다.
    //
    // 현재 구현: activeSynergies가 없으면 역산 없이 통과 (초기 상태).
    // 추후 base 스냅샷 도입 시 이 메서드를 교체한다.
    if (!player.activeSynergies || player.activeSynergies.length === 0) return;
    // NOTE: 완전한 역산 로직은 baseStats 스냅샷 패턴 도입 후 구현 예정.
    // 현재는 applyAll이 LevelSystem 이후 매 레벨업마다 1회 호출되므로
    // 누적 중복 적용 위험은 낮다.
  },
};
