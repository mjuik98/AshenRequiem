import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { makeWorld } from './fixtures/index.js';

let UpgradeApplySystem;
try {
  ({ UpgradeApplySystem } = await import('../src/systems/progression/UpgradeApplySystem.js'));
} catch {
  console.warn('[테스트] UpgradeApplySystem import 실패');
  UpgradeApplySystem = null;
}

let LevelSystem;
try {
  ({ LevelSystem } = await import('../src/systems/progression/LevelSystem.js'));
} catch {
  console.warn('[테스트] LevelSystem import 실패');
  LevelSystem = null;
}

console.log('\n[UpgradeApplySystem]');

test('stat_gold 선택지는 currencyEarned 이벤트를 발행한다', () => {
  if (!UpgradeApplySystem) return;
  const world = makeWorld({
    pendingUpgrade: {
      id: 'stat_gold',
      type: 'stat',
      effect: { stat: 'currency', value: 25 },
    },
  });

  UpgradeApplySystem.update({ world, data: { synergyData: [] } });

  assert.deepEqual(world.events.currencyEarned, [{ amount: 25 }], 'currencyEarned 이벤트가 발행되지 않음');
  assert.equal(world.pendingUpgrade, null, '업그레이드 적용 후 pendingUpgrade가 초기화되지 않음');
});

test('UpgradeApplySystem은 주입된 weaponData로 신규 무기를 추가한다', () => {
  if (!UpgradeApplySystem) return;
  const world = makeWorld({
    player: {
      ...makeWorld().player,
      weapons: [],
    },
    pendingUpgrade: {
      id: 'get_test_blade',
      type: 'weapon_new',
      weaponId: 'test_blade',
    },
  });

  UpgradeApplySystem.update({
    world,
    data: {
      synergyData: [],
      weaponData: [
        {
          id: 'test_blade',
          name: 'Test Blade',
          damage: 9,
          cooldown: 0.7,
          projectileSpeed: 300,
          range: 200,
          radius: 5,
          pierce: 1,
          projectileColor: '#fff',
          projectileCount: 1,
          behaviorId: 'targetProjectile',
          maxLevel: 3,
        },
      ],
    },
  });

  assert.equal(world.player.weapons[0]?.id, 'test_blade', '주입된 weaponData의 신규 무기가 적용되지 않음');
});

test('UpgradeApplySystem은 주입된 weaponProgressionData로 무기 강화를 적용한다', () => {
  if (!UpgradeApplySystem) return;
  const baseWorld = makeWorld();
  const world = makeWorld({
    player: {
      ...baseWorld.player,
      weapons: [{ id: 'test_blade', level: 1, damage: 3, cooldown: 1, currentCooldown: 0 }],
    },
    pendingUpgrade: {
      id: 'upgrade_test_blade',
      type: 'weapon_upgrade',
      weaponId: 'test_blade',
    },
  });

  UpgradeApplySystem.update({
    world,
    data: {
      synergyData: [],
      weaponData: [{ id: 'test_blade', maxLevel: 3 }],
      weaponProgressionData: {
        test_blade: [{ level: 2, damageDelta: 7, description: 'damage +7' }],
      },
    },
  });

  assert.equal(world.player.weapons[0]?.level, 2, '주입된 progression으로 무기 레벨이 오르지 않음');
  assert.equal(world.player.weapons[0]?.damage, 10, '주입된 progression의 damageDelta가 적용되지 않음');
});

test('UpgradeApplySystem은 주입된 accessoryData로 장신구를 장착한다', () => {
  if (!UpgradeApplySystem) return;
  const baseWorld = makeWorld();
  const world = makeWorld({
    player: {
      ...baseWorld.player,
      accessories: [],
      moveSpeed: 100,
      maxAccessorySlots: 3,
    },
    pendingUpgrade: {
      id: 'get_test_charm',
      type: 'accessory',
      accessoryId: 'test_charm',
    },
  });

  UpgradeApplySystem.update({
    world,
    data: {
      synergyData: [],
      accessoryData: [
        {
          id: 'test_charm',
          name: 'Test Charm',
          maxLevel: 2,
          effects: [{ stat: 'moveSpeed', value: 5, valuePerLevel: 5 }],
        },
      ],
    },
  });

  assert.equal(world.player.accessories[0]?.id, 'test_charm', '주입된 accessoryData의 장신구가 장착되지 않음');
  assert.equal(world.player.moveSpeed, 105, '주입된 accessoryData의 효과가 적용되지 않음');
});

test('LevelSystem은 런 중 봉인된 upgrade id를 제외한 선택지를 생성한다', () => {
  if (!LevelSystem) return;
  const world = makeWorld({
    player: {
      ...makeWorld().player,
      xp: 999,
      level: 1,
      weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
      maxWeaponSlots: 6,
      unlockedWeapons: ['magic_bolt', 'boomerang', 'holy_aura'],
    },
    banishedUpgradeIds: ['get_boomerang'],
  });

  LevelSystem.update({ world, data: {} });

  assert.ok(Array.isArray(world.pendingLevelUpChoices), '레벨업 선택지가 생성되지 않음');
  assert.equal(
    world.pendingLevelUpChoices.some((choice) => choice.id === 'get_boomerang'),
    false,
    '봉인된 get_boomerang이 레벨업 선택지에 다시 등장함',
  );
});

test('LevelSystem은 주입된 upgradeData를 사용해 선택지를 생성한다', () => {
  if (!LevelSystem) return;
  const baseWorld = makeWorld();
  const world = makeWorld({
    player: {
      ...baseWorld.player,
      xp: 999,
      level: 1,
      weapons: [],
      maxWeaponSlots: 3,
      unlockedWeapons: ['test_blade'],
    },
  });

  LevelSystem.update({
    world,
    data: {
      upgradeData: [{ id: 'get_test_blade', type: 'weapon_new', weaponId: 'test_blade' }],
      weaponData: [{ id: 'test_blade', maxLevel: 2, behaviorId: 'targetProjectile', damage: 2, cooldown: 1 }],
      weaponProgressionData: {},
    },
  });

  assert.equal(world.pendingLevelUpChoices.some((choice) => choice.id === 'get_test_blade'), true, '주입된 upgradeData 선택지가 생성되지 않음');
});

summary();
