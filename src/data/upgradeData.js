import { getWeaponDataById } from '../data/weaponData.js';

/**
 * upgradeData.js — 업그레이드 정의
 *
 * FIX(balance): stat 타입 업그레이드에 maxCount 추가.
 *   이전: stat 업그레이드는 무제한 반복 선택 가능 → HP 무한 증가 등 밸런스 붕괴.
 *   이후: maxCount 를 초과하면 UpgradeSystem.generateChoices 에서 제외됨.
 *
 * weapon_new / weapon_upgrade 는 기존 방식(weaponId + maxLevel) 유지.
 */
export const upgradeData = [

  // ── 무기 신규 획득 (weaponId는 weaponData.js의 실제 id와 일치) ──
  {
    id: 'acquire_holy_aura',
    type: 'weapon_new',
    weaponId: 'holy_aura',
    name: 'Holy Aura',
    description: '성스러운 오라 획득',
    icon: '🔆',
  },
  {
    id: 'acquire_lightning_ring',
    type: 'weapon_new',
    weaponId: 'lightning_ring',
    name: 'Lightning Ring',
    description: '회전 전기 구체 획득',
    icon: '⚡',
  },
  {
    id: 'acquire_frost_nova',
    type: 'weapon_new',
    weaponId: 'frost_nova',
    name: 'Frost Nova',
    description: '냉기 폭발 획득',
    icon: '❄️',
  },
  {
    id: 'acquire_boomerang',
    type: 'weapon_new',
    weaponId: 'boomerang',
    name: 'Boomerang',
    description: '관통 부메랑 획득',
    icon: '🪃',
  },

  // ── 무기 강화 ───────────────────────────────────────────────
  {
    id: 'upgrade_magic_bolt',
    type: 'weapon_upgrade',
    weaponId: 'magic_bolt',
    name: 'Magic Bolt 강화',
    description: '데미지 +1, 쿨다운 -0.05s',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'magic_bolt');
      if (w) { w.damage += 1; w.cooldown = Math.max(0.2, w.cooldown - 0.05); }
    },
  },
  {
    id: 'upgrade_holy_aura',
    type: 'weapon_upgrade',
    weaponId: 'holy_aura',
    name: 'Holy Aura 강화',
    description: '범위 +15, 데미지 +1',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'holy_aura');
      if (w) { w.damage += 1; w.range += 15; w.radius += 15; }
    },
  },
  {
    id: 'upgrade_lightning_ring',
    type: 'weapon_upgrade',
    weaponId: 'lightning_ring',
    name: 'Lightning Ring 강화',
    description: '구체 +1개, 반경 +10px',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'lightning_ring');
      if (w) { w.orbitCount = (w.orbitCount || 3) + 1; w.orbitRadius += 10; }
    },
  },
  {
    id: 'upgrade_frost_nova',
    type: 'weapon_upgrade',
    weaponId: 'frost_nova',
    name: 'Frost Nova 강화',
    description: '범위 +20, 빙결 확률 +10%',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'frost_nova');
      if (w) {
        w.radius += 20;
        w.range  += 20;
        w.statusEffectChance = Math.min(1, (w.statusEffectChance || 0.6) + 0.1);
      }
    },
  },
  {
    id: 'upgrade_boomerang',
    type: 'weapon_upgrade',
    weaponId: 'boomerang',
    name: 'Boomerang 강화',
    description: '데미지 +2, 관통 +2',
    icon: '⬆️',
    apply(player) {
      const w = player.weapons.find(w => w.id === 'boomerang');
      if (w) { w.damage += 2; w.pierce += 2; }
    },
  },

  // ── 스탯 업그레이드 (maxCount로 상한 설정) ─────────────────
  {
    id: 'stat_max_hp',
    type: 'stat',
    maxCount: 5,          // FIX: 최대 5회 → +100 HP까지만
    name: 'Max HP +20',
    description: '최대 체력 증가',
    icon: '❤️',
    apply(player) { player.maxHp += 20; player.hp += 20; },
  },
  {
    id: 'stat_move_speed',
    type: 'stat',
    maxCount: 4,          // FIX: 최대 4회 → 약 1.75× 속도
    name: '이동 속도 +15%',
    description: '더 빠르게 움직인다',
    icon: '🏃',
    apply(player) { player.moveSpeed *= 1.15; },
  },
  {
    id: 'stat_magnet',
    type: 'stat',
    maxCount: 4,          // FIX: 최대 4회 → +100 흡수 범위
    name: '흡수 범위 +25',
    description: '경험치 보석을 더 넓게 흡수',
    icon: '🧲',
    apply(player) { player.magnetRadius += 25; },
  },
  {
    id: 'stat_lifesteal',
    type: 'stat',
    maxCount: 4,          // FIX: 최대 4회 → 상한 0.5 (50%)
    name: '흡혈 +8%',
    description: '적에게 입힌 데미지의 8% 회복',
    icon: '🩸',
    apply(player) {
      player.lifesteal = Math.min(0.5, (player.lifesteal || 0) + 0.08);
    },
  },
  {
    id: 'stat_multishot',
    type: 'stat',
    maxCount: 2,          // FIX: 최대 2회 → projectileCount 최대 3
    name: '멀티샷',
    description: '투사체 무기가 추가로 1발 더 발사',
    icon: '🔀',
    apply(player) {
      player.weapons.forEach(w => {
        if (w.behaviorId === 'targetProjectile') {
          w.projectileCount = Math.min((w.projectileCount || 1) + 1, 3);
        }
      });
    },
  },
  {
    id: 'stat_cooldown',
    type: 'stat',
    maxCount: 4,          // FIX: 최대 4회 → 쿨다운 약 60%로 감소
    name: '쿨다운 -12%',
    description: '모든 무기 쿨다운 감소',
    icon: '⏱️',
    apply(player) {
      player.weapons.forEach(w => {
        w.cooldown = Math.max(0.15, w.cooldown * 0.88);
      });
    },
  },
];
