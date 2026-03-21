import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { makePlayer, makeWeapon } from './fixtures/index.js';

let pauseLoadoutContent = null;
try {
  pauseLoadoutContent = await import('../src/ui/pause/pauseLoadoutContent.js');
} catch (error) {
  pauseLoadoutContent = { error };
}

function getPauseLoadoutContent() {
  assert.ok(
    !pauseLoadoutContent.error,
    pauseLoadoutContent.error?.message ?? 'src/ui/pause/pauseLoadoutContent.js가 아직 없음',
  );
  return pauseLoadoutContent;
}

function makeTestFixture() {
  const weapon = makeWeapon({
    id: 'magic_bolt',
    name: 'Magic Bolt',
    level: 2,
    maxLevel: 5,
    cooldown: 1.2,
    damage: 14,
  });
  const accessory = {
    id: 'iron_heart',
    name: 'Iron Heart',
    level: 1,
    maxLevel: 5,
    rarity: 'rare',
  };
  const player = makePlayer({
    weapons: [weapon],
    accessories: [accessory],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
    activeSynergies: ['arcane_resonance'],
    evolvedWeapons: new Set(),
  });
  const synergy = {
    id: 'arcane_resonance',
    name: 'Arcane Resonance',
    description: 'Magic Bolt gets a surge when paired with Iron Heart.',
    bonus: { damageDelta: 1 },
  };
  const evolutionRecipe = {
    id: 'magic_bolt_arcana',
    requires: {
      weaponId: 'magic_bolt',
      accessoryIds: ['iron_heart'],
    },
    resultWeaponId: 'arcane_bolt',
  };
  const data = {
    weaponData: [weapon],
    accessoryData: [accessory],
    synergyData: [synergy],
    weaponEvolutionData: [evolutionRecipe],
  };
  const indexes = {
    weaponById: new Map([[weapon.id, weapon]]),
    accessoryById: new Map([[accessory.id, accessory]]),
    synergiesByWeaponId: new Map([[weapon.id, [synergy]]]),
    synergiesByAccessoryId: new Map(),
  };

  return { weapon, accessory, player, data, indexes, synergy, evolutionRecipe };
}

console.log('\n[Pause Loadout Content]');

test('helper module exposes the planned loadout API', () => {
  const api = getPauseLoadoutContent();

  assert.equal(typeof api.buildPauseLoadoutItems, 'function', 'buildPauseLoadoutItems가 없음');
  assert.equal(typeof api.getDefaultPauseSelection, 'function', 'getDefaultPauseSelection이 없음');
  assert.equal(typeof api.renderPauseLoadoutPanel, 'function', 'renderPauseLoadoutPanel이 없음');
});

test('buildPauseLoadoutItems는 무기, 장신구, 빈 슬롯, 잠금 슬롯을 포함한다', () => {
  const api = getPauseLoadoutContent();
  const { player, data, indexes, weapon, accessory } = makeTestFixture();

  const items = api.buildPauseLoadoutItems({ player, data, indexes });

  assert.ok(Array.isArray(items), 'buildPauseLoadoutItems가 배열을 반환하지 않음');
  const kinds = items.map((item) => item.kind);
  const firstEmptyIndex = kinds.indexOf('empty');
  const firstLockedIndex = kinds.indexOf('locked');
  const weaponItem = items.find((item) => item.kind === 'weapon');
  const accessoryItem = items.find((item) => item.kind === 'accessory');
  const emptyItem = items.find((item) => item.kind === 'empty');
  const lockedItem = items.find((item) => item.kind === 'locked');

  assert.ok(weaponItem, '무기 항목이 누락됨');
  assert.ok(accessoryItem, '장신구 항목이 누락됨');
  assert.ok(emptyItem, '빈 슬롯 항목이 누락됨');
  assert.ok(lockedItem, '잠금 슬롯 항목이 누락됨');
  assert.equal(kinds[0], 'weapon', '첫 번째 로드아웃 항목이 무기가 아님');
  assert.equal(kinds[1], 'accessory', '두 번째 로드아웃 항목이 장신구가 아님');
  assert.ok(firstEmptyIndex > 1, '빈 슬롯이 장착 항목 뒤에 오지 않음');
  assert.ok(firstLockedIndex > firstEmptyIndex, '잠금 슬롯이 빈 슬롯 뒤에 오지 않음');
  assert.ok(items.every((item, index) => item.slotIndex === index), '로드아웃 항목의 slotIndex가 출력 순서를 따르지 않음');
  assert.equal(weaponItem.id, weapon.id, '무기 항목이 무기 id를 보존하지 않음');
  assert.equal(weaponItem.name, weapon.name, '무기 항목이 무기 name을 보존하지 않음');
  assert.equal(weaponItem.slotIndex, 0, '무기 항목의 slotIndex가 0이 아님');
  assert.equal(accessoryItem.id, accessory.id, '장신구 항목이 장신구 id를 보존하지 않음');
  assert.equal(accessoryItem.name, accessory.name, '장신구 항목이 장신구 name을 보존하지 않음');
  assert.equal(accessoryItem.slotIndex, 1, '장신구 항목의 slotIndex가 1이 아님');
  assert.equal(typeof emptyItem.label, 'string', '빈 슬롯 항목에 표시 레이블이 없음');
  assert.equal(typeof lockedItem.label, 'string', '잠금 슬롯 항목에 표시 레이블이 없음');
  assert.equal(emptyItem.id == null, true, '빈 슬롯 항목에 id가 남아 있음');
  assert.equal(lockedItem.id == null, true, '잠금 슬롯 항목에 id가 남아 있음');
  assert.deepEqual(
    items.filter((item) => item.kind === 'weapon' || item.kind === 'accessory').map((item) => item.id),
    [weapon.id, accessory.id],
    '장착 항목의 순서가 입력 로드아웃과 일치하지 않음',
  );
});

test('getDefaultPauseSelection은 첫 무기를 우선하고 빈 로드아웃에서는 안정적이다', () => {
  const api = getPauseLoadoutContent();
  const { player, data, indexes, weapon } = makeTestFixture();

  const selection = api.getDefaultPauseSelection({ player, data, indexes });
  assert.ok(selection, '기본 선택이 반환되지 않음');
  assert.equal(selection.id, weapon.id, '기본 선택이 첫 무기를 우선하지 않음');
  assert.equal(selection.kind, 'weapon', '기본 선택의 kind가 무기가 아님');

  const emptyPlayer = makePlayer({
    weapons: [],
    accessories: [],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
  });
  const emptyFirst = api.getDefaultPauseSelection({ player: emptyPlayer, data, indexes });
  const emptySecond = api.getDefaultPauseSelection({ player: emptyPlayer, data, indexes });

  assert.deepEqual(emptyFirst, emptySecond, '빈 로드아웃의 기본 선택이 안정적이지 않음');
});

test('renderPauseLoadoutPanel은 상세 패널 컨테이너와 연결 블록을 포함한다', () => {
  const api = getPauseLoadoutContent();
  const { player, data, indexes, weapon } = makeTestFixture();
  const items = api.buildPauseLoadoutItems({ player, data, indexes });
  const selectedItem = api.getDefaultPauseSelection({ player, data, indexes });

  const html = api.renderPauseLoadoutPanel({
    items,
    selectedItemId: selectedItem?.id ?? weapon.id,
    player,
    data,
    indexes,
  });

  assert.equal(typeof html, 'string', 'renderPauseLoadoutPanel이 문자열을 반환하지 않음');
  assert.ok(html.includes('pv-loadout-list'), '로드아웃 리스트 컨테이너가 없음');
  assert.ok(html.includes('pv-loadout-detail'), '로드아웃 상세 컨테이너가 없음');
  assert.ok(html.includes('pv-loadout-linked-items'), '연결 아이템 블록이 없음');
  assert.ok(html.includes('pv-loadout-synergy'), '시너지 블록이 없음');
  assert.ok(html.includes('pv-loadout-evolution'), '진화 블록이 없음');
  assert.match(html, /data-loadout/, '선택 가능한 로드아웃 카드 훅이 없음');
  assert.ok(html.includes('빈 슬롯'), '빈 슬롯이 렌더된 로드아웃 출력에 없음');
  assert.ok(html.includes('상점 해금'), '잠금 슬롯이 렌더된 로드아웃 출력에 없음');

  const htmlWithAccessorySelected = api.renderPauseLoadoutPanel({
    items,
    selectedItemId: accessory.id,
    player,
    data,
    indexes,
  });

  assert.notEqual(html, htmlWithAccessorySelected, '선택 항목에 따라 패널 출력이 달라지지 않음');
  assert.ok(html.includes(weapon.name), '무기 선택 시 선택 항목 정보가 패널에 반영되지 않음');
  assert.ok(htmlWithAccessorySelected.includes(accessory.name), '장신구 선택 시 선택 항목 정보가 패널에 반영되지 않음');
});

summary();
