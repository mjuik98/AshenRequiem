/**
 * upgradeData.js — 레벨업 선택지 정의
 *
 * type: 'weapon_new' | 'weapon_upgrade' | 'stat'
 */
export const upgradeData = [
  // 무기 획득
  {
    id: 'acquire_magic_bolt',
    type: 'weapon_new',
    weaponId: 'magic_bolt',
    name: 'Magic Bolt',
    description: '마법탄 획득',
    icon: '✨',
  },
  {
    id: 'acquire_holy_aura',
    type: 'weapon_new',
    weaponId: 'holy_aura',
    name: 'Holy Aura',
    description: '성스러운 오라 획득',
    icon: '🔆',
  },

  // 무기 강화
  {
    id: 'upgrade_magic_bolt',
    type: 'weapon_upgrade',
    weaponId: 'magic_bolt',
    name: 'Magic Bolt 강화',
    description: '마법탄 데미지 +1, 쿨다운 -0.05초',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'magic_bolt');
      if (w) {
        w.damage += 1;
        w.cooldown = Math.max(0.2, w.cooldown - 0.05);
      }
    },
  },
  {
    id: 'upgrade_holy_aura',
    type: 'weapon_upgrade',
    weaponId: 'holy_aura',
    name: 'Holy Aura 강화',
    description: '오라 범위 +15, 데미지 +1',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'holy_aura');
      if (w) {
        w.damage += 1;
        w.range += 15;
        w.radius += 15;
      }
    },
  },

  // 스탯 업그레이드
  {
    id: 'stat_max_hp',
    type: 'stat',
    name: 'Max HP +20',
    description: '최대 체력 증가',
    icon: '❤️',
    apply(player) {
      player.maxHp += 20;
      player.hp += 20;
    },
  },
  {
    id: 'stat_move_speed',
    type: 'stat',
    name: '이동 속도 +15%',
    description: '더 빠르게 움직인다',
    icon: '🏃',
    apply(player) {
      player.moveSpeed *= 1.15;
    },
  },
  {
    id: 'stat_magnet',
    type: 'stat',
    name: '흡수 범위 +25',
    description: '경험치 보석을 더 넓게 흡수',
    icon: '🧲',
    apply(player) {
      player.magnetRadius += 25;
    },
  },
];
