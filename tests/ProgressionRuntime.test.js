import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let buildLevelUpOverlayState;
let rerollLevelUpChoice;
let banishLevelUpChoice;
let applySynergies;

try {
  ({
    buildLevelUpOverlayState,
    rerollLevelUpChoice,
    banishLevelUpChoice,
  } = await import('../src/app/play/levelUpFlowService.js'));
  ({ applySynergies } = await import('../src/progression/synergyRuntime.js'));
} catch (e) {
  console.warn('[테스트] progression runtime import 실패:', e.message);
}

console.log('\n[ProgressionRuntime]');

test('level up runtime는 현재 빌드와 연결된 선택지에 진화/시너지 힌트와 아이콘을 붙인다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'magic_bolt', level: 7, currentCooldown: 0 }],
      accessories: [{ id: 'iron_heart', level: 1 }],
      acquiredUpgrades: new Set(['up_magic_bolt']),
    }) },
    progression: { pendingLevelUpChoices: [
      { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서', description: '데미지 증가' },
      { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑', description: '부메랑 투척' },
      { id: 'evolution_arcane_nova', type: 'weapon_evolution', weaponId: 'magic_bolt', resultWeaponId: 'arcane_nova', name: '아케인 노바' },
    ],
    pendingLevelUpType: 'levelup',
    levelUpActionMode: 'select' },
  });

  const overlay = buildLevelUpOverlayState(world, {
    synergyData: [{
      id: 'rapid_barrage',
      requires: ['up_magic_bolt', 'boomerang'],
    }],
    weaponEvolutionData: [{
      id: 'evolution_arcane_nova',
      resultWeaponId: 'arcane_nova',
      requires: { weaponId: 'magic_bolt', accessoryIds: ['tome_of_power'] },
    }],
    weaponData: [
      { id: 'magic_bolt', icon: '✦' },
      { id: 'arcane_nova', icon: '☄' },
    ],
    accessoryData: [
      { id: 'tome_of_power', icon: '📘' },
    ],
  });

  assert.equal(overlay.title, '⬆ LEVEL UP');
  assert.deepEqual(overlay.choices[0].relatedHints, ['진화 연관']);
  assert.deepEqual(overlay.choices[1].relatedHints, ['시너지 연관']);
  assert.equal(overlay.choices[0].icon, '📘');
  assert.equal(overlay.choices[2].icon, '☄');
});

test('level up runtime는 실제로 연결된 다른 재료가 없으면 진화/시너지 힌트를 붙이지 않는다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'magic_bolt', level: 1, currentCooldown: 0 }],
      accessories: [],
      acquiredUpgrades: new Set(),
    }) },
    progression: { pendingLevelUpChoices: [
      { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서' },
      { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑' },
    ],
    pendingLevelUpType: 'levelup',
    levelUpActionMode: 'select' },
  });

  const overlay = buildLevelUpOverlayState(world, {
    synergyData: [{
      id: 'triple_combo',
      requires: ['up_magic_bolt', 'boomerang', 'acc_iron_heart'],
    }],
    weaponEvolutionData: [{
      id: 'evolution_arcane_nova',
      resultWeaponId: 'arcane_nova',
      requires: { weaponId: 'magic_bolt', accessoryIds: ['tome_of_power', 'arcane_prism'] },
    }],
    weaponData: [
      { id: 'magic_bolt', icon: '✦' },
      { id: 'arcane_nova', icon: '☄' },
    ],
    accessoryData: [
      { id: 'tome_of_power', icon: '📘' },
      { id: 'arcane_prism', icon: '🔮' },
    ],
  });

  assert.equal(overlay.choices[0].relatedHints, undefined, '연결 무기 외 추가 재료가 없는데 진화 힌트가 붙으면 안 됨');
  assert.equal(overlay.choices[1].relatedHints, undefined, '다른 시너지 재료가 부족한데 시너지 힌트가 붙으면 안 됨');
});

test('level up runtime는 도감 신규 카드와 강화 카드의 레벨 진행 정보를 함께 꾸민다', () => {
  const world = makeWorld({
    entities: { player: makePlayer({
      weapons: [{ id: 'flame_zone', level: 1, currentCooldown: 0 }],
      accessories: [{ id: 'iron_heart', level: 2 }],
    }) },
    progression: { pendingLevelUpChoices: [
      { id: 'up_flame_zone', type: 'weapon_upgrade', weaponId: 'flame_zone', name: '화염 지대' },
      { id: 'up_iron_heart', type: 'accessory_upgrade', accessoryId: 'iron_heart', name: '강철 심장' },
      { id: 'get_boomerang', type: 'weapon_new', weaponId: 'boomerang', name: '부메랑' },
      { id: 'get_tome_of_power', type: 'accessory', accessoryId: 'tome_of_power', name: '마력의 고서' },
      { id: 'evolution_arcane_nova', type: 'weapon_evolution', weaponId: 'magic_bolt', resultWeaponId: 'arcane_nova', name: '아케인 노바' },
    ],
    pendingLevelUpType: 'levelup',
    levelUpActionMode: 'select' },
  });

  const overlay = buildLevelUpOverlayState(world, {
    session: {
      meta: {
        weaponsUsedAll: ['flame_zone'],
        accessoriesOwnedAll: ['iron_heart'],
        evolvedWeapons: [],
      },
    },
    weaponData: [
      { id: 'flame_zone', icon: '🔥', description: '적 위치에 화염 장판을 깔아 지속 피해를 준다' },
      { id: 'boomerang', icon: '🪃' },
      { id: 'arcane_nova', icon: '☄' },
    ],
    accessoryData: [
      {
        id: 'iron_heart',
        icon: '❤',
        maxLevel: 5,
        effects: [{ stat: 'maxHp', value: 20, valuePerLevel: 20 }],
      },
      { id: 'tome_of_power', icon: '📘' },
    ],
  });

  assert.equal(overlay.choices[0].levelLabel, 'Lv 1 → Lv 2', '무기 강화 카드가 현재/다음 레벨을 표시하지 않음');
  assert.equal(overlay.choices[0].currentLabel, '현재 효과', '무기 강화 카드에 현재 효과 라벨이 없음');
  assert.equal(overlay.choices[0].currentText, '적 위치에 화염 장판을 깔아 지속 피해를 준다', '무기 강화 카드에 현재 효과 설명이 없음');
  assert.equal(overlay.choices[1].levelLabel, 'Lv 2 → Lv 3', '장신구 강화 카드가 현재/다음 레벨을 표시하지 않음');
  assert.equal(overlay.choices[1].currentLabel, '현재 효과', '장신구 강화 카드에 현재 효과 라벨이 없음');
  assert.equal(overlay.choices[1].currentText, '최대 HP +40', '장신구 강화 카드에 현재 효과 설명이 없음');
  assert.equal(overlay.choices[0].previewLabel, '다음 Lv 효과', '무기 강화 카드에 다음 레벨 효과 라벨이 없음');
  assert.equal(overlay.choices[0].previewText, '화염 지대 데미지 +1', '무기 강화 카드에 다음 레벨 효과 설명이 없음');
  assert.equal(overlay.choices[1].previewLabel, '다음 Lv 효과', '장신구 강화 카드에 다음 레벨 효과 라벨이 없음');
  assert.equal(overlay.choices[1].previewText, '최대 HP +20', '장신구 강화 카드에 다음 레벨 효과 설명이 없음');
  assert.equal(overlay.choices[2].discoveryLabel, '도감 신규', '미등록 무기 카드에 도감 신규 표시가 없음');
  assert.equal(overlay.choices[3].discoveryLabel, '도감 신규', '미등록 장신구 카드에 도감 신규 표시가 없음');
  assert.equal(overlay.choices[4].discoveryLabel, '도감 신규', '미등록 진화 무기 카드에 도감 신규 표시가 없음');
});

test('level up runtime는 리롤/봉인 시 world 상태만 갱신한다', () => {
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
    runBanishesRemaining: 1,
    banishedUpgradeIds: [],
    levelUpActionMode: 'select' },
  });
  const data = {
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
  };

  rerollLevelUpChoice(world, 0, data);
  assert.equal(world.progression.pendingLevelUpChoices[0]?.id, 'get_test_blade');
  assert.equal(world.progression.runRerollsRemaining, 0);

  const transitionCalls = [];
  world.progression.levelUpActionMode = 'banish';
  banishLevelUpChoice(world, 0, data, {
    transitionPlayMode: (_, mode) => transitionCalls.push(mode),
  });
  assert.equal(world.progression.runBanishesRemaining, 0);
  assert.deepEqual(world.progression.banishedUpgradeIds, ['get_test_blade']);
  assert.equal(transitionCalls.length, 0, '선택지가 남아 있으면 즉시 play mode를 바꾸면 안 됨');
});

test('synergy runtime는 system 객체 없이도 시너지 보너스를 멱등적으로 재계산한다', () => {
  const player = makePlayer({
    moveSpeed: 200,
    lifesteal: 0,
    upgradeCounts: { fireBolt: 1, iceSpear: 1, darkMagic: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ entities: { player } });
  const synergyData = [
    {
      id: 'fireAndIce',
      requires: ['fireBolt', 'iceSpear'],
      bonus: { speedMult: 1.3 },
    },
    {
      id: 'vampire',
      requires: ['darkMagic'],
      bonus: { lifestealDelta: 0.1 },
    },
  ];

  applySynergies({ player, synergyData, synergyState: world.progression.synergyState });
  const firstSpeed = player.moveSpeed;
  const firstLifesteal = player.lifesteal;

  applySynergies({ player, synergyData, synergyState: world.progression.synergyState });

  assert.equal(player.moveSpeed, firstSpeed);
  assert.equal(player.lifesteal, firstLifesteal);
  assert.deepEqual(player.activeSynergies.sort(), ['fireAndIce', 'vampire']);
});

summary();
