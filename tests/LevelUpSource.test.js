import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { buildLevelUpCardMarkup, buildLevelUpHeaderMarkup } from '../src/ui/levelup/levelUpContent.js';
import { createLevelUpController } from '../src/scenes/play/levelUpController.js';

console.log('\n[LevelUp Source]');

const { test, summary } = createRunner('LevelUpSource');

test('level up content helper는 카드별 리롤 버튼과 봉인 모드 UI를 렌더링한다', () => {
  const headerHtml = buildLevelUpHeaderMarkup({
    title: '⬆ LEVEL UP',
    rerollsRemaining: 2,
    banishesRemaining: 1,
    banishMode: true,
  });
  const cardHtml = buildLevelUpCardMarkup({
    upgrade: {
      id: 'up_magic_bolt_2',
      name: '매직 볼트 강화',
      description: '더 강한 탄환을 발사합니다.',
      type: 'weapon',
    },
    index: 0,
    rerollsRemaining: 2,
    banishMode: false,
  });

  assert.equal(headerHtml.includes('남은 리롤 <strong>2</strong>'), true);
  assert.equal(headerHtml.includes('남은 봉인 <strong>1</strong>'), true);
  assert.equal(headerHtml.includes('봉인 모드 해제'), true);
  assert.equal(cardHtml.includes('리롤'), true);
  assert.equal(cardHtml.includes('levelup-card-shell'), true);
  assert.equal(cardHtml.includes('card-footer-actions'), true);
  assert.equal(cardHtml.includes('card-actions'), false);
});

test('level up controller는 선택과 카드별 리롤/봉인 토글 콜백을 분리해 노출한다', () => {
  const world = makeWorld({
    player: makePlayer(),
    playMode: 'levelup',
    pendingLevelUpChoices: [
      { id: 'up_damage', name: '공격력 증가', description: '데미지 증가', type: 'stat' },
      { id: 'up_speed', name: '속도 증가', description: '이동 속도 증가', type: 'stat' },
    ],
    pendingLevelUpType: 'levelup',
    runRerollsRemaining: 1,
    runBanishesRemaining: 1,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select',
  });
  const shownConfigs = [];

  const controller = createLevelUpController({
    getWorld: () => world,
    showLevelUp(config) {
      shownConfigs.push(config);
    },
  });

  controller.show();

  assert.equal(shownConfigs.length, 1);
  assert.equal(typeof shownConfigs[0].onSelect, 'function');
  assert.equal(typeof shownConfigs[0].onReroll, 'function');
  assert.equal(typeof shownConfigs[0].onToggleBanishMode, 'function');

  shownConfigs[0].onToggleBanishMode();
  assert.equal(world.levelUpActionMode, 'banish');

  shownConfigs.at(-1).onSelect(world.pendingLevelUpChoices[0], 0);
  assert.equal(Array.isArray(world.banishedUpgradeIds), true);
  assert.equal(world.runBanishesRemaining, 0);
});

test('level up controller 리롤은 주입된 game data를 사용해 선택지를 교체한다', () => {
  const world = makeWorld({
    player: makePlayer({
      weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
      maxWeaponSlots: 2,
      unlockedWeapons: ['magic_bolt', 'test_blade'],
    }),
    playMode: 'levelup',
    pendingLevelUpChoices: [
      { id: 'get_magic_bolt', type: 'weapon_new', weaponId: 'magic_bolt', name: 'Magic Bolt' },
      { id: 'stat_heal', type: 'stat', effect: { stat: 'hp', value: 25 }, name: '치유' },
      { id: 'stat_gold', type: 'stat', effect: { stat: 'currency', value: 25 }, name: '골드' },
    ],
    pendingLevelUpType: 'levelup',
    runRerollsRemaining: 1,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select',
  });

  const controller = createLevelUpController({
    getWorld: () => world,
    getData: () => ({
      upgradeData: [
        { id: 'get_magic_bolt', type: 'weapon_new', weaponId: 'magic_bolt', name: 'Magic Bolt' },
        { id: 'get_test_blade', type: 'weapon_new', weaponId: 'test_blade', name: 'Test Blade' },
        { id: 'stat_heal', type: 'stat', effect: { stat: 'hp', value: 25 }, name: '치유' },
        { id: 'stat_gold', type: 'stat', effect: { stat: 'currency', value: 25 }, name: '골드' },
      ],
      weaponData: [
        { id: 'magic_bolt', maxLevel: 7 },
        { id: 'test_blade', maxLevel: 7 },
      ],
      accessoryData: [],
      weaponProgressionData: {},
    }),
    showLevelUp() {},
  });

  controller.reroll(0);

  assert.equal(world.pendingLevelUpChoices[0]?.id, 'get_test_blade', '리롤이 주입된 game data 후보를 사용하지 않음');
  assert.equal(world.runRerollsRemaining, 0, '리롤 횟수가 차감되지 않음');
});

summary();
