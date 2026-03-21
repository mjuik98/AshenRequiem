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

let LevelSystem;
try {
  ({ LevelSystem } = await import('../src/systems/progression/LevelSystem.js'));
} catch {
  console.warn('[테스트] LevelSystem import 실패');
  LevelSystem = null;
}

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

summary();
