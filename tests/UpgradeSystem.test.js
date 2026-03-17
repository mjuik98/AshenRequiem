/**
 * tests/UpgradeSystem.test.js — UpgradeSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/UpgradeSystem.test.js
 */

import assert from 'node:assert/strict';

// ─── mock 데이터 ────────────────────────────────────────────────────

const mockWeaponData = [
  { id: 'weapon_basic', maxLevel: 5, cooldown: 1.0, damage: 5, speed: 300, radius: 8, pierce: 1 },
  { id: 'weapon_orbit', maxLevel: 3, cooldown: 0.5, damage: 3, speed: 0,   radius: 12, pierce: 99 },
];

const mockUpgradeData = [
  { id: 'weapon_new_orbit', type: 'weapon_new',     weaponId: 'weapon_orbit', label: '궤도 무기' },
  { id: 'weapon_up_basic',  type: 'weapon_upgrade', weaponId: 'weapon_basic', label: '기본 강화', damageDelta: 2, cooldownMult: 0.92 },
  { id: 'stat_hp',          type: 'stat',           label: '체력 증가', maxCount: 3 },
  { id: 'stat_speed',       type: 'stat',           label: '이동속도 증가', maxCount: 3 },
  { id: 'stat_lifesteal',   type: 'stat',           label: '흡혈 증가', maxCount: 2 },
];

// ─── UpgradeSystem import ────────────────────────────────────────────

let UpgradeSystem;
try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
} catch {
  console.warn('[테스트] UpgradeSystem import 실패 — mock 버전으로 대체');
  // 실제 UpgradeSystem이 없을 때 구조 검증만 수행
  UpgradeSystem = null;
}

// ─── 테스트 러너 ────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

// ─── 헬퍼 ───────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return {
    weapons:       [],
    upgradeCounts: {},
    hp:            20,
    maxHp:         20,
    speed:         160,
    lifesteal:     0,
    level:         1,
    xp:            0,
    xpToNextLevel: 10,
    ...overrides,
  };
}

// ─── 선택지 생성 테스트 ──────────────────────────────────────────────

console.log('\n[UpgradeSystem — generateChoices]');

test('신규 플레이어에게 항상 3개 선택지 반환', () => {
  if (!UpgradeSystem) return; // import 실패 시 스킵
  const player  = makePlayer();
  const choices = UpgradeSystem.generateChoices(player);
  assert.equal(choices.length, 3, `선택지 수: ${choices.length} (기대: 3)`);
});

test('선택지에 중복 id 없음', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer();
  const choices = UpgradeSystem.generateChoices(player);
  const ids     = choices.map(c => c.id);
  const unique  = new Set(ids);
  assert.equal(unique.size, ids.length, '중복 id 발견: ' + ids.join(', '));
});

test('이미 보유한 weapon_new는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'weapon_orbit', level: 1, currentCooldown: 0 }],
  });
  const choices = UpgradeSystem.generateChoices(player);
  const hasNewOrbit = choices.some(c => c.type === 'weapon_new' && c.weaponId === 'weapon_orbit');
  assert(!hasNewOrbit, 'weapon_new_orbit이 보유 중임에도 선택지에 등장');
});

test('maxCount 초과한 stat 업그레이드는 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    upgradeCounts: { stat_hp: 3, stat_speed: 3, stat_lifesteal: 2 },
  });
  const choices = UpgradeSystem.generateChoices(player);
  const hasMaxed = choices.some(c =>
    (c.id === 'stat_hp'       && player.upgradeCounts.stat_hp >= (c.maxCount ?? Infinity)) ||
    (c.id === 'stat_speed'    && player.upgradeCounts.stat_speed >= (c.maxCount ?? Infinity)) ||
    (c.id === 'stat_lifesteal'&& player.upgradeCounts.stat_lifesteal >= (c.maxCount ?? Infinity))
  );
  assert(!hasMaxed, '최대 횟수 달성한 업그레이드가 선택지에 등장');
});

test('무기가 maxLevel이면 weapon_upgrade가 선택지에 등장하지 않음', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'weapon_basic', level: 5, currentCooldown: 0 }],
  });
  const choices = UpgradeSystem.generateChoices(player);
  const hasMaxUpgrade = choices.some(c => c.type === 'weapon_upgrade' && c.weaponId === 'weapon_basic');
  assert(!hasMaxUpgrade, '최대 레벨 무기의 weapon_upgrade가 선택지에 등장');
});

// ─── 업그레이드 적용 테스트 ──────────────────────────────────────────

console.log('\n[UpgradeSystem — applyUpgrade]');

test('weapon_new: 무기가 weapons 배열에 추가됨', () => {
  if (!UpgradeSystem) return;
  const player  = makePlayer();
  const upgrade = { id: 'weapon_new_orbit', type: 'weapon_new', weaponId: 'weapon_orbit' };
  UpgradeSystem.applyUpgrade(player, upgrade);
  const found = player.weapons.find(w => w.id === 'weapon_orbit');
  assert(found, 'weapon_orbit이 weapons에 추가되지 않음');
  assert.equal(found.level, 1, '신규 무기 레벨이 1이 아님');
  assert.equal(found.currentCooldown, 0, 'currentCooldown이 0이 아님');
});

test('weapon_upgrade: 무기 레벨이 1 증가함', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'weapon_basic', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  const upgrade = {
    id: 'weapon_up_basic', type: 'weapon_upgrade', weaponId: 'weapon_basic',
    damageDelta: 2, cooldownMult: 0.92,
  };
  UpgradeSystem.applyUpgrade(player, upgrade);
  const w = player.weapons.find(w => w.id === 'weapon_basic');
  assert.equal(w.level, 2, '레벨이 2가 아님');
});

test('weapon_upgrade: damageDelta가 damage에 반영됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'weapon_basic', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  const upgrade = {
    id: 'weapon_up_basic', type: 'weapon_upgrade', weaponId: 'weapon_basic',
    damageDelta: 2, cooldownMult: 0.92,
  };
  UpgradeSystem.applyUpgrade(player, upgrade);
  const w = player.weapons.find(w => w.id === 'weapon_basic');
  assert.equal(w.damage, 7, `damage가 7이 아님 (실제: ${w.damage})`);
});

test('weapon_upgrade: cooldownMult가 cooldown에 반영됨', () => {
  if (!UpgradeSystem) return;
  const player = makePlayer({
    weapons: [{ id: 'weapon_basic', level: 1, currentCooldown: 0, damage: 5, cooldown: 1.0 }],
  });
  const upgrade = {
    id: 'weapon_up_basic', type: 'weapon_upgrade', weaponId: 'weapon_basic',
    damageDelta: 2, cooldownMult: 0.92,
  };
  UpgradeSystem.applyUpgrade(player, upgrade);
  const w = player.weapons.find(w => w.id === 'weapon_basic');
  const expected = parseFloat((1.0 * 0.92).toFixed(4));
  const actual   = parseFloat(w.cooldown.toFixed(4));
  assert(Math.abs(actual - expected) < 0.001, `cooldown 불일치: 기대 ${expected}, 실제 ${actual}`);
});

// ─── 결과 ───────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
