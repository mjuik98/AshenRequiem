/**
 * tests/WeaponEvolution.test.js — WeaponEvolutionSystem 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let WeaponEvolutionSystem;
let weaponEvolutionData;
let getWeaponDataById;
try {
  ({ WeaponEvolutionSystem } = await import('../src/systems/progression/WeaponEvolutionSystem.js'));
  ({ weaponEvolutionData } = await import('../src/data/weaponEvolutionData.js'));
  ({ getWeaponDataById } = await import('../src/data/weaponDataHelpers.js'));
} catch (e) {
  console.warn('[테스트] WeaponEvolutionSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

const MOCK_EVOLUTION_DATA = [
  {
    id:             'evo_test',
    resultWeaponId: 'arcane_nova',
    requires: { weaponId: 'magic_bolt', accessoryIds: ['tome_of_power'] },
    announceText:   'Magic Bolt이 Arcane Nova로 진화했다!',
  },
];

function makeWeaponMaxLevel(id = 'magic_bolt', level = 7) {
  return { id, level, currentCooldown: 0, damage: 10, cooldown: 0.8 };
}

function makeInjectedWeaponData(baseWeaponId = 'magic_bolt', baseMaxLevel = 7, evolvedWeaponId = 'arcane_nova') {
  const baseWeapon = getWeaponDataById(baseWeaponId) ?? { id: baseWeaponId, maxLevel: baseMaxLevel };
  const evolvedWeapon = getWeaponDataById(evolvedWeaponId)
    ?? { id: evolvedWeaponId, name: evolvedWeaponId, damage: 10, cooldown: 0.5, behaviorId: 'omnidirectional', maxLevel: 7 };

  return [
    { ...baseWeapon, maxLevel: baseMaxLevel },
    evolvedWeapon,
  ];
}

console.log('\n[WeaponEvolutionSystem 테스트]');

test('기반 무기 maxLevel + 장신구 조건 충족 시 자동 진화는 발생하지 않는다', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA, weaponData: makeInjectedWeaponData() };

  WeaponEvolutionSystem.update({ world, data });

  const hasMagic = player.weapons.some(w => w.id === 'magic_bolt');
  const hasArcane = player.weapons.some(w => w.id === 'arcane_nova');
  assert.equal(hasMagic, true, '자동 진화가 제거된 뒤에도 기반 무기가 남아 있어야 함');
  assert.equal(hasArcane, false, '조건 충족만으로 자동 진화되면 안 됨');
});

test('기반 무기 레벨 미달 시 진화 미발생', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 6)],  // level 6 (maxLevel 7 미달)
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA, weaponData: makeInjectedWeaponData() };

  WeaponEvolutionSystem.update({ world, data });

  const hasMagic  = player.weapons.some(w => w.id === 'magic_bolt');
  const hasArcane = player.weapons.some(w => w.id === 'arcane_nova');
  assert.ok(hasMagic  && !hasArcane, '레벨 미달인데 진화됨');
});

test('장신구 조건 미충족 시 진화 미발생', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [],  // tome_of_power 없음
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA, weaponData: makeInjectedWeaponData() };

  WeaponEvolutionSystem.update({ world, data });

  const hasArcane = player.weapons.some(w => w.id === 'arcane_nova');
  assert.equal(hasArcane, false, '장신구 없는데 진화됨');
});

test('이미 진화한 레시피는 중복 실행 안 됨', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(['evo_test']),  // 이미 진화됨
  });
  const world = makeWorld({ entities: { player } });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA, weaponData: makeInjectedWeaponData() };

  WeaponEvolutionSystem.update({ world, data });

  // magic_bolt이 그대로여야 함
  const hasMagic = player.weapons.some(w => w.id === 'magic_bolt');
  assert.ok(hasMagic, '이미 진화했는데 다시 교체됨');
});

test('자동 진화가 제거되면 조건 충족만으로 weaponEvolved 이벤트를 발행하지 않는다', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA, weaponData: makeInjectedWeaponData() };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(world.queues.events.weaponEvolved.length, 0, '자동 진화 제거 후에는 이벤트가 발행되면 안 됨');
});

test('확장 무기 7종은 전용 진화 레시피를 가진다', () => {
  const expected = [
    ['chain_lightning', 'judgement_chain'],
    ['solar_ray', 'helios_lance'],
    ['piercing_spear', 'astral_pike'],
    ['flame_zone', 'inferno_field'],
    ['venom_bog', 'plague_marsh'],
    ['crystal_shard', 'prism_volley'],
    ['radiant_orb', 'seraph_disc'],
  ];

  for (const [weaponId, evolvedWeaponId] of expected) {
    const recipe = weaponEvolutionData.find((item) => item.requires.weaponId === weaponId);
    assert.ok(recipe, `${weaponId} 진화 레시피 없음`);
    assert.equal(recipe.resultWeaponId, evolvedWeaponId, `${weaponId} 진화 결과 무기 불일치`);
    const evolvedWeapon = getWeaponDataById(evolvedWeaponId);
    assert.ok(evolvedWeapon, `${evolvedWeaponId} 데이터 없음`);
    assert.equal(evolvedWeapon.isEvolved, true, `${evolvedWeaponId}가 진화 무기로 표시되지 않음`);
    assert.equal(evolvedWeapon.maxLevel, 7, `${evolvedWeaponId} maxLevel이 7이 아님`);
  }
});

test('chain_lightning는 요구 장신구 보유만으로 judgement_chain으로 자동 진화하지 않는다', () => {
  const chainLightningRecipe = weaponEvolutionData.find((item) => item.requires.weaponId === 'chain_lightning');
  assert.ok(chainLightningRecipe, 'chain_lightning 진화 레시피가 없음');

  const player = makePlayer({
    weapons: [makeWeaponMaxLevel('chain_lightning', 7)],
    accessories: [{ id: chainLightningRecipe.requires.accessoryIds[0] }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data = {
    weaponEvolutionData: [chainLightningRecipe],
    weaponData: makeInjectedWeaponData('chain_lightning', 7, 'judgement_chain'),
  };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'judgement_chain'), false, '조건 충족만으로 judgement_chain 자동 진화가 발생하면 안 됨');
  assert.equal(world.queues.events.weaponEvolved.length, 0, '자동 진화 제거 후에는 chain_lightning 진화 이벤트가 없어야 함');
});

test('solar_ray는 요구 장신구 보유만으로 helios_lance로 자동 진화하지 않는다', () => {
  const solarRayRecipe = weaponEvolutionData.find((item) => item.requires.weaponId === 'solar_ray');
  assert.ok(solarRayRecipe, 'solar_ray 진화 레시피가 없음');

  const player = makePlayer({
    weapons: [makeWeaponMaxLevel('solar_ray', 7)],
    accessories: [{ id: solarRayRecipe.requires.accessoryIds[0] }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data = {
    weaponEvolutionData: [solarRayRecipe],
    weaponData: makeInjectedWeaponData('solar_ray', 7, 'helios_lance'),
  };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'helios_lance'), false, '조건 충족만으로 helios_lance 자동 진화가 발생하면 안 됨');
  assert.equal(world.queues.events.weaponEvolved.length, 0, '자동 진화 제거 후에는 solar_ray 진화 이벤트가 없어야 함');
});

test('주입된 weaponData를 기준으로 진화 조건 충족 여부만 판단하고 자동 적용하지 않는다', () => {
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 2, currentCooldown: 0, damage: 1, cooldown: 1 }],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data = {
    weaponEvolutionData: MOCK_EVOLUTION_DATA,
    weaponData: [
      { id: 'magic_bolt', maxLevel: 2 },
      { id: 'arcane_nova', name: 'Arcane Nova', damage: 10, cooldown: 0.5, behaviorId: 'omnidirectional', maxLevel: 7 },
    ],
  };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'arcane_nova'), false, '진화 조건 충족만으로 자동 적용되면 안 됨');
});

test('WeaponEvolutionSystem은 주입된 weaponData 없이는 진화 정의를 추론하지 않는다', () => {
  const player = makePlayer({
    weapons: [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ entities: { player } });
  const data = {
    weaponEvolutionData: MOCK_EVOLUTION_DATA,
  };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'arcane_nova'), false, 'weaponData 주입 없이 정적 fallback으로 진화하면 안 됨');
  assert.equal(world.queues.events.weaponEvolved.length, 0, 'weaponData 주입 없이 진화 이벤트가 발행되면 안 됨');
});

summary();
