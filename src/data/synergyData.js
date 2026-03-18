/**
 * src/data/synergyData.js — 업그레이드 시너지 정의
 *
 * FIX: requires 필드 ID 동기화
 *   Before (오류 상태):
 *     'stat_max_hp'       → upgradeData에 없음 (올바른 ID: 'stat_maxhp')
 *     'weapon_orbit'      → upgradeData/weaponData에 없음 (weaponId: 'lightning_ring')
 *     'weapon_area_burst' → 없음 (weaponId: 'holy_aura' 또는 'frost_nova')
 *     'upgrade_damage_1'  → 없음 (올바른 ID: 'up_magic_bolt')
 *     'upgrade_damage_2'  → 없음
 *     'upgrade_orbit_max' → 없음 (올바른 ID: 'up_lightning_ring')
 *     'upgrade_cooldown_1/2' → 없음
 *     'upgrade_pierce'    → 없음 (올바른 ID: 'up_boomerang')
 *   After: 실제 upgradeData.js 및 weaponData.js의 ID와 일치
 *
 * 시너지 requires 규칙:
 *   - upgradeData의 id (예: 'stat_maxhp', 'up_magic_bolt') 또는
 *   - weaponData의 id (예: 'lightning_ring', 'frost_nova') 참조
 *   - validateData.js가 두 목록 모두 조회하므로 어느 쪽이든 유효
 */

/** @typedef {Object} SynergyDef
 * @property {string}   id
 * @property {string}   name
 * @property {string}   description
 * @property {string[]} requires   upgradeData.id 또는 weaponData.id (AND 조건)
 * @property {object}   bonus
 */

/** @type {SynergyDef[]} */
export const synergyData = [
  // ── 스탯 시너지 ──────────────────────────────────────────────────
  {
    id:          'iron_will',
    name:        '강철 의지',
    description: '최대 체력 강화 + 이동속도 강화를 모두 보유하면 추가로 흡혈이 생긴다.',
    // FIX: 'stat_max_hp' → 'stat_maxhp' (upgradeData 실제 ID)
    requires:    ['stat_maxhp', 'stat_speed'],
    bonus:       { lifestealDelta: 0.05 },
  },
  {
    id:          'vampire_lord',
    name:        '뱀파이어 군주',
    description: '흡혈 강화 + 최대 체력 강화를 모두 보유하면 이동 속도가 증가한다.',
    requires:    ['stat_lifesteal', 'stat_maxhp'],
    bonus:       { speedMult: 1.10 },
  },

  // ── 무기 조합 시너지 ─────────────────────────────────────────────
  {
    id:          'fire_vortex',
    name:        '화염 소용돌이',
    description: '번개 구체와 냉기 폭발을 동시에 보유하면 번개 구체 데미지가 증가한다.',
    // FIX: 'weapon_orbit' → 'lightning_ring', 'weapon_area_burst' → 'frost_nova'
    //      (weaponData 실제 ID 사용)
    requires:    ['lightning_ring', 'frost_nova'],
    bonus:       { weaponId: 'lightning_ring', damageDelta: 3 },
  },
  {
    id:          'glass_cannon',
    name:        '유리대포',
    description: '마법탄 강화 + 부메랑을 동시에 보유하면 마법탄이 추가 관통한다.',
    // FIX: 'upgrade_damage_1' → 'up_magic_bolt', 'upgrade_damage_2' → 'boomerang'
    requires:    ['up_magic_bolt', 'boomerang'],
    bonus:       { weaponId: 'magic_bolt', pierceDelta: 1 },
  },
  {
    id:          'orbital_fortress',
    name:        '궤도 요새',
    description: '번개 구체 강화를 최대 적용하면 궤도 반경이 추가 증가한다.',
    // FIX: 'weapon_orbit' → 'lightning_ring', 'upgrade_orbit_max' → 'up_lightning_ring'
    requires:    ['lightning_ring', 'up_lightning_ring'],
    bonus:       { weaponId: 'lightning_ring', orbitRadiusDelta: 24 },
  },
  {
    id:          'rapid_barrage',
    name:        '신속 사격',
    description: '마법탄 강화 + 부메랑 강화를 모두 보유하면 마법탄 쿨다운이 추가 감소한다.',
    // FIX: 'upgrade_cooldown_1', 'upgrade_cooldown_2', 'upgrade_pierce'
    //      → 'up_magic_bolt', 'up_boomerang' (실제 upgradeData ID)
    requires:    ['up_magic_bolt', 'up_boomerang'],
    bonus:       { weaponId: 'magic_bolt', cooldownMult: 0.85 },
  },
];
