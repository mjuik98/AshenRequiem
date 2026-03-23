import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';
import { makePlayer, makeWeapon } from './fixtures/index.js';
import { weaponData } from '../src/data/weaponData.js';
import { accessoryData } from '../src/data/accessoryData.js';

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

function extractSection(html, className) {
  const match = html.match(new RegExp(`<section class="[^"]*\\b${className}\\b[^"]*"[\\s\\S]*?<\\/section>`));
  return match?.[0] ?? '';
}

function makeTestFixture() {
  const weapon = makeWeapon({
    id: 'magic_bolt',
    name: 'Magic Bolt',
    icon: '✦',
    description: 'Seeks the nearest enemy with a compact arcane bolt.',
    level: 5,
    maxLevel: 5,
    cooldown: 0.6503296,
    damage: 14,
  });
  const accessory = {
    id: 'iron_heart',
    name: 'Iron Heart',
    level: 1,
    maxLevel: 5,
    icon: '💗',
    rarity: 'rare',
    description: 'Keeps the caster alive longer and stabilizes sustain.',
  };
  const extraWeapon = makeWeapon({
    id: 'boomerang',
    name: 'Boomerang',
    icon: '↺',
    level: 1,
    maxLevel: 5,
    cooldown: 1.8,
    damage: 8,
  });
  const extraAccessory = {
    id: 'coin_pendant',
    name: 'Coin Pendant',
    icon: '🪙',
    level: 1,
    maxLevel: 5,
    rarity: 'common',
    description: 'Extra coins.',
  };
  const player = makePlayer({
    weapons: [weapon, extraWeapon],
    accessories: [accessory, extraAccessory],
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
    weaponData: [weapon, extraWeapon],
    accessoryData: [accessory, extraAccessory],
    synergyData: [synergy],
    weaponEvolutionData: [evolutionRecipe],
  };
  const indexes = {
    weaponById: new Map([[weapon.id, weapon], [extraWeapon.id, extraWeapon]]),
    accessoryById: new Map([[accessory.id, accessory], [extraAccessory.id, extraAccessory]]),
    synergiesByWeaponId: new Map([[weapon.id, [synergy]]]),
    synergiesByAccessoryId: new Map([[accessory.id, [synergy]]]),
  };

  return { weapon, accessory, extraWeapon, extraAccessory, player, data, indexes, synergy, evolutionRecipe };
}

console.log('\n[Pause Loadout Content]');

test('helper module exposes the planned loadout API', () => {
  const api = getPauseLoadoutContent();

  assert.equal(typeof api.buildPauseLoadoutItems, 'function', 'buildPauseLoadoutItems가 없음');
  assert.equal(typeof api.getDefaultPauseSelection, 'function', 'getDefaultPauseSelection이 없음');
  assert.equal(typeof api.renderPauseLoadoutPanel, 'function', 'renderPauseLoadoutPanel이 없음');
  assert.equal(typeof api.normalizePauseSynergyRequirementId, 'function', '공유 시너지 requirement 정규화 helper가 없음');
});

test('실제 weapon/accessory 데이터는 ESC 아이콘 렌더링용 icon 필드를 가진다', () => {
  assert.equal(
    weaponData.every((weapon) => typeof weapon.icon === 'string' && weapon.icon.length > 0),
    true,
    'icon이 없는 weaponData 항목이 있음',
  );
  assert.equal(
    accessoryData.every((accessory) => typeof accessory.icon === 'string' && accessory.icon.length > 0),
    true,
    'icon이 없는 accessoryData 항목이 있음',
  );
});

test('normalizePauseSynergyRequirementId는 PauseView와 loadout helper가 공유할 정규화 규칙을 제공한다', () => {
  const api = getPauseLoadoutContent();

  assert.equal(api.normalizePauseSynergyRequirementId('up_magic_bolt'), 'magic_bolt', 'up_ 접두사 정규화가 잘못됨');
  assert.equal(api.normalizePauseSynergyRequirementId('get_iron_heart'), 'iron_heart', 'get_ 접두사 정규화가 잘못됨');
  assert.equal(api.normalizePauseSynergyRequirementId('acc_iron_heart'), 'iron_heart', 'acc_ 접두사 정규화가 잘못됨');
  assert.equal(api.normalizePauseSynergyRequirementId('coin_pendant'), 'coin_pendant', '일반 id 정규화가 잘못됨');
  assert.equal(api.normalizePauseSynergyRequirementId(null), null, '비문자 requirement 처리 규칙이 잘못됨');
});

test('buildPauseLoadoutItems는 무기, 장신구, 빈 슬롯을 포함하고 잠금 슬롯은 노출하지 않는다', () => {
  const api = getPauseLoadoutContent();
  const { player, weapon, accessory } = makeTestFixture();

  const items = api.buildPauseLoadoutItems({ player });

  assert.ok(Array.isArray(items), 'buildPauseLoadoutItems가 배열을 반환하지 않음');
  const kinds = items.map((item) => item.kind);
  const firstEmptyIndex = kinds.indexOf('empty');
  const weaponItem = items.find((item) => item.kind === 'weapon');
  const accessoryItem = items.find((item) => item.kind === 'accessory');
  const emptyItem = items.find((item) => item.kind === 'empty');

  assert.ok(weaponItem, '무기 항목이 누락됨');
  assert.ok(accessoryItem, '장신구 항목이 누락됨');
  assert.ok(emptyItem, '빈 슬롯 항목이 누락됨');
  assert.equal(kinds[0], 'weapon', '첫 번째 로드아웃 항목이 무기가 아님');
  assert.ok(firstEmptyIndex > 1, '빈 슬롯이 장착 항목 뒤에 오지 않음');
  assert.equal(kinds.includes('locked'), false, '잠금 슬롯이 여전히 로드아웃 목록에 포함됨');
  assert.ok(items.every((item, index) => item.slotIndex === index), '로드아웃 항목의 slotIndex가 출력 순서를 따르지 않음');
  assert.equal(weaponItem.id, weapon.id, '무기 항목이 무기 id를 보존하지 않음');
  assert.equal(weaponItem.name, weapon.name, '무기 항목이 무기 name을 보존하지 않음');
  assert.equal(weaponItem.slotIndex, 0, '무기 항목의 slotIndex가 0이 아님');
  assert.equal(accessoryItem.id, accessory.id, '장신구 항목이 장신구 id를 보존하지 않음');
  assert.equal(accessoryItem.name, accessory.name, '장신구 항목이 장신구 name을 보존하지 않음');
  assert.ok(accessoryItem.slotIndex > 0, '장신구 항목이 장착 로드아웃 뒤에 오지 않음');
  assert.equal(typeof weaponItem.selectionKey, 'string', '무기 항목에 selectionKey가 없음');
  assert.equal(typeof accessoryItem.selectionKey, 'string', '장신구 항목에 selectionKey가 없음');
  assert.equal(typeof emptyItem.selectionKey, 'string', '빈 슬롯 항목에 selectionKey가 없음');
  assert.equal(new Set(items.map((item) => item.selectionKey)).size, items.length, '로드아웃 항목 selectionKey가 고유하지 않음');
  assert.equal(typeof emptyItem.label, 'string', '빈 슬롯 항목에 표시 레이블이 없음');
  assert.equal(emptyItem.id == null, true, '빈 슬롯 항목에 id가 남아 있음');
  assert.deepEqual(
    items.filter((item) => item.kind === 'weapon' || item.kind === 'accessory').map((item) => item.id),
    [weapon.id, 'boomerang', accessory.id, 'coin_pendant'],
    '장착 항목의 순서가 입력 로드아웃과 일치하지 않음',
  );
});

test('getDefaultPauseSelection은 첫 무기를 우선하고 빈 로드아웃에서는 안정적이다', () => {
  const api = getPauseLoadoutContent();
  const { player, weapon } = makeTestFixture();

  const selection = api.getDefaultPauseSelection({ player });
  assert.ok(selection, '기본 선택이 반환되지 않음');
  assert.equal(selection.id, weapon.id, '기본 선택이 첫 무기를 우선하지 않음');
  assert.equal(selection.kind, 'weapon', '기본 선택의 kind가 무기가 아님');

  const emptyPlayer = makePlayer({
    weapons: [],
    accessories: [],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
  });
  const emptyItems = api.buildPauseLoadoutItems({ player: emptyPlayer });
  const emptyFirst = api.getDefaultPauseSelection({ player: emptyPlayer });
  const emptySecond = api.getDefaultPauseSelection({ player: emptyPlayer });

  assert.deepEqual(emptyFirst, emptySecond, '빈 로드아웃의 기본 선택이 안정적이지 않음');
  assert.equal(emptyFirst.kind, 'empty', '빈 로드아웃의 기본 선택이 빈 슬롯이 아님');
  assert.equal(typeof emptyFirst.selectionKey, 'string', '빈 로드아웃 기본 선택에 selectionKey가 없음');
});

test('renderPauseLoadoutPanel은 중복 요약 없이 핵심 상세 정보만 유지하며 긴 쿨다운 소수는 정리한다', () => {
  const api = getPauseLoadoutContent();
  const { player, data, indexes, weapon, accessory, extraWeapon, extraAccessory } = makeTestFixture();
  const items = api.buildPauseLoadoutItems({ player });
  const selectedItem = api.getDefaultPauseSelection({ player });
  const accessoryItem = items.find((item) => item.kind === 'accessory');

  const html = api.renderPauseLoadoutPanel({
    items,
    selectedItemKey: selectedItem?.selectionKey,
    player,
    data,
    indexes,
  });
  const linkedItemsSection = extractSection(html, 'pv-loadout-linked-items');

  assert.equal(typeof html, 'string', 'renderPauseLoadoutPanel이 문자열을 반환하지 않음');
  assert.ok(html.includes('pv-loadout-list'), '로드아웃 리스트 컨테이너가 없음');
  assert.ok(html.includes('pv-loadout-detail'), '로드아웃 상세 컨테이너가 없음');
  assert.ok(html.includes('pv-slot-section'), '무기/장신구 슬롯 섹션이 없음');
  assert.ok(html.includes('pv-slot-cards'), '슬롯 카드 그룹 컨테이너가 없음');
  assert.ok(html.includes('pv-slot-card'), '슬롯 카드 마크업이 없음');
  assert.ok(html.includes('pv-slot-section-count'), '슬롯 섹션 카운트가 없음');
  assert.ok(html.includes('pv-slot-dots'), '슬롯 레벨 도트가 없음');
  assert.ok(html.includes('pv-slot-evo-chip'), '진화 가능 슬롯 표시가 없음');
  assert.ok(html.includes('pv-loadout-linked-items'), '연결 아이템 블록이 없음');
  assert.ok(html.includes('pv-loadout-synergy'), '시너지 블록이 없음');
  assert.ok(html.includes('pv-loadout-evolution'), '진화 블록이 없음');
  assert.ok(html.includes('pv-loadout-meta-icon'), '시너지/진화 아이콘 배지가 없음');
  assert.ok(html.includes('pv-loadout-req-chip'), '실제 요구 아이콘 칩이 없음');
  assert.ok(html.includes('variant-status'), '현재 상태 섹션 variant 클래스가 없음');
  assert.ok(html.includes('variant-links'), '연결 아이템 섹션 variant 클래스가 없음');
  assert.ok(html.includes('variant-synergy'), '시너지 섹션 variant 클래스가 없음');
  assert.ok(html.includes('variant-evolution'), '진화 섹션 variant 클래스가 없음');
  assert.ok(html.includes('pv-loadout-progress-block'), '상세 패널 진행/현재 상태 블록이 없음');
  assert.ok(html.includes('pv-loadout-lv-block'), '레벨 진행 블록이 현재 상태에 포함되지 않음');
  assert.ok(html.includes('pv-loadout-detail-hero'), '선택 항목 헤더 hero 블록이 없음');
  assert.ok(html.includes('pv-loadout-detail-icon'), '선택 항목 아이콘이 상세 헤더에 없음');
  assert.ok(html.includes('detail-kind-weapon'), '무기 선택 accent 클래스가 상세 헤더에 없음');
  assert.ok(html.includes('pv-loadout-row-label'), '상태 행 label 클래스가 없음');
  assert.ok(html.includes('pv-loadout-row-value'), '상태 행 value 클래스가 없음');
  assert.match(html, /data-loadout/, '선택 가능한 로드아웃 카드 훅이 없음');
  assert.equal(
    html.includes('빈 무기 슬롯') || html.includes('빈 장신구 슬롯'),
    true,
    '빈 슬롯이 렌더된 로드아웃 출력에 없음',
  );
  assert.equal(html.includes('상점 해금'), false, '해금 슬롯이 로드아웃 출력에 남아 있음');
  assert.ok(html.includes('현재 쿨다운'), '현재 상태에 쿨다운 행이 없음');
  assert.ok(html.includes('0.65s'), '스탯 바 쿨다운이 정리된 소수로 표시되지 않음');
  assert.equal(html.includes('0.6503296'), false, '긴 쿨다운 소수가 그대로 노출됨');
  assert.ok(html.includes('✦'), '무기 아이콘이 데이터 기반으로 렌더되지 않음');
  assert.ok(html.includes('💗'), '장신구 아이콘이 데이터 기반으로 렌더되지 않음');
  assert.ok(html.includes('iron_heart'), '시너지/진화 요구 아이콘 칩에 실제 id 훅이 없음');
  assert.ok(html.includes('무기'), '무기 섹션 제목이 없음');
  assert.ok(html.includes('장신구'), '장신구 섹션 제목이 없음');
  assert.ok(html.includes('state-synergy-active'), '활성 시너지 슬롯 상태가 카드에 반영되지 않음');
  assert.ok(linkedItemsSection.includes(accessory.name), '실제 연결 장신구가 상세 패널에 표시되지 않음');
  assert.equal(linkedItemsSection.includes(extraAccessory.name), false, '연결되지 않은 장신구가 상세 패널 연결 목록에 표시됨');
  assert.ok(html.includes('현재 상태'), '무기 상세 패널 현재 상태 제목이 없음');
  assert.ok(html.includes('Seeks the nearest enemy with a compact arcane bolt.'), '무기 상세 패널 요약이 설명 기반으로 렌더되지 않음');
  assert.equal(html.includes('현재 효과:'), false, '헤더 요약이 여전히 현재 효과 문구를 반복함');
  assert.equal(html.includes('역할 / 효과'), false, '중복 역할/효과 섹션이 여전히 남아 있음');
  assert.equal(html.includes('다음 안내'), false, '고정 안내 섹션이 여전히 남아 있음');
  assert.equal(html.includes('<h4 class="pv-loadout-section-title">레벨 진행</h4>'), false, '별도 레벨 진행 섹션이 여전히 남아 있음');

  const htmlWithAccessorySelected = api.renderPauseLoadoutPanel({
    items,
    selectedItemKey: accessoryItem.selectionKey,
    player,
    data,
    indexes,
  });
  const accessoryLinkedSection = extractSection(htmlWithAccessorySelected, 'pv-loadout-linked-items');

  assert.notEqual(html, htmlWithAccessorySelected, '선택 항목에 따라 패널 출력이 달라지지 않음');
  assert.ok(html.includes(weapon.name), '무기 선택 시 선택 항목 정보가 패널에 반영되지 않음');
  assert.ok(htmlWithAccessorySelected.includes(accessory.name), '장신구 선택 시 선택 항목 정보가 패널에 반영되지 않음');
  assert.ok(htmlWithAccessorySelected.includes('detail-kind-accessory'), '장신구 선택 accent 클래스가 상세 헤더에 없음');
  assert.ok(accessoryLinkedSection.includes(weapon.name), '연결된 무기가 장신구 상세 패널에 표시되지 않음');
  assert.equal(accessoryLinkedSection.includes(extraWeapon.name), false, '연결되지 않은 무기가 장신구 상세 패널 연결 목록에 표시됨');
  assert.ok(htmlWithAccessorySelected.includes('Keeps the caster alive longer and stabilizes sustain.'), '장신구 상세 패널 요약이 설명 기반으로 렌더되지 않음');
  assert.ok(htmlWithAccessorySelected.includes('현재 상태'), '장신구 상세 패널 현재 상태 제목이 없음');
  assert.ok(htmlWithAccessorySelected.includes('pv-loadout-evolution-result'), '진화 결과 아이콘/이름 행이 없음');
  assert.equal(htmlWithAccessorySelected.includes('무기/시너지와 맞물리는지 먼저 확인하세요.'), false, '중복 안내 문구가 여전히 남아 있음');

  const emptyPlayer = makePlayer({
    weapons: [],
    accessories: [],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
  });
  const emptyItems = api.buildPauseLoadoutItems({ player: emptyPlayer });
  const firstEmptyItem = emptyItems.find((item) => item.kind === 'empty');
  const emptyHtml = api.renderPauseLoadoutPanel({
    items: emptyItems,
    selectedItemKey: firstEmptyItem.selectionKey,
    player: emptyPlayer,
    data,
    indexes,
  });

  assert.equal(emptyHtml.includes('다음 안내'), false, '빈 슬롯 상세에도 고정 안내 섹션이 남아 있음');
  assert.ok(emptyHtml.includes('장비를 획득하면 연결 가능한 조합이 여기에 표시됩니다.'), '빈 슬롯 연결 섹션 안내가 더 구체적인 문구로 바뀌지 않음');
  assert.ok(emptyHtml.includes('현재 장비 조합으로 활성 가능한 시너지가 없습니다.'), '빈/비활성 시너지 안내 문구가 더 구체적이지 않음');
  assert.ok(emptyHtml.includes('이 장비는 현재 확인 가능한 진화 정보가 없습니다.'), '빈 슬롯 진화 안내 문구가 더 구체적이지 않음');
});

test('빈 슬롯 카드는 disabled가 아니어서 상세 확인용 선택이 가능하다', () => {
  const api = getPauseLoadoutContent();
  const data = {
    weaponData,
    accessoryData,
    synergyData: [],
    weaponEvolutionData: [],
  };
  const indexes = {
    weaponById: new Map(weaponData.map((item) => [item.id, item])),
    accessoryById: new Map(accessoryData.map((item) => [item.id, item])),
    synergiesByWeaponId: new Map(),
    synergiesByAccessoryId: new Map(),
  };
  const player = makePlayer({
    weapons: [makeWeapon({ id: 'magic_bolt', name: 'Magic Bolt', level: 1, maxLevel: 7 })],
    accessories: [],
    maxWeaponSlots: 3,
    maxAccessorySlots: 3,
  });
  const items = api.buildPauseLoadoutItems({ player });

  const html = api.renderPauseLoadoutPanel({
    items,
    selectedItemKey: 'weapon:0',
    player,
    data,
    indexes,
  });

  assert.equal(
    html.includes('data-loadout-key="empty:1"'),
    true,
    '빈 슬롯 카드가 렌더되지 않음',
  );
  assert.equal(
    html.includes('data-loadout-key="empty:1"\n      aria-pressed="false"\n      disabled'),
    false,
    '빈 슬롯 카드가 disabled 상태라 선택할 수 없음',
  );
});

summary();
