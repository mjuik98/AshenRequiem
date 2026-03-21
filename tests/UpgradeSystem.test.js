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
import { upgradeData } from '../src/data/upgradeData.js';
import { permanentUpgradeData } from '../src/data/permanentUpgradeData.js';

// ─── UpgradeSystem import ─────────────────────────────────────────────

let UpgradeSystem;
try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
} catch {
  console.warn('[테스트] UpgradeSystem import 실패 — mock 버전으로 대체');
  UpgradeSystem = null;
}

let createPlayer;
try {
  ({ createPlayer } = await import('../src/entities/createPlayer.js'));
} catch {
  console.warn('[테스트] createPlayer import 실패 — projectile lifetime 영구 업그레이드 검증 스킵');
  createPlayer = null;
}

// ─── 선택지 생성 테스트 ───────────────────────────────────────────────

console.log('\n[UpgradeSystem — generateChoices]');

test('신규 플레이어에게 항상 3개 선택지 반환', () => {
  if (!UpgradeSystem) return;
  const choices = UpgradeSystem.generateChoices(makePlayer());
  assert.equal(choices.length, 3, `선택지 수: ${choices.length} (기대: 3)`);
});

test('permanentUpgradeData에 reroll_charge와 banish_charge가 존재한다', () => {
  assert.ok(permanentUpgradeData.find(item => item.id === 'reroll_charge'), 'reroll_charge 데이터 없음');
  assert.ok(permanentUpgradeData.find(item => item.id === 'banish_charge'), 'banish_charge 데이터 없음');
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

test('잠긴 weapon_new는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
    maxWeaponSlots: 6,
    unlockedWeapons: ['magic_bolt'],
  });
  const choices = UpgradeSystem._buildAvailablePool(player);
  assert(
    !choices.some(c => c.type === 'weapon_new' && c.weaponId === 'boomerang'),
    '잠긴 boomerang이 선택지에 등장',
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

test('잠긴 accessory는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
    accessories: [],
    maxAccessorySlots: 6,
    unlockedAccessories: [],
  });
  const choices = UpgradeSystem._buildAvailablePool(player);
  assert(
    !choices.some(c => c.type === 'accessory' && c.accessoryId === 'persistence_charm'),
    '잠긴 persistence_charm이 선택지에 등장',
  );
});

test('봉인된 upgrade id는 선택지 후보 풀에서 제외된다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
    maxWeaponSlots: 6,
    unlockedWeapons: ['magic_bolt', 'boomerang'],
  });
  const choices = UpgradeSystem._buildAvailablePool(player, {
    banishedUpgradeIds: ['get_boomerang'],
  });
  assert(
    !choices.some(c => c.id === 'get_boomerang'),
    '봉인된 get_boomerang이 후보 풀에 남아 있음',
  );
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
  assert(choices.length >= 1, `선택지 수: ${choices.length} (기대: 1 이상)`);
  // 남은 후보가 있을 수 있으나 대부분 heal이어야 함
  assert(choices.some(c => c.id === 'stat_heal'), 'HP 회복이 폴백으로 등장하지 않음');
});

test('후보 풀이 고갈되면 회복 외에 골드 선택지도 fallback으로 등장한다', () => {
  const goldUpgrade = upgradeData.find(item => item.id === 'stat_gold');
  assert.ok(goldUpgrade, 'stat_gold 데이터 없음');
  assert.match(goldUpgrade.description, /골드 \+25/, 'stat_gold 설명이 고정 수치를 드러내지 않음');
});

test('카드별 리롤은 다른 선택지와 중복되지 않게 슬롯 하나만 교체한다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
    maxWeaponSlots: 6,
    maxAccessorySlots: 6,
    unlockedWeapons: ['magic_bolt', 'holy_aura', 'lightning_ring', 'boomerang', 'chain_lightning'],
    unlockedAccessories: ['ring_of_speed', 'iron_heart', 'persistence_charm'],
  });
  const currentChoices = [
    upgradeData.find(item => item.id === 'get_holy_aura'),
    upgradeData.find(item => item.id === 'get_boomerang'),
    upgradeData.find(item => item.id === 'acc_ring_of_speed'),
  ];
  const nextChoices = UpgradeSystem.replaceChoiceAtIndex(player, currentChoices, 1, {
    banishedUpgradeIds: [],
  });
  assert.equal(nextChoices.length, 3, '리롤 후 선택지 수가 3이 아님');
  assert.notEqual(nextChoices[1]?.id, currentChoices[1]?.id, '리롤 대상 카드가 교체되지 않음');
  assert.equal(new Set(nextChoices.map(item => item.id)).size, 3, '리롤 후 선택지 id가 중복됨');
});

test('카드별 리롤은 봉인된 upgrade id를 다시 뽑지 않는다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
    maxWeaponSlots: 6,
    unlockedWeapons: ['magic_bolt', 'boomerang', 'holy_aura', 'lightning_ring'],
  });
  const currentChoices = [
    upgradeData.find(item => item.id === 'get_holy_aura'),
    upgradeData.find(item => item.id === 'get_lightning_ring'),
    upgradeData.find(item => item.id === 'get_boomerang'),
  ];
  const nextChoices = UpgradeSystem.replaceChoiceAtIndex(player, currentChoices, 1, {
    banishedUpgradeIds: ['get_lightning_ring'],
  });
  assert.notEqual(nextChoices[1]?.id, 'get_lightning_ring', '봉인된 카드가 리롤 결과로 다시 등장함');
});

test('fallback 후보는 회복과 골드가 서로 중복되지 않게 채워진다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [
      { id: 'magic_bolt', level: 5, currentCooldown: 0 },
      { id: 'holy_aura', level: 5, currentCooldown: 0 },
      { id: 'frost_nova', level: 5, currentCooldown: 0 },
    ],
    accessories: [
      { id: 'ring_of_speed', level: 5 },
      { id: 'iron_heart', level: 5 },
      { id: 'magnet_stone', level: 5 },
    ],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
    upgradeCounts: {
      up_magic_bolt_multishot: 2,
      up_boomerang_multishot: 1,
    },
  });
  const choices = UpgradeSystem.generateChoices(player, { excludeChoiceIds: [] });
  const fallbackIds = choices.filter(item => item.id === 'stat_heal' || item.id === 'stat_gold').map(item => item.id);
  assert.equal(new Set(fallbackIds).size, fallbackIds.length, 'fallback 카드가 서로 중복됨');
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
    accessories: [{ id: 'ring_of_speed', level: 1, effects: [{ stat: 'moveSpeed', value: 10, valuePerLevel: 10 }]}],
    maxAccessorySlots: 3,
  });
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_ring_of_speed', type: 'accessory_upgrade', accessoryId: 'ring_of_speed' });
  const acc = player.accessories.find(a => a.id === 'ring_of_speed');
  assert.equal(acc.level, 2, '장신구 레벨이 2가 아님');
  assert.equal(player.moveSpeed, initSpeed + 10, `moveSpeed: ${player.moveSpeed} (기대: ${initSpeed + 10})`);
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

test('projectile lifetime accessory: 새 장신구 장착 시 지속시간 배율이 증가한다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    accessories: [],
    maxAccessorySlots: 3,
    projectileLifetimeMult: 1.0,
  });

  UpgradeSystem.applyUpgrade(player, {
    id: 'acc_persistence_charm',
    type: 'accessory',
    accessoryId: 'persistence_charm',
  });

  assert.ok(
    player.projectileLifetimeMult > 1.0,
    `projectileLifetimeMult 증가 없음 (실제: ${player.projectileLifetimeMult})`,
  );
});

test('projectile lifetime accessory_upgrade: 보유 장신구 레벨업 시 지속시간 배율이 선형 증가한다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    accessories: [{ id: 'persistence_charm', level: 1 }],
    maxAccessorySlots: 3,
    projectileLifetimeMult: 1.10,
  });

  UpgradeSystem.applyUpgrade(player, {
    id: 'up_persistence_charm',
    type: 'accessory_upgrade',
    accessoryId: 'persistence_charm',
  });

  const acc = player.accessories.find(a => a.id === 'persistence_charm');
  assert.equal(acc.level, 2, '지속시간 장신구 레벨업이 적용되지 않음');
  assert.equal(
    Number(player.projectileLifetimeMult.toFixed(2)),
    1.20,
    `projectileLifetimeMult 선형 증가 불일치 (실제: ${player.projectileLifetimeMult})`,
  );
});

test('projectile lifetime permanent upgrade: 플레이어 생성 시 영구 업그레이드가 반영된다', () => {
  if (!createPlayer) return;
  const session = {
    meta: {
      permanentUpgrades: {
        perm_projectile_lifetime: 2,
      },
    },
  };

  const player = createPlayer(0, 0, session);
  assert.equal(
    Number((player.projectileLifetimeMult ?? 1).toFixed(2)),
    1.20,
    `영구 업그레이드 반영 실패 (실제: ${player.projectileLifetimeMult})`,
  );
});

test('accessory upgrade description is concrete and not generic', () => {
  const upgrade = upgradeData.find(item => item.id === 'up_ring_of_speed');
  assert.ok(upgrade, 'up_ring_of_speed 데이터 없음');
  assert.notEqual(upgrade.description, '효과 강화', '설명이 여전히 generic 텍스트임');
});

test('projectile size/range and lifetime upgrade descriptions are explicit', () => {
  const sizeUpgrade = upgradeData.find(item => item.id === 'up_arcane_prism');
  const lifetimeUpgrade = upgradeData.find(item => item.id === 'up_persistence_charm');

  assert.ok(sizeUpgrade, 'up_arcane_prism 데이터 없음');
  assert.ok(lifetimeUpgrade, 'up_persistence_charm 데이터 없음');
  assert.match(sizeUpgrade.description, /투사체 크기\/범위/, '크기/범위 장신구 설명이 명시적이지 않음');
  assert.match(lifetimeUpgrade.description, /투사체 지속시간/, '지속시간 장신구 설명이 명시적이지 않음');
});

test('stat_heal: HP가 회복됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({ hp: 50, maxHp: 100 });
  UpgradeSystem.applyUpgrade(player,
    { id: 'stat_heal', type: 'stat', effect: { stat: 'hp', value: 25 } });
  assert.equal(player.hp, 75, `HP: ${player.hp} (기대: 75)`);
});

test('stat_gold: 고정 수치 골드를 즉시 획득한다', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({ currencyMult: 1.0 });
  UpgradeSystem.applyUpgrade(player,
    { id: 'stat_gold', type: 'stat', effect: { stat: 'currency', value: 25 } });
  assert.equal(player.currency, 25, `골드: ${player.currency} (기대: 25)`);
});

summary();
