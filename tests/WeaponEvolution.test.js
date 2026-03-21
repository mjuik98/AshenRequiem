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
  ({ getWeaponDataById } = await import('../src/data/weaponData.js'));
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

console.log('\n[WeaponEvolutionSystem 테스트]');

test('기반 무기 maxLevel + 장신구 조건 충족 시 진화 실행', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

  WeaponEvolutionSystem.update({ world, data });

  const hasArcane = player.weapons.some(w => w.id === 'arcane_nova');
  assert.ok(hasArcane, '진화 무기 arcane_nova가 무기 목록에 없음');
});

test('기반 무기 레벨 미달 시 진화 미발생', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 6)],  // level 6 (maxLevel 7 미달)
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

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
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

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
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

  WeaponEvolutionSystem.update({ world, data });

  // magic_bolt이 그대로여야 함
  const hasMagic = player.weapons.some(w => w.id === 'magic_bolt');
  assert.ok(hasMagic, '이미 진화했는데 다시 교체됨');
});

test('진화 성공 시 weaponEvolved 이벤트 발행', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 7)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

  WeaponEvolutionSystem.update({ world, data });

  assert.ok(world.events.weaponEvolved.length > 0, 'weaponEvolved 이벤트 미발행');
  assert.equal(world.events.weaponEvolved[0].weaponId, 'magic_bolt');
});

test('신규 무기 6종은 전용 진화 레시피를 가진다', () => {
  const expected = [
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

test('solar_ray는 요구 장신구 보유 시 helios_lance로 진화한다', () => {
  const solarRayRecipe = weaponEvolutionData.find((item) => item.requires.weaponId === 'solar_ray');
  assert.ok(solarRayRecipe, 'solar_ray 진화 레시피가 없음');

  const player = makePlayer({
    weapons: [makeWeaponMaxLevel('solar_ray', 7)],
    accessories: [{ id: solarRayRecipe.requires.accessoryIds[0] }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data = { weaponEvolutionData: [solarRayRecipe] };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'helios_lance'), true, 'helios_lance 진화 실패');
  assert.equal(world.events.weaponEvolved[0]?.evolvedWeaponId, 'helios_lance', 'weaponEvolved 이벤트 결과가 helios_lance가 아님');
});

test('주입된 weaponData를 기준으로 진화 maxLevel을 판단한다', () => {
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 2, currentCooldown: 0, damage: 1, cooldown: 1 }],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data = {
    weaponEvolutionData: MOCK_EVOLUTION_DATA,
    weaponData: [
      { id: 'magic_bolt', maxLevel: 2 },
      { id: 'arcane_nova', name: 'Arcane Nova', damage: 10, cooldown: 0.5, behaviorId: 'omnidirectional', maxLevel: 7 },
    ],
  };

  WeaponEvolutionSystem.update({ world, data });

  assert.equal(player.weapons.some((weapon) => weapon.id === 'arcane_nova'), true, '주입된 weaponData 기준 maxLevel에서 진화하지 않음');
});

summary();
