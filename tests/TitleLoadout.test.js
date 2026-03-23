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

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const weapons = titleLoadout.getAvailableStartWeapons(
    {
      weaponData: [
        { id: 'magic_bolt', isEvolved: false },
        { id: 'boomerang', isEvolved: false },
        { id: 'solar_requiem', isEvolved: true },
        { id: 'debug_only', isEvolved: false },
      ],
    },
    {
      meta: {
        unlockedWeapons: ['magic_bolt', 'boomerang'],
      },
    },
  );

  assert.deepEqual(
    weapons.map((weapon) => weapon.id),
    ['magic_bolt', 'boomerang'],
    '해금되지 않았거나 진화된 무기가 시작 후보에 포함되면 안 됨',
  );
});

await test('선택된 시작 무기는 현재 후보에 없으면 기본 무기로 안전하게 폴백한다', async () => {
  let titleLoadout;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const weapons = [
    { id: 'magic_bolt', isEvolved: false },
    { id: 'boomerang', isEvolved: false },
  ];

  const selectedWeaponId = titleLoadout.getSelectedStartWeaponId(
    {
      meta: {
        selectedStartWeaponId: 'locked_weapon',
      },
    },
    weapons,
  );

  assert.equal(selectedWeaponId, 'magic_bolt');
});

console.log(`\nTitleLoadout: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
