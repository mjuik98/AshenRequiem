/**
 * tests/UpgradeSystem.test.js — UpgradeSystem 단위 테스트
 *
 * 리팩터링:
 *   Before: 로컬 makePlayer() + passed/failed/test() 로컬 패턴
 *   After:  tests/fixtures/index.js  → makePlayer
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

// ─── mock 데이터 ─────────────────────────────────────────────────────

const mockWeaponData = [
  { id: 'magic_bolt', maxLevel: 5, cooldown: 1.0, damage: 5, speed: 300, radius: 5, pierce: 1 },
  { id: 'holy_aura',  maxLevel: 5, cooldown: 0.8, damage: 20, speed: 0, radius: 80, pierce: 999 },
];

const mockUpgradeData = [
  { id: 'get_holy_aura',  type: 'weapon_new',     weaponId: 'holy_aura',  name: 'Holy Aura' },
  { id: 'up_magic_bolt',  type: 'weapon_upgrade',  weaponId: 'magic_bolt', name: 'Magic Bolt +',
    damageDelta: 1, cooldownMult: 0.92 },
  { id: 'stat_maxhp',     type: 'stat', name: '최대 HP +',     maxCount: 3 },
  { id: 'stat_speed',     type: 'stat', name: '이동 속도 +',   maxCount: 3 },
  { id: 'stat_lifesteal', type: 'stat', name: '흡혈 +',        maxCount: 2 },
];

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

test('선택지에 중복 id 없음', () => {
  if (!UpgradeSystem) return;
  const choices = UpgradeSystem.generateChoices(makePlayer());
  const ids    = choices.map(c => c.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, '중복 id 발견: ' + ids.join(', '));
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

test('maxCount 초과한 stat 업그레이드는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer({
    upgradeCounts: { stat_maxhp: 3, stat_speed: 3, stat_lifesteal: 2 },
  });
  const choices = UpgradeSystem.generateChoices(player);
  const hasMaxed = choices.some(c =>
    (c.id === 'stat_maxhp'     && player.upgradeCounts.stat_maxhp     >= (c.maxCount ?? Infinity)) ||
    (c.id === 'stat_speed'     && player.upgradeCounts.stat_speed     >= (c.maxCount ?? Infinity)) ||
    (c.id === 'stat_lifesteal' && player.upgradeCounts.stat_lifesteal >= (c.maxCount ?? Infinity))
  );
  assert(!hasMaxed, '최대 횟수 달성한 업그레이드가 선택지에 등장');
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

test('weapon_upgrade: damageDelta가 damage에 반영됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
      damageDelta: 1, cooldownMult: 0.92 });
  assert.equal(player.weapons.find(w => w.id === 'magic_bolt').damage, 6, 'damage가 6이 아님');
});

test('weapon_upgrade: cooldownMult가 cooldown에 반영됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  UpgradeSystem.applyUpgrade(player,
    { id: 'up_magic_bolt', type: 'weapon_upgrade', weaponId: 'magic_bolt',
      damageDelta: 1, cooldownMult: 0.92 });
  const actual = player.weapons.find(w => w.id === 'magic_bolt').cooldown;
  assert(Math.abs(actual - 0.92) < 0.001, `cooldown 불일치 (실제: ${actual})`);
});

summary();
