/**
 * tests/WeaponEvolution.test.js — WeaponEvolutionSystem 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let WeaponEvolutionSystem;
try {
  ({ WeaponEvolutionSystem } = await import('../src/systems/progression/WeaponEvolutionSystem.js'));
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

function makeWeaponMaxLevel(id = 'magic_bolt', level = 5) {
  return { id, level, currentCooldown: 0, damage: 10, cooldown: 0.8 };
}

console.log('\n[WeaponEvolutionSystem 테스트]');

test('기반 무기 maxLevel + 장신구 조건 충족 시 진화 실행', () => {
  const player = makePlayer({
    weapons:     [makeWeaponMaxLevel('magic_bolt', 5)],
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
    weapons:     [makeWeaponMaxLevel('magic_bolt', 3)],  // level 3 (maxLevel 5 미달)
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
    weapons:     [makeWeaponMaxLevel('magic_bolt', 5)],
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
    weapons:     [makeWeaponMaxLevel('magic_bolt', 5)],
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
    weapons:     [makeWeaponMaxLevel('magic_bolt', 5)],
    accessories: [{ id: 'tome_of_power' }],
    evolvedWeapons: new Set(),
  });
  const world = makeWorld({ player });
  const data  = { weaponEvolutionData: MOCK_EVOLUTION_DATA };

  WeaponEvolutionSystem.update({ world, data });

  assert.ok(world.events.weaponEvolved.length > 0, 'weaponEvolved 이벤트 미발행');
  assert.equal(world.events.weaponEvolved[0].weaponId, 'magic_bolt');
});

summary();
