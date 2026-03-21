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
  { id: 'get_solar_ray',      type: 'weapon_new',     weaponId: 'solar_ray',      name: '태양 광선',      description: '직선 관통 레이저 획득' },
  { id: 'get_piercing_spear', type: 'weapon_new',     weaponId: 'piercing_spear', name: '관통 창',       description: '직선 관통 창 획득' },
  { id: 'get_flame_zone',     type: 'weapon_new',     weaponId: 'flame_zone',     name: '화염 지대',      description: '지속 피해 장판 획득' },
  { id: 'get_venom_bog',      type: 'weapon_new',     weaponId: 'venom_bog',      name: '독성 늪',       description: '감속 독늪 장판 획득' },
  { id: 'get_crystal_shard',  type: 'weapon_new',     weaponId: 'crystal_shard',  name: '수정 파편',      description: '반사 탄환 획득' },
  { id: 'get_radiant_orb',    type: 'weapon_new',     weaponId: 'radiant_orb',    name: '성광 탄환',      description: '안정적인 반사 구체 획득' },

  // ── 무기 강화 ────────────────────────────────────────────────────────────────
  {
    id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
    name: '마법탄 +', description: '다음 성장 적용',
  },
  {
    id: 'up_holy_aura', type: 'weapon_upgrade', weaponId: 'holy_aura',
    name: '성스러운 오라 +', description: '다음 성장 적용',
  },
  {
    id: 'up_lightning_ring', type: 'weapon_upgrade', weaponId: 'lightning_ring',
    name: '번개의 고리 +', description: '다음 성장 적용',
  },
  {
    id: 'up_frost_nova', type: 'weapon_upgrade', weaponId: 'frost_nova',
    name: '냉기 폭발 +', description: '다음 성장 적용',
  },
  {
    id: 'up_boomerang', type: 'weapon_upgrade', weaponId: 'boomerang',
    name: '부메랑 +', description: '다음 성장 적용',
  },
  {
    id: 'up_chain_lightning', type: 'weapon_upgrade', weaponId: 'chain_lightning',
    name: '연쇄 번개 +', description: '다음 성장 적용',
  },
  {
    id: 'up_solar_ray', type: 'weapon_upgrade', weaponId: 'solar_ray',
    name: '태양 광선 +', description: '다음 성장 적용',
  },
  {
    id: 'up_piercing_spear', type: 'weapon_upgrade', weaponId: 'piercing_spear',
    name: '관통 창 +', description: '다음 성장 적용',
  },
  {
    id: 'up_flame_zone', type: 'weapon_upgrade', weaponId: 'flame_zone',
    name: '화염 지대 +', description: '다음 성장 적용',
  },
  {
    id: 'up_venom_bog', type: 'weapon_upgrade', weaponId: 'venom_bog',
    name: '독성 늪 +', description: '다음 성장 적용',
  },
  {
    id: 'up_crystal_shard', type: 'weapon_upgrade', weaponId: 'crystal_shard',
    name: '수정 파편 +', description: '다음 성장 적용',
  },
  {
    id: 'up_radiant_orb', type: 'weapon_upgrade', weaponId: 'radiant_orb',
    name: '성광 탄환 +', description: '다음 성장 적용',
  },

  // ── 진화 무기 강화 ───────────────────────────────────────────────────────────
  {
    id: 'up_arcane_nova_plus', type: 'weapon_upgrade', weaponId: 'arcane_nova',
    name: '비전 폭발 +', description: '다음 성장 적용',
  },
  {
    id: 'up_storm_crown_plus', type: 'weapon_upgrade', weaponId: 'storm_crown',
    name: '폭풍의 왕관 +', description: '다음 성장 적용',
  },
  {
    id: 'up_divine_shield_plus', type: 'weapon_upgrade', weaponId: 'divine_shield',
    name: '신성한 방패 +', description: '다음 성장 적용',
  },
  {
    id: 'up_infinity_blade_plus', type: 'weapon_upgrade', weaponId: 'infinity_blade',
    name: '무한의 칼날 +', description: '다음 성장 적용',
  },
  {
    id: 'up_blizzard_nova_plus', type: 'weapon_upgrade', weaponId: 'blizzard_nova',
    name: '블리자드 노바 +', description: '다음 성장 적용',
  },
  {
    id: 'up_helios_lance_plus', type: 'weapon_upgrade', weaponId: 'helios_lance',
    name: '헬리오스 랜스 +', description: '다음 성장 적용',
  },
  {
    id: 'up_astral_pike_plus', type: 'weapon_upgrade', weaponId: 'astral_pike',
    name: '아스트랄 파이크 +', description: '다음 성장 적용',
  },
  {
    id: 'up_inferno_field_plus', type: 'weapon_upgrade', weaponId: 'inferno_field',
    name: '인페르노 필드 +', description: '다음 성장 적용',
  },
  {
    id: 'up_plague_marsh_plus', type: 'weapon_upgrade', weaponId: 'plague_marsh',
    name: '플레그 마시 +', description: '다음 성장 적용',
  },
  {
    id: 'up_prism_volley_plus', type: 'weapon_upgrade', weaponId: 'prism_volley',
    name: '프리즘 볼리 +', description: '다음 성장 적용',
  },
  {
    id: 'up_seraph_disc_plus', type: 'weapon_upgrade', weaponId: 'seraph_disc',
    name: '세라프 디스크 +', description: '다음 성장 적용',
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
