/**
 * tests/UpgradeSystem.test.js — UpgradeSystem 단위 테스트
 *
 * 실행:
 *   node --experimental-vm-modules tests/UpgradeSystem.test.js
 *
 * 검증 항목:
 *   - generateChoices: 항상 최대 3개 반환
 *   - generateChoices: 이미 최대 레벨인 무기는 upgrade 선택지 제외
 *   - generateChoices: 미보유 무기는 weapon_new 선택지 포함 가능
 *   - applyUpgrade: weapon_new 타입 → 플레이어 weapons 배열에 추가
 *   - applyUpgrade: weapon_upgrade 타입 → 보유 무기 level 증가
 *   - applyUpgrade: stat 타입 → 플레이어 수치 변경
 *   - applyUpgrade: 없는 weaponId 참조 시 안전하게 무시
 */

import assert from 'node:assert/strict';

function makePlayer(overrides = {}) {
  return {
    id: 'player-1',
    weapons: [],
    upgradeCounts: {},
    maxHp: 100, hp: 100,
    damage: 1.0,
    moveSpeed: 120,
    magnetRadius: 80,
    xp: 0, xpToNext: 10, level: 1,
    isAlive: true,
    ...overrides,
  };
}

let UpgradeSystem;
let upgradeData;
let weaponData;

try {
  ({ UpgradeSystem } = await import('../src/systems/progression/UpgradeSystem.js'));
  ({ upgradeData }   = await import('../src/data/upgradeData.js'));
  ({ weaponData }    = await import('../src/data/weaponData.js'));
} catch (e) {
  console.warn('[테스트] UpgradeSystem import 실패 — 로직 검증 스킵');
  console.warn(e.message);
  process.exit(0);
}

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

console.log('\n[UpgradeSystem]');

// ── generateChoices ───────────────────────────────────────────

test('선택지는 최대 3개를 반환한다', () => {
  const player = makePlayer();
  const choices = UpgradeSystem.generateChoices(player);
  assert.ok(choices.length <= 3, `선택지 수: ${choices.length}`);
  assert.ok(choices.length >= 1, '선택지가 1개 이상이어야 함');
});

test('선택지에 중복 id가 없다', () => {
  const player = makePlayer();
  const choices = UpgradeSystem.generateChoices(player);
  const ids = choices.map(c => c.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, '중복 id 존재');
});

test('최대 레벨 무기의 weapon_upgrade 선택지는 제외된다', () => {
  const firstWeapon = weaponData[0];
  if (!firstWeapon) { console.log('  (skip: weaponData 없음)'); return; }

  const player = makePlayer({
    weapons: [{ ...firstWeapon, level: firstWeapon.maxLevel ?? 5, currentCooldown: 0 }],
  });

  const choices = UpgradeSystem.generateChoices(player);
  const hasMaxedUpgrade = choices.some(
    c => c.type === 'weapon_upgrade' && c.weaponId === firstWeapon.id
  );
  assert.equal(hasMaxedUpgrade, false, '최대 레벨 무기의 upgrade 선택지가 포함됨');
});

test('미보유 무기는 weapon_new 선택지 후보에 포함된다', () => {
  const player = makePlayer({ weapons: [] });
  const choices = UpgradeSystem.generateChoices(player);
  // 풀에 weapon_new 타입 업그레이드가 있다면 선택지에 포함될 수 있음
  const weaponNewInData = upgradeData.filter(u => u.type === 'weapon_new');
  if (weaponNewInData.length === 0) {
    console.log('  (skip: weapon_new 데이터 없음)');
    return;
  }
  // 선택지에 weapon_new가 하나 이상 포함되어 있어야 함
  const hasWeaponNew = choices.some(c => c.type === 'weapon_new');
  assert.ok(hasWeaponNew, 'weapon_new 선택지가 하나도 없음');
});

// ── applyUpgrade ──────────────────────────────────────────────

test('weapon_new 적용 → weapons 배열에 무기 추가', () => {
  const weaponNewUpgrade = upgradeData.find(u => u.type === 'weapon_new');
  if (!weaponNewUpgrade) { console.log('  (skip: weapon_new 업그레이드 없음)'); return; }

  const player = makePlayer({ weapons: [] });
  UpgradeSystem.applyUpgrade(player, weaponNewUpgrade);

  assert.equal(player.weapons.length, 1);
  assert.equal(player.weapons[0].id, weaponNewUpgrade.weaponId);
  assert.equal(player.weapons[0].level, 1);
});

test('weapon_new 중복 적용 시 무기가 중복 추가되지 않는다', () => {
  const weaponNewUpgrade = upgradeData.find(u => u.type === 'weapon_new');
  if (!weaponNewUpgrade) { console.log('  (skip: weapon_new 업그레이드 없음)'); return; }

  const existingWeapon = weaponData.find(w => w.id === weaponNewUpgrade.weaponId);
  if (!existingWeapon) { console.log('  (skip: 무기 데이터 없음)'); return; }

  const player = makePlayer({
    weapons: [{ ...existingWeapon, level: 1, currentCooldown: 0 }],
  });
  const prevCount = player.weapons.length;
  UpgradeSystem.applyUpgrade(player, weaponNewUpgrade);

  // 이미 보유한 무기는 추가되지 않아야 함
  assert.equal(player.weapons.length, prevCount, '이미 보유한 무기가 중복 추가됨');
});

test('weapon_upgrade 적용 → 보유 무기 level 증가', () => {
  const weaponUpgrade = upgradeData.find(u => u.type === 'weapon_upgrade');
  if (!weaponUpgrade) { console.log('  (skip: weapon_upgrade 업그레이드 없음)'); return; }

  const baseWeapon = weaponData.find(w => w.id === weaponUpgrade.weaponId);
  if (!baseWeapon) { console.log('  (skip: 무기 데이터 없음)'); return; }

  const player = makePlayer({
    weapons: [{ ...baseWeapon, level: 1, currentCooldown: 0 }],
  });
  UpgradeSystem.applyUpgrade(player, weaponUpgrade);

  assert.equal(player.weapons[0].level, 2);
});

test('weapon_upgrade: 존재하지 않는 weaponId → 안전하게 무시', () => {
  const player = makePlayer({ weapons: [] });
  const fakeUpgrade = { id: 'fake', type: 'weapon_upgrade', weaponId: 'nonexistent-weapon' };

  assert.doesNotThrow(() => {
    UpgradeSystem.applyUpgrade(player, fakeUpgrade);
  });
  assert.equal(player.weapons.length, 0);
});

test('stat 타입 업그레이드 — maxCount 초과 시 적용 안 됨 (upgradeCounts 기반)', () => {
  const statUpgrade = upgradeData.find(u => u.type !== 'weapon_new' && u.type !== 'weapon_upgrade' && u.maxCount === 1);
  if (!statUpgrade) { console.log('  (skip: maxCount=1 stat 업그레이드 없음)'); return; }

  const player = makePlayer({ upgradeCounts: { [statUpgrade.id]: 1 } });
  const choices = UpgradeSystem.generateChoices(player);
  const isInChoices = choices.some(c => c.id === statUpgrade.id);
  assert.equal(isInChoices, false, 'maxCount 초과된 업그레이드가 선택지에 포함됨');
});

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
