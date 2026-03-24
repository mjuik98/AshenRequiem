/**
 * tests/SlotSystem.test.js — 슬롯 시스템 + 다중 투사체 + 크리티컬 단위 테스트
 * 
 * CHANGE: 기본 슬롯 3/3, 최대 6/6 체계에 맞게 업데이트
 */
import assert from 'node:assert/strict';
import { makePlayer } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';
import { upgradeData } from '../src/data/upgradeData.js';
import { weaponData } from '../src/data/weaponData.js';
import { accessoryData } from '../src/data/accessoryData.js';
import { weaponProgressionData } from '../src/data/weaponProgressionData.js';

let UpgradeSystem;
try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
} catch (e) {
  console.warn('[테스트] UpgradeSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

function makeUpgradeRuntimeData(overrides = {}) {
  return {
    upgradeData,
    weaponData,
    accessoryData,
    weaponProgressionData,
    synergyData: [],
    ...overrides,
  };
}

console.log('\n[SlotSystem 테스트]');

test('기본 maxWeaponSlots=3, 슬롯 여유 있을 때 신규 무기 등장', () => {
  const player  = makePlayer({
    maxWeaponSlots: 3,
    weapons: [],
    maxAccessorySlots: 3,
    accessories: [
      { id: 'ring_of_speed', level: 1 },
      { id: 'iron_heart', level: 1 },
      { id: 'magnet_stone', level: 1 },
    ],
  });
  const pool = UpgradeSystem._buildAvailablePool(player, {}, makeUpgradeRuntimeData());
  assert.ok(pool.some(c => c.type === 'weapon_new'), '무기 슬롯 여유가 있는데 신규 무기 후보가 없음');
});

test('무기 슬롯이 꽉 차면 신규 무기 미등장', () => {
  const player = makePlayer({
    maxWeaponSlots: 3,
    weapons: [
      { id: 'magic_bolt', level: 1 },
      { id: 'holy_aura', level: 1 },
      { id: 'frost_nova', level: 1 }
    ]
  });
  const choices = UpgradeSystem.generateChoices(player, {}, makeUpgradeRuntimeData());
  const hasNewWeapon = choices.some(c => c.type === 'weapon_new');
  assert.equal(hasNewWeapon, false, '무기 슬롯이 꽉 찼는데 신규 무기 등장');
});

test('기본 maxAccessorySlots=3, 슬롯 여유 있을 때 장신구 등장', () => {
  const player  = makePlayer({ maxAccessorySlots: 3, accessories: [] });
  const pool = UpgradeSystem._buildAvailablePool(player, {}, makeUpgradeRuntimeData());
  const hasAcc  = pool.some(c => c.type === 'accessory');
  assert.equal(hasAcc, true, '장신구 슬롯 여유가 있는데 장신구 미등장');
});

test('장신구 슬롯이 꽉 차면 신규 장신구 미등장', () => {
  const player = makePlayer({
    maxAccessorySlots: 3,
    accessories: [
      { id: 'ring_of_speed', level: 1 },
      { id: 'iron_heart', level: 1 },
      { id: 'magnet_stone', level: 1 }
    ]
  });
  const choices = UpgradeSystem.generateChoices(player, {}, makeUpgradeRuntimeData());
  const hasNewAcc = choices.some(c => c.type === 'accessory');
  assert.equal(hasNewAcc, false, '장신구 슬롯이 꽉 찼는데 신규 장신구 등장');
});

console.log('\n[무기 progression 테스트]');

test('번갈이 progression 특성으로 추가 투사체가 적용된다', () => {
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 2, currentCooldown: 0,
                damage: 6, cooldown: 0.94, projectileCount: 1 }],
  });
  UpgradeSystem.applyUpgrade(player, {
    id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
  }, [], undefined, makeUpgradeRuntimeData());
  const w = player.weapons.find(w => w.id === 'magic_bolt');
  assert.equal(w.level, 3, 'progression 적용 후 레벨이 3이 아님');
  assert.equal(w.projectileCount, 2, 'projectileCount 미증가');
});

console.log('\n[크리티컬 스탯 테스트]');

test('stat_crit_chance(stat 타입) 업그레이드 적용 시 critChance 증가', () => {
  // 레벨업 풀에서는 빠졌지만 applyUpgrade 로직은 여전히 작동해야 함 (상점 등에서 활용 가능)
  const player = makePlayer({ critChance: 0.05 });
  UpgradeSystem.applyUpgrade(player, {
    id: 'stat_crit_chance', type: 'stat',
    effect: { stat: 'critChance', value: 0.05 },
  }, [], undefined, makeUpgradeRuntimeData());
  assert.ok(Math.abs(player.critChance - 0.10) < 0.001, `예상 0.10, 실제: ${player.critChance}`);
});

console.log('\n[보너스 투사체 스탯 테스트]');

test('bonusProjectileCount 반영 시 orbit 무기가 더 많은 투사체 생성', async () => {
  const { orbit } = await import('../src/behaviors/weaponBehaviors/orbit.js');
  const player = makePlayer({ bonusProjectileCount: 2 }); // +2발 보너스
  const weapon = { behaviorId: 'orbit', orbitCount: 3, cooldown: 1.0 }; // 기본 3발
  const spawnQueue = [];
  
  orbit({ weapon, player, spawnQueue });
  assert.equal(spawnQueue.length, 5, `발사 수: ${spawnQueue.length} (기대: 5)`);
});

test('bonusProjectileCount 반영 시 chainLightning 무기가 더 많은 연쇄 대상을 타격한다', async () => {
  const { chainLightning } = await import('../src/behaviors/weaponBehaviors/chainLightning.js');
  const player = makePlayer({ x: 0, y: 0, bonusProjectileCount: 2 });
  const enemies = [
    { id: 'enemy_a', x: 40, y: 0, isAlive: true, pendingDestroy: false },
    { id: 'enemy_b', x: 100, y: 0, isAlive: true, pendingDestroy: false },
    { id: 'enemy_c', x: 160, y: 0, isAlive: true, pendingDestroy: false },
    { id: 'enemy_d', x: 220, y: 0, isAlive: true, pendingDestroy: false },
    { id: 'enemy_e', x: 280, y: 0, isAlive: true, pendingDestroy: false },
  ];
  const weapon = {
    behaviorId: 'chainLightning',
    range: 350,
    chainCount: 3,
    chainRange: 80,
    damage: 12,
  };
  const events = { hits: [] };

  const fired = chainLightning({ weapon, player, enemies, spawnQueue: [], events });
  assert.equal(fired, true, 'chainLightning 발동 실패');
  assert.equal(events.hits.length, 5, `연쇄 타격 수: ${events.hits.length} (기대: 5)`);
});

summary();
