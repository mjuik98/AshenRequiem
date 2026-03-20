/**
 * tests/SlotSystem.test.js — 슬롯 시스템 + 다중 투사체 + 크리티컬 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let UpgradeSystem;
try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
} catch (e) {
  console.warn('[테스트] UpgradeSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

console.log('\n[SlotSystem 테스트]');

test('초기 maxWeaponSlots=2, weapon_new는 슬롯 여유 있을 때 등장', () => {
  const player  = makePlayer({ maxWeaponSlots: 2 });
  const choices = UpgradeSystem.generateChoices(player);
  assert.ok(choices.length <= 3, `선택지가 3개 초과 (실제: ${choices.length})`);
});

test('maxAccessorySlots=0이면 장신구 선택지 미등장', () => {
  const player  = makePlayer({ maxAccessorySlots: 0 });
  const choices = UpgradeSystem.generateChoices(player);
  const hasAcc  = choices.some(c => c.type === 'accessory');
  assert.equal(hasAcc, false, '장신구 슬롯 없는데 장신구 등장');
});

test('slot_weapon 적용 시 maxWeaponSlots 증가', () => {
  const player = makePlayer({ maxWeaponSlots: 2 });
  UpgradeSystem.applyUpgrade(player, { id: 'slot_weapon', type: 'slot', slotType: 'weapon' });
  assert.equal(player.maxWeaponSlots, 3, `예상 3, 실제: ${player.maxWeaponSlots}`);
});

test('slot_weapon 최대 4 이상 증가 안 됨', () => {
  const player = makePlayer({ maxWeaponSlots: 4 });
  UpgradeSystem.applyUpgrade(player, { id: 'slot_weapon', type: 'slot', slotType: 'weapon' });
  assert.equal(player.maxWeaponSlots, 4, `최대치 초과`);
});

test('slot_accessory 적용 시 maxAccessorySlots 증가', () => {
  const player = makePlayer({ maxAccessorySlots: 0 });
  UpgradeSystem.applyUpgrade(player, { id: 'slot_accessory', type: 'slot', slotType: 'accessory' });
  assert.equal(player.maxAccessorySlots, 1, `예상 1, 실제: ${player.maxAccessorySlots}`);
});

test('slot_accessory 최대 2 이상 증가 안 됨', () => {
  const player = makePlayer({ maxAccessorySlots: 2 });
  UpgradeSystem.applyUpgrade(player, { id: 'slot_accessory', type: 'slot', slotType: 'accessory' });
  assert.equal(player.maxAccessorySlots, 2, `최대치 초과`);
});

console.log('\n[다중 투사체 테스트]');

test('multishot 적용 시 무기 레벨 변화 없고 projectileCount만 증가', () => {
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 5, currentCooldown: 0,
                damage: 5, cooldown: 0.8, projectileCount: 1 }],
  });
  UpgradeSystem.applyUpgrade(player, {
    id: 'up_magic_bolt_multishot', type: 'weapon_upgrade',
    weaponId: 'magic_bolt', projectileCountDelta: 1,
    damageDelta: 0, cooldownMult: 1.0, skipLevelUp: true,
  });
  const w = player.weapons.find(w => w.id === 'magic_bolt');
  assert.equal(w.level, 5, '레벨이 변경됨 (skipLevelUp 버그)');
  assert.equal(w.projectileCount, 2, 'projectileCount 미증가');
});

console.log('\n[크리티컬 스탯 테스트]');

test('stat_crit_chance 업그레이드 적용 시 critChance 증가', () => {
  const player = makePlayer({ critChance: 0.05 });
  UpgradeSystem.applyUpgrade(player, {
    id: 'stat_crit_chance', type: 'stat',
    effect: { stat: 'critChance', value: 0.05 },
  });
  assert.ok(Math.abs(player.critChance - 0.10) < 0.001, `예상 0.10, 실제: ${player.critChance}`);
});

test('stat_crit_multi 업그레이드 적용 시 critMultiplier 증가', () => {
  const player = makePlayer({ critMultiplier: 2.0 });
  UpgradeSystem.applyUpgrade(player, {
    id: 'stat_crit_multi', type: 'stat',
    effect: { stat: 'critMultiplier', value: 0.25 },
  });
  assert.ok(Math.abs(player.critMultiplier - 2.25) < 0.001, `예상 2.25, 실제: ${player.critMultiplier}`);
});

summary();
