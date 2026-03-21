/**
 * upgradeData.js — 업그레이드 선택지 정의
 *
 * CHANGE: 골드 획득 장신구 2종 추가
 *   - acc_coin_pendant    : 동전 목걸이 획득
 *   - acc_greed_amulet   : 탐욕의 부적 획득
 *   - up_coin_pendant    : 동전 목걸이 강화
 *   - up_greed_amulet    : 탐욕의 부적 강화
 */
import {
  accessoryData,
  buildAccessoryPickupDesc,
  buildAccessoryUpgradeDesc,
} from './accessoryData.js';

export const upgradeData = [
  // ── 신규 무기 ────────────────────────────────────────────────────────────────
  { id: 'get_holy_aura',      type: 'weapon_new',     weaponId: 'holy_aura',      name: '성스러운 오라',      description: '주변에 신성한 오라 발동' },
  { id: 'get_lightning_ring', type: 'weapon_new',     weaponId: 'lightning_ring', name: '번개의 고리', description: '회전하는 전기 구체 획득' },
  { id: 'get_frost_nova',     type: 'weapon_new',     weaponId: 'frost_nova',     name: '냉기 폭발',     description: '냉기 폭발 획득' },
  { id: 'get_boomerang',      type: 'weapon_new',     weaponId: 'boomerang',      name: '부메랑',      description: '관통 부메랑 획득' },
  { id: 'get_chain_lightning',type: 'weapon_new',     weaponId: 'chain_lightning',name: '연쇄 번개',       description: '연쇄 번개 획득' },

  // ── 무기 강화 ────────────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: '마법탄 +', description: '마법탄 데미지 +1, 쿨다운 감소',
    damageDelta: 1, cooldownMult: 0.92,
  },
  {
    id: 'up_holy_aura', type: 'weapon_upgrade', weaponId: 'holy_aura',
    name: '성스러운 오라 +', description: '오라 데미지 +1, 범위 확대',
    damageDelta: 1, cooldownMult: 0.92, orbitRadiusDelta: 8,
  },
  {
    id: 'up_lightning_ring', type: 'weapon_upgrade', weaponId: 'lightning_ring',
    name: '번개의 고리 +', description: '전기 구체 데미지 +1',
    damageDelta: 1, cooldownMult: 0.95,
  },
  {
    id: 'up_frost_nova', type: 'weapon_upgrade', weaponId: 'frost_nova',
    name: '냉기 폭발 +', description: '냉기 폭발 데미지 +2',
    damageDelta: 2, cooldownMult: 0.92,
  },
  {
    id: 'up_boomerang', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: '부메랑 +', description: '부메랑 데미지 +1, 관통 +1',
    damageDelta: 1, cooldownMult: 0.95, pierceDelta: 1,
  },
  {
    id: 'up_chain_lightning', type: 'weapon_upgrade', weaponId: 'chain_lightning',
    name: '연쇄 번개 +', description: '번개 데미지 +2, 연쇄 +1',
    damageDelta: 2, cooldownMult: 0.93,
  },

  // ── 다중 투사체 강화 ─────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt_multishot', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: '마법탄 다중 발사',
    description: '마법탄 동시 발사 수 +1 (최대 3발)',
    damageDelta: 0, cooldownMult: 1.0,
    projectileCountDelta: 1,
    skipLevelUp: true,
    maxCount: 2,
  },
  {
    id: 'up_boomerang_multishot', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: 'Boomerang 다중 투척',
    description: '부메랑 동시 투척 수 +1 (최대 2개)',
    damageDelta: 0, cooldownMult: 1.0,
    projectileCountDelta: 1,
    skipLevelUp: true,
    maxCount: 1,
  },

  // ── 진화 무기 강화 ───────────────────────────────────────────────────────────
  {
    id: 'up_arcane_nova_plus', type: 'weapon_upgrade', weaponId: 'arcane_nova',
    name: '비전 폭발 +', description: 'Nova 데미지 +2, 발사 수 +2',
    damageDelta: 2, cooldownMult: 0.92,
    projectileCountDelta: 2,
  },
  {
    id: 'up_storm_crown_plus', type: 'weapon_upgrade', weaponId: 'storm_crown',
    name: '폭풍의 왕관 +', description: 'Storm Crown 데미지 +2',
    damageDelta: 2, cooldownMult: 0.95,
  },
  {
    id: 'up_divine_shield_plus', type: 'weapon_upgrade', weaponId: 'divine_shield',
    name: '신성한 방패 +', description: 'Shield 데미지 +3, 범위 확대',
    damageDelta: 3, cooldownMult: 0.92, orbitRadiusDelta: 12,
  },
  {
    id: 'up_infinity_blade_plus', type: 'weapon_upgrade', weaponId: 'infinity_blade',
    name: '무한의 칼날 +', description: 'Blade 데미지 +5, 관통 +3',
    damageDelta: 5, cooldownMult: 0.92, pierceDelta: 3,
  },
  {
    id: 'up_blizzard_nova_plus', type: 'weapon_upgrade', weaponId: 'blizzard_nova',
    name: '블리자드 노바 +', description: 'Nova 데미지 +2, 범위 확대',
    damageDelta: 2, cooldownMult: 0.92, orbitRadiusDelta: 15,
  },

  // ── HP 회복 (폴백 전용) ──────────────────────────────────────────────────────
  { id: 'stat_heal', type: 'stat', name: 'HP 회복', description: '현재 HP +25 즉시 회복', effect: { stat: 'hp', value: 25 } },
  { id: 'stat_gold', type: 'stat', name: '골드 획득', description: '골드 +25 즉시 획득', effect: { stat: 'currency', value: 25 } },
  ...accessoryData.map(acc => ({
    id: `acc_${acc.id}`,
    type: 'accessory',
    accessoryId: acc.id,
    name: acc.name,
    description: buildAccessoryPickupDesc(acc),
  })),
  ...accessoryData.map(acc => ({
    id: `up_${acc.id}`,
    type: 'accessory_upgrade',
    accessoryId: acc.id,
    name: `${acc.name} +`,
    description: buildAccessoryUpgradeDesc(acc),
  })),
];
