/**
 * permanentUpgradeData.js — 영구 업그레이드(메타 진행) 정의
 *
 * costPerLevel(currentLevel) — 다음 레벨 구매 비용
 * effect.stat               — 적용 대상 스탯
 * effect.valuePerLevel      — 레벨당 적용 수치
 *
 * 지원 stat:
 *   maxHp         — 최대 HP (flat 가산)
 *   moveSpeed     — 이동 속도 (flat 가산)
 *   magnetRadius  — 픽업 흡수 범위 (flat 가산)
 *   lifesteal     — 흡혈 (flat 가산)
 *   damageMult    — 무기 데미지 배율 (flat 가산, 0.05 = +5%)
 */
export const permanentUpgradeData = [
  {
    id:           'perm_hp',
    name:         '강인한 체질',
    description:  '최대 HP +10',
    icon:         '❤',
    maxLevel:     10,
    costPerLevel: (level) => 10 + level * 5,
    effect:       { stat: 'maxHp', valuePerLevel: 10 },
  },
  {
    id:           'perm_speed',
    name:         '민첩한 발걸음',
    description:  '이동 속도 +5',
    icon:         '💨',
    maxLevel:     8,
    costPerLevel: (level) => 15 + level * 8,
    effect:       { stat: 'moveSpeed', valuePerLevel: 5 },
  },
  {
    id:           'perm_damage',
    name:         '전투 숙련',
    description:  '모든 무기 데미지 +5%',
    icon:         '⚔',
    maxLevel:     5,
    costPerLevel: (level) => 30 + level * 15,
    effect:       { stat: 'damageMult', valuePerLevel: 0.05 },
  },
  {
    id:           'perm_magnet',
    name:         '넓은 손',
    description:  '픽업 흡수 범위 +15',
    icon:         '🧲',
    maxLevel:     6,
    costPerLevel: (level) => 12 + level * 6,
    effect:       { stat: 'magnetRadius', valuePerLevel: 15 },
  },
  {
    id:           'perm_lifesteal',
    name:         '흡혈 각성',
    description:  '흡혈 +3%',
    icon:         '🩸',
    maxLevel:     5,
    costPerLevel: (level) => 25 + level * 12,
    effect:       { stat: 'lifesteal', valuePerLevel: 0.03 },
  },
];

/** id로 영구 업그레이드 데이터 조회 */
export function getPermanentUpgradeById(id) {
  return permanentUpgradeData.find(u => u.id === id) ?? null;
}

/**
 * 세션의 permanentUpgrades를 player 기본 스탯에 반영한다.
 * createPlayer() 내부에서 한 번 호출된다.
 *
 * damageMult는 player.globalDamageMult에 누산된다.
 * 나머지 stat은 flat 가산된다.
 *
 * @param {object} player              생성 중인 플레이어 객체
 * @param {Record<string,number>} perm  session.meta.permanentUpgrades
 */
export function applyPermanentUpgrades(player, perm) {
  if (!perm) return;

  for (const [id, level] of Object.entries(perm)) {
    if (!level || level <= 0) continue;
    const def = getPermanentUpgradeById(id);
    if (!def) continue;

    const { stat, valuePerLevel } = def.effect;
    const total = valuePerLevel * level;

    if (stat === 'damageMult') {
      // flat 가산으로 globalDamageMult 증가 (0.05 * 3 = +15% → mult = 1.15)
      player.globalDamageMult = (player.globalDamageMult ?? 1) + total;
    } else if (stat === 'maxHp') {
      player.maxHp += total;
      player.hp    += total;
    } else {
      player[stat] = (player[stat] ?? 0) + total;
    }
  }
}
