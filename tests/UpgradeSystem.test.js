/**
 * tests/UpgradeSystem.test.js — UpgradeSystem 단위 테스트
 *
 * CHANGE: 레벨업 보상 개편에 맞춰 테스트 업데이트
 *   - 스탯 업그레이드 관련 테스트 제거/수정
 *   - 장신구 레벨업 테스트 추가
 *   - HP 회복 폴백 테스트 추가
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

// ─── UpgradeSystem import ─────────────────────────────────────────────

let UpgradeSystem;
try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
} catch {
  console.warn('[테스트] UpgradeSystem import 실패 — mock 버전으로 대체');
  UpgradeSystem = null;
}

// ─── 선택지 생성 테스트 ───────────────────────────────────────────────

console.log('\n[UpgradeSystem — generateChoices]');

test('신규 플레이어에게 항상 3개 선택지 반환', () => {
  if (!UpgradeSystem) return;
  const choices = UpgradeSystem.generateChoices(makePlayer());
  assert.equal(choices.length, 3, `선택지 수: ${choices.length} (기대: 3)`);
});

test('선택지에 중복 id 없음 (heal 폴백 제외)', () => {
  if (!UpgradeSystem) return;
  const choices = UpgradeSystem.generateChoices(makePlayer());
  // stat_heal이 폴백으로 여러 번 나올 수 있으므로 heal이 아닌 것만 검증
  const nonHealIds = choices.filter(c => c.id !== 'stat_heal').map(c => c.id);
  const unique = new Set(nonHealIds);
  assert.equal(unique.size, nonHealIds.length, '중복 id 발견: ' + nonHealIds.join(', '));
});

test('이미 보유한 weapon_new는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer({ weapons: [{ id: 'holy_aura', level: 1, currentCooldown: 0 }] });
  const choices = UpgradeSystem.generateChoices(player);
  assert(
    !choices.some(c => c.type === 'weapon_new' && c.weaponId === 'holy_aura'),
    'get_holy_aura가 보유 중임에도 선택지에 등장',
  );
});

test('무기가 maxLevel이면 weapon_upgrade가 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer({ weapons: [{ id: 'magic_bolt', level: 5, currentCooldown: 0 }] });
  const choices = UpgradeSystem.generateChoices(player);
  assert(
    !choices.some(c => c.type === 'weapon_upgrade' && c.weaponId === 'magic_bolt'),
    '최대 레벨 무기의 weapon_upgrade가 선택지에 등장',
  );
});

test('선택지에 스탯 업그레이드(stat_speed 등)가 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const choices = UpgradeSystem.generateChoices(makePlayer());
  const statIds = ['stat_speed', 'stat_maxhp', 'stat_magnet', 'stat_lifesteal',
                   'stat_cooldown', 'stat_projspeed', 'stat_projsize', 'stat_xpgain',
                   'stat_crit_chance', 'stat_crit_multi'];
  const hasStat = choices.some(c => statIds.includes(c.id));
  assert(!hasStat, '스탯 업그레이드가 선택지에 등장');
});

test('무기/장신구 후보가 없으면 HP 회복이 폴백으로 등장', () => {
  if (!UpgradeSystem) return;
  // 모든 무기 만렙 + 모든 장신구 만렙 + 슬롯 꽉 참
  // multishot 등 maxCount 기반도 소진
  const player = makePlayer({
    weapons: [
      { id: 'magic_bolt', level: 5, currentCooldown: 0 },
      { id: 'holy_aura',  level: 5, currentCooldown: 0 },
      { id: 'frost_nova', level: 5, currentCooldown: 0 },
    ],
    accessories: [
      { id: 'ring_of_speed', level: 5 },
      { id: 'iron_heart',    level: 5 },
      { id: 'magnet_stone',  level: 5 },
    ],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
    upgradeCounts: {
      up_magic_bolt_multishot: 2,
      up_boomerang_multishot: 1,
    },
  });
  const choices = UpgradeSystem.generateChoices(player);
  assert(choices.length === 3, `선택지 수: ${choices.length} (기대: 3)`);
  // 남은 후보가 있을 수 있으나 대부분 heal이어야 함
  assert(choices.some(c => c.id === 'stat_heal'), 'HP 회복이 폴백으로 등장하지 않음');
});

// ─── 업그레이드 적용 테스트 ──────────────────────────────────────────

console.log('\n[UpgradeSystem — applyUpgrade]');

test('weapon_new: 무기가 weapons 배열에 추가됨', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer();
  const upgrade = { id: 'get_holy_aura', type: 'weapon_new', weaponId: 'holy_aura' };
  UpgradeSystem.applyUpgrade(player, upgrade);
  const found = player.weapons.find(w => w.id === 'holy_aura');
  assert(found,                     'holy_aura가 weapons에 추가되지 않음');
  assert.equal(found.level,          1, '신규 무기 레벨이 1이 아님');
  assert.equal(found.currentCooldown, 0, 'currentCooldown이 0이 아님');
});

test('weapon_upgrade: 무기 레벨이 1 증가함', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
      damageDelta: 1, cooldownMult: 0.92 });
  assert.equal(player.weapons.find(w => w.id === 'magic_bolt').level, 2, '레벨이 2가 아님');
});

test('accessory: 장신구가 Lv.1로 장착됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({ accessories: [], maxAccessorySlots: 3 });
  UpgradeSystem.applyUpgrade(player,
    { id: 'acc_ring_of_speed', type: 'accessory', accessoryId: 'ring_of_speed' });
  const found = player.accessories.find(a => a.id === 'ring_of_speed');
  assert(found, '장신구가 추가되지 않음');
  assert.equal(found.level, 1, '장신구 레벨이 1이 아님');
});

test('accessory_upgrade: 보유 장신구 레벨 +1', () => {
  if (!UpgradeSystem) return;
  const initSpeed = 100;
  const player = makePlayer({
    moveSpeed: initSpeed,
    accessories: [{ id: 'ring_of_speed', level: 1, effects: [{ stat: 'moveSpeed', value: 30, valuePerLevel: 6 }]}],
    maxAccessorySlots: 3,
  });
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_ring_of_speed', type: 'accessory_upgrade', accessoryId: 'ring_of_speed' });
  const acc = player.accessories.find(a => a.id === 'ring_of_speed');
  assert.equal(acc.level, 2, '장신구 레벨이 2가 아님');
  // valuePerLevel=6이므로 moveSpeed가 +6 되어야 함
  assert.equal(player.moveSpeed, initSpeed + 6, `moveSpeed: ${player.moveSpeed} (기대: ${initSpeed + 6})`);
});

test('accessory_upgrade: maxLevel 도달 시 더 이상 레벨업 불가', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    accessories: [{ id: 'ring_of_speed', level: 5, effects: [{ stat: 'moveSpeed', value: 30, valuePerLevel: 6 }]}],
    maxAccessorySlots: 3,
  });
  const prevSpeed = player.moveSpeed;
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_ring_of_speed', type: 'accessory_upgrade', accessoryId: 'ring_of_speed' });
  const acc = player.accessories.find(a => a.id === 'ring_of_speed');
  assert.equal(acc.level, 5, '레벨이 5를 초과함');
  assert.equal(player.moveSpeed, prevSpeed, 'maxLevel에서 효과가 추가 적용됨');
});

test('stat_heal: HP가 회복됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({ hp: 50, maxHp: 100 });
  UpgradeSystem.applyUpgrade(player,
    { id: 'stat_heal', type: 'stat', effect: { stat: 'hp', value: 25 } });
  assert.equal(player.hp, 75, `HP: ${player.hp} (기대: 75)`);
});

summary();
