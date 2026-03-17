/**
 * synergyData.js — 업그레이드 시너지 정의
 *
 * WHY(P3): 개별 업그레이드 수치 강화만으로는 빌드 다양성이 낮아진다.
 *   특정 업그레이드 조합 보유 시 추가 보너스를 발동시키는 시너지 시스템으로
 *   매 런마다 다른 전략적 선택을 유도한다.
 *
 * UpgradeSystem 통합 방법:
 *   1. generateChoices()에서 보유 업그레이드 조합 확인
 *   2. requires가 모두 충족된 시너지 중 미발동(activated: false) 항목을 우선 표시
 *   3. applyUpgrade()에서 시너지 조건 재검사 → applySynergy() 호출
 *
 * 시너지 적용 예시 코드 (UpgradeSystem.js에 추가):
 *
 *   import { synergyData } from '../../data/synergyData.js';
 *
 *   checkAndApplySynergies(player) {
 *     const owned = new Set(
 *       Object.keys(player.upgradeCounts ?? {})
 *         .filter(id => (player.upgradeCounts[id] ?? 0) > 0)
 *     );
 *     player.weapons.forEach(w => owned.add(w.id));
 *
 *     for (const syn of synergyData) {
 *       if (player.activeSynergies?.has(syn.id)) continue;
 *       if (syn.requires.every(r => owned.has(r))) {
 *         this.applySynergy(player, syn);
 *         (player.activeSynergies ??= new Set()).add(syn.id);
 *       }
 *     }
 *   },
 *
 *   applySynergy(player, syn) {
 *     const b = syn.bonus;
 *     if (b.maxHpDelta)    { player.maxHp += b.maxHpDelta; player.hp = Math.min(player.hp + b.maxHpDelta, player.maxHp); }
 *     if (b.speedMult)     player.speed     = Math.round(player.speed     * b.speedMult);
 *     if (b.lifestealDelta) player.lifesteal = Math.min(1, (player.lifesteal ?? 0) + b.lifestealDelta);
 *     // 무기 수치 강화
 *     if (b.weaponId && b.damageDelta) {
 *       const w = player.weapons.find(w => w.id === b.weaponId);
 *       if (w) w.damage += b.damageDelta;
 *     }
 *     console.log(`[Synergy] "${syn.name}" 발동!`);
 *   },
 */

/** @typedef {Object} SynergyDef
 * @property {string}   id             고유 식별자
 * @property {string}   name           표시 이름
 * @property {string}   description    UI 설명 문자열
 * @property {string[]} requires       필요한 upgradeId 또는 weaponId 목록 (AND 조건)
 * @property {object}   bonus          적용할 수치 변화
 * @property {number}   [bonus.maxHpDelta]
 * @property {number}   [bonus.speedMult]
 * @property {number}   [bonus.lifestealDelta]
 * @property {string}   [bonus.weaponId]      무기 개별 강화 시 대상
 * @property {number}   [bonus.damageDelta]
 * @property {number}   [bonus.cooldownMult]
 * @property {number}   [bonus.pierceDelta]
 * @property {number}   [bonus.orbitRadiusDelta]
 */

/** @type {SynergyDef[]} */
export const synergyData = [
  {
    id:          'iron_will',
    name:        '강철 의지',
    description: '최대 체력 강화 + 이동속도 강화를 모두 보유하면 추가로 체력 회복력이 생긴다.',
    requires:    ['stat_max_hp', 'stat_speed'],
    bonus:       { lifestealDelta: 0.05 },
  },
  {
    id:          'fire_vortex',
    name:        '화염 소용돌이',
    description: '궤도 무기와 화염 버스트를 동시에 보유하면 궤도 무기가 화상을 입힌다.',
    requires:    ['weapon_orbit', 'weapon_area_burst'],
    bonus:       {
      weaponId:    'weapon_orbit',
      damageDelta: 3,
    },
  },
  {
    id:          'glass_cannon',
    name:        '유리대포',
    description: '공격력 강화를 2회 이상 보유하면 투사체가 1개 더 관통한다.',
    requires:    ['upgrade_damage_1', 'upgrade_damage_2'],
    bonus:       {
      weaponId:    'weapon_basic',
      pierceDelta: 1,
    },
  },
  {
    id:          'orbital_fortress',
    name:        '궤도 요새',
    description: '궤도 무기를 최대 레벨까지 강화하면 궤도 반경이 25% 확장된다.',
    requires:    ['weapon_orbit', 'upgrade_orbit_max'],
    bonus:       {
      weaponId:        'weapon_orbit',
      orbitRadiusDelta: 20,
    },
  },
  {
    id:          'bloodlust',
    name:        '피의 갈증',
    description: '흡혈 강화 + 이동속도 강화를 모두 보유하면 이동속도가 추가로 증가한다.',
    requires:    ['stat_lifesteal', 'stat_speed'],
    bonus:       { speedMult: 1.1 },
  },
  {
    id:          'rapid_barrage',
    name:        '속사 연사',
    description: '쿨다운 강화 2회 + 관통 강화를 동시에 보유하면 기본 투사체 쿨다운이 추가 단축된다.',
    requires:    ['upgrade_cooldown_1', 'upgrade_cooldown_2', 'upgrade_pierce'],
    bonus:       {
      weaponId:    'weapon_basic',
      cooldownMult: 0.85,
    },
  },
];
