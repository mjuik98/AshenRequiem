import assert from 'node:assert/strict';

console.log('\n[TitleLoadout]');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

await test('시작 무기 후보는 주입된 gameData.weaponData 기준으로 해금된 기본 무기만 포함한다', async () => {
  let titleLoadout;
  let startLoadoutRuntime;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
    startLoadoutRuntime = await import('../src/state/startLoadoutRuntime.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const gameData = {
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
      { id: 'boomerang', isEvolved: false },
      { id: 'solar_requiem', isEvolved: true },
      { id: 'debug_only', isEvolved: false },
    ],
    unlockData: [
      { id: 'unlock_debug_only', targetType: 'weapon', targetId: 'debug_only' },
    ],
  };
  const session = {
    meta: {
      unlockedWeapons: ['magic_bolt', 'boomerang'],
      unlockedAccessories: [],
      selectedStartWeaponId: 'magic_bolt',
      permanentUpgrades: {},
    },
  };
  const weapons = titleLoadout.getAvailableStartWeapons(gameData, session);
  const resolved = startLoadoutRuntime.resolveStartWeaponSelection(gameData, session);

  assert.deepEqual(
    weapons.map((weapon) => weapon.id),
    ['magic_bolt', 'boomerang'],
    '해금되지 않았거나 진화된 무기가 시작 후보에 포함되면 안 됨',
  );
  assert.deepEqual(weapons.map((weapon) => weapon.id), resolved.availableStartWeapons.map((weapon) => weapon.id));
});

await test('선택된 시작 무기는 현재 후보에 없으면 기본 무기로 안전하게 폴백한다', async () => {
  let titleLoadout;
  let startLoadoutRuntime;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
    startLoadoutRuntime = await import('../src/state/startLoadoutRuntime.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const config = titleLoadout.buildTitleLoadoutConfig(
    {
      weaponData: [
        { id: 'magic_bolt', isEvolved: false },
        { id: 'boomerang', isEvolved: false },
      ],
      unlockData: [
        { id: 'unlock_boomerang', targetType: 'weapon', targetId: 'boomerang' },
      ],
    },
    {
      meta: {
        selectedStartWeaponId: 'locked_weapon',
        unlockedWeapons: ['magic_bolt', 'boomerang'],
        unlockedAccessories: [],
        permanentUpgrades: {},
      },
    },
  );

  assert.equal(config.selectedWeaponId, 'magic_bolt');
  assert.equal(
    startLoadoutRuntime.resolveStartWeaponSelection({ weaponData: config.weapons, unlockData: [] }, {
      meta: {
        selectedStartWeaponId: 'locked_weapon',
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: [],
        permanentUpgrades: {},
      },
    }).selectedStartWeaponId,
    'magic_bolt',
  );
});

await test('시작 후보가 없으면 타이틀 로드아웃은 시작 불가 상태를 노출한다', async () => {
  let titleLoadout;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const config = titleLoadout.buildTitleLoadoutConfig(
    {
      weaponData: [],
      unlockData: [],
    },
    {
      meta: {
        selectedStartWeaponId: 'magic_bolt',
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: [],
        permanentUpgrades: {},
      },
    },
  );

  assert.deepEqual(config.weapons, []);
  assert.equal(config.selectedWeaponId, null);
  assert.equal(config.canStart, false);
});

console.log(`\nTitleLoadout: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
