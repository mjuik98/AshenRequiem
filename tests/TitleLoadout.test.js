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

await test('타이틀 로드아웃은 Ascension 선택지와 현재 선택 레벨을 함께 노출한다', async () => {
  let titleLoadout;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const config = titleLoadout.buildTitleLoadoutConfig(
    {
      weaponData: [
        { id: 'magic_bolt', isEvolved: false },
      ],
      unlockData: [],
    },
    {
      meta: {
        selectedStartWeaponId: 'magic_bolt',
        selectedAscensionLevel: 2,
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: [],
        permanentUpgrades: {},
      },
    },
  );

  assert.equal(config.selectedAscensionLevel, 2, '현재 Ascension 선택 레벨이 노출되지 않음');
  assert.ok(Array.isArray(config.ascensionChoices), 'Ascension 선택지 목록이 없음');
  assert.ok(config.ascensionChoices.length >= 3, 'Ascension 선택지가 충분히 제공되지 않음');
  assert.equal(
    config.ascensionChoices.some((choice) => choice.level === 0),
    true,
    'Ascension 0 기본 선택지가 누락됨',
  );
  assert.equal(config.selectedAscension?.level, 2, '선택된 Ascension 요약 정보가 노출되지 않음');
  assert.equal(typeof config.selectedAscension?.description, 'string', '선택된 Ascension 설명이 없음');
});

await test('타이틀 로드아웃은 시작 장신구, 스테이지, 시드 설정을 함께 노출한다', async () => {
  let titleLoadout;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const config = titleLoadout.buildTitleLoadoutConfig(
    {
      weaponData: [{ id: 'magic_bolt', isEvolved: false, behaviorId: 'targetProjectile' }],
      accessoryData: [{ id: 'ring_of_speed' }, { id: 'iron_heart' }],
      unlockData: [],
      stageData: [{ id: 'ash_plains' }, { id: 'ember_hollow' }],
    },
    {
      meta: {
        selectedStartWeaponId: 'magic_bolt',
        selectedStartAccessoryId: 'ring_of_speed',
        selectedStageId: 'ember_hollow',
        selectedSeedMode: 'custom',
        selectedSeedText: 'ashen-seed',
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: ['ring_of_speed', 'iron_heart'],
        permanentUpgrades: {},
      },
    },
  );

  assert.deepEqual(config.accessories.map((entry) => entry.id), ['ring_of_speed', 'iron_heart']);
  assert.equal(config.selectedStartAccessoryId, 'ring_of_speed');
  assert.deepEqual(config.stages.map((entry) => entry.id), ['ash_plains', 'ember_hollow']);
  assert.equal(config.selectedStageId, 'ember_hollow');
  assert.equal(config.selectedSeedMode, 'custom');
  assert.equal(config.selectedSeedText, 'ashen-seed');
});

await test('타이틀 로드아웃은 archetype, risk relic, 추천 목표를 함께 노출한다', async () => {
  let titleLoadout;

  try {
    titleLoadout = await import('../src/scenes/title/titleLoadout.js');
  } catch (error) {
    throw new Error(`titleLoadout import 실패: ${error.message}`);
  }

  const config = titleLoadout.buildTitleLoadoutConfig(
    {
      weaponData: [{ id: 'magic_bolt', isEvolved: false, behaviorId: 'targetProjectile' }],
      unlockData: [
        {
          id: 'unlock_chain_lightning',
          targetType: 'weapon',
          targetId: 'chain_lightning',
          conditionType: 'total_kills_gte',
          conditionValue: 600,
          rewardText: '연쇄 번개 해금',
        },
      ],
      archetypeData: [{ id: 'vanguard', name: 'Vanguard' }, { id: 'spellweaver', name: 'Spellweaver' }],
      riskRelicData: [{ id: 'glass_censer', name: 'Glass Censer' }, { id: 'blood_price', name: 'Blood Price' }],
    },
    {
      meta: {
        selectedStartWeaponId: 'magic_bolt',
        selectedArchetypeId: 'spellweaver',
        selectedRiskRelicId: 'glass_censer',
        unlockedWeapons: ['magic_bolt'],
        unlockedAccessories: [],
        enemyKills: { skeleton: 420 },
        permanentUpgrades: {},
      },
    },
  );

  assert.deepEqual(config.archetypes.map((entry) => entry.id), ['vanguard', 'spellweaver']);
  assert.deepEqual(config.riskRelics.map((entry) => entry.id), ['glass_censer', 'blood_price']);
  assert.equal(config.selectedArchetypeId, 'spellweaver');
  assert.equal(config.selectedRiskRelicId, 'glass_censer');
  assert.equal(Array.isArray(config.recommendedGoals), true);
  assert.equal(config.recommendedGoals.length > 0, true, '추천 목표가 함께 노출되지 않음');
});

console.log(`\nTitleLoadout: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
