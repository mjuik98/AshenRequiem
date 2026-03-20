/**
 * src/data/weaponEvolutionData.js — 무기 진화 레시피
 *
 * requires.weaponId     : 기반 무기 ID (반드시 maxLevel에 도달해야 함)
 * requires.accessoryIds : 필요한 장신구 ID 배열 (AND 조건)
 * resultWeaponId        : 진화 결과 무기 ID (weaponData.js에 정의)
 * announceText          : 진화 연출 텍스트
 */

/** @type {Array<{
 *   id: string,
 *   resultWeaponId: string,
 *   requires: { weaponId: string, accessoryIds: string[] },
 *   announceText: string,
 * }>} */
export const weaponEvolutionData = [
  {
    id:             'evolution_arcane_nova',
    resultWeaponId: 'arcane_nova',
    requires: {
      weaponId:     'magic_bolt',
      accessoryIds: ['tome_of_power'],
    },
    announceText: '마법탄이 비전 폭발로 진화했다!',
  },
  {
    id:             'evolution_storm_crown',
    resultWeaponId: 'storm_crown',
    requires: {
      weaponId:     'lightning_ring',
      accessoryIds: ['scattered_shot'],
    },
    announceText: '번개의 고리가 폭풍의 왕관으로 진화했다!',
  },
  {
    id:             'evolution_divine_shield',
    resultWeaponId: 'divine_shield',
    requires: {
      weaponId:     'holy_aura',
      accessoryIds: ['iron_heart'],
    },
    announceText: '성스러운 오라가 신성한 방패로 진화했다!',
  },
  {
    id:             'evolution_infinity_blade',
    resultWeaponId: 'infinity_blade',
    requires: {
      weaponId:     'boomerang',
      accessoryIds: ['vampiric_amulet'],
    },
    announceText: '부메랑이 무한의 칼날로 진화했다!',
  },
  {
    id:             'evolution_blizzard_nova',
    resultWeaponId: 'blizzard_nova',
    requires: {
      weaponId:     'frost_nova',
      accessoryIds: ['crystal_lens'],
    },
    announceText: '냉기 폭발이 블리자드 노바로 진화했다!',
  },
];

/** id로 레시피 조회 */
export function getEvolutionById(id) {
  return weaponEvolutionData.find(e => e.id === id) ?? null;
}

/**
 * 기반 무기 ID로 해당 진화 레시피를 조회한다.
 * @param {string} weaponId
 * @returns {object|null}
 */
export function getEvolutionByWeaponId(weaponId) {
  return weaponEvolutionData.find(e => e.requires.weaponId === weaponId) ?? null;
}
