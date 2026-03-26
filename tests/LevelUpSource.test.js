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
      icon: '✦',
      relatedHints: ['진화 연관', '시너지 연관'],
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
  assert.equal(cardHtml.includes('card-icon'), true);
  assert.equal(cardHtml.includes('✦'), true);
  assert.equal(cardHtml.includes('진화 연관'), true);
  assert.equal(cardHtml.includes('시너지 연관'), true);
  assert.equal(cardHtml.includes('card-actions'), false);
});

test('진화 카드 마크업은 별도 시각 강조와 결과 무기 아이콘을 가진다', () => {
  const cardHtml = buildLevelUpCardMarkup({
    upgrade: {
      id: 'evolution_helios_lance',
      name: '헬리오스 랜스',
      description: '태양 광선을 헬리오스 랜스로 진화',
      type: 'weapon_evolution',
      icon: '☄',
    },
    index: 0,
    rerollsRemaining: 1,
    banishMode: false,
  });

  assert.equal(cardHtml.includes('type-evolution'), true, '진화 카드 전용 클래스가 없음');
  assert.equal(cardHtml.includes('card-badge-evolution'), true, '진화 카드 배지 강조 클래스가 없음');
  assert.equal(cardHtml.includes('☄'), true, '진화 카드 아이콘이 렌더되지 않음');
});

test('level up controller는 선택과 카드별 리롤/봉인 토글 콜백을 분리해 노출한다', () => {
  const world = makeWorld({
    entities: { player: makePlayer() },
    run: { playMode: 'levelup' },
    progression: { pendingLevelUpChoices: [
      { id: 'up_damage', name: '공격력 증가', description: '데미지 증가', type: 'stat' },
      { id: 'up_speed', name: '속도 증가', description: '이동 속도 증가', type: 'stat' },
    ],
    pendingLevelUpType: 'levelup',
    runRerollsRemaining: 1,
    runBanishesRemaining: 1,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select' },
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
  assert.equal(world.progression.levelUpActionMode, 'banish');

  shownConfigs.at(-1).onSelect(world.progression.pendingLevelUpChoices[0], 0);
  assert.equal(Array.isArray(world.progression.banishedUpgradeIds), true);
  assert.equal(world.progression.runBanishesRemaining, 0);
});

test('level up controller 리롤은 주입된 game data를 사용해 선택지를 교체한다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
      maxWeaponSlots: 2,
      unlockedWeapons: ['magic_bolt', 'test_blade'],
    }) },
    run: { playMode: 'levelup' },
    progression: { pendingLevelUpChoices: [
      { id: 'get_magic_bolt', type: 'weapon_new', weaponId: 'magic_bolt', name: 'Magic Bolt' },
      { id: 'stat_heal', type: 'stat', effect: { stat: 'hp', value: 25 }, name: '치유' },
      { id: 'stat_gold', type: 'stat', effect: { stat: 'currency', value: 25 }, name: '골드' },
    ],
    pendingLevelUpType: 'levelup',
    runRerollsRemaining: 1,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select' },
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

  assert.equal(world.progression.pendingLevelUpChoices[0]?.id, 'get_test_blade', '리롤이 주입된 game data 후보를 사용하지 않음');
  assert.equal(world.progression.runRerollsRemaining, 0, '리롤 횟수가 차감되지 않음');
});

test('level up controller는 현재 빌드와 연결된 무기/장신구 카드에 진화/시너지 연관 힌트를 붙인다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'magic_bolt', level: 7, currentCooldown: 0 }],
      accessories: [{ id: 'iron_heart', level: 1 }],
      acquiredUpgrades: new Set(['up_magic_bolt']),
    }) },
    run: { playMode: 'levelup' },
    progression: { pendingLevelUpChoices: [
      { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서', description: '데미지 증가' },
      { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑', description: '부메랑 투척' },
    ],
    pendingLevelUpType: 'levelup',
    runRerollsRemaining: 0,
    runBanishesRemaining: 0,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select' },
  });
  const shownConfigs = [];

  const controller = createLevelUpController({
    getWorld: () => world,
    getData: () => ({
      synergyData: [{
        id: 'rapid_barrage',
        requires: ['up_magic_bolt', 'boomerang'],
      }],
      weaponEvolutionData: [{
        id: 'evolution_arcane_nova',
        resultWeaponId: 'arcane_nova',
        requires: { weaponId: 'magic_bolt', accessoryIds: ['tome_of_power'] },
      }],
    }),
    showLevelUp(config) {
      shownConfigs.push(config);
    },
  });

  controller.show();

  assert.deepEqual(shownConfigs[0].choices[0].relatedHints, ['진화 연관'], '진화 재료 장신구 카드에 진화 연관 힌트가 없음');
  assert.deepEqual(shownConfigs[0].choices[1].relatedHints, ['시너지 연관'], '시너지와 연결된 무기 카드에 시너지 연관 힌트가 없음');
});

test('level up controller는 데이터 정의를 사용해 무기/장신구/진화 카드 아이콘을 붙인다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'solar_ray', level: 7, currentCooldown: 0 }],
      accessories: [{ id: 'arcane_prism', level: 1 }],
    }) },
    run: { playMode: 'levelup' },
    progression: { pendingLevelUpChoices: [
      { id: 'evolution_helios_lance', type: 'weapon_evolution', weaponId: 'solar_ray', resultWeaponId: 'helios_lance', name: '헬리오스 랜스' },
      { id: 'get_arcane_prism', type: 'accessory', accessoryId: 'arcane_prism', name: '비전 프리즘' },
    ] },
  });
  const shownConfigs = [];

  const controller = createLevelUpController({
    getWorld: () => world,
    getData: () => ({
      weaponData: [
        { id: 'solar_ray', icon: '☀' },
        { id: 'helios_lance', icon: '☄' },
      ],
      accessoryData: [
        { id: 'arcane_prism', icon: '🔮' },
      ],
      weaponEvolutionData: [],
      synergyData: [],
    }),
    showLevelUp(config) {
      shownConfigs.push(config);
    },
  });

  controller.show();

  assert.equal(shownConfigs[0].choices[0].icon, '☄', '진화 카드에 결과 무기 아이콘이 붙지 않음');
  assert.equal(shownConfigs[0].choices[1].icon, '🔮', '장신구 카드에 장신구 아이콘이 붙지 않음');
});

summary();
