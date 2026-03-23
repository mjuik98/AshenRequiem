import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeWeapon } from './fixtures/index.js';

console.log('\n[PauseLoadoutHelpers]');

const { test, summary } = createRunner('PauseLoadoutHelpers');

let pauseLoadoutModel = null;
let pauseLoadoutSections = null;
let pauseLoadoutCards = null;
let pauseLoadoutDetailSections = null;
let pauseLoadoutMetaSections = null;
let pauseLoadoutStatsSections = null;
let pauseLinkedItemsSection = null;
let pauseSynergySection = null;
let pauseEvolutionSection = null;

try {
  pauseLoadoutModel = await import('../src/ui/pause/pauseLoadoutModel.js');
} catch (error) {
  pauseLoadoutModel = { error };
}

try {
  pauseLoadoutSections = await import('../src/ui/pause/pauseLoadoutSections.js');
} catch (error) {
  pauseLoadoutSections = { error };
}

try {
  pauseLoadoutCards = await import('../src/ui/pause/pauseLoadoutCards.js');
} catch (error) {
  pauseLoadoutCards = { error };
}

try {
  pauseLoadoutDetailSections = await import('../src/ui/pause/pauseLoadoutDetailSections.js');
} catch (error) {
  pauseLoadoutDetailSections = { error };
}

try {
  pauseLoadoutMetaSections = await import('../src/ui/pause/pauseLoadoutMetaSections.js');
} catch (error) {
  pauseLoadoutMetaSections = { error };
}

try {
  pauseLoadoutStatsSections = await import('../src/ui/pause/pauseLoadoutStatsSections.js');
} catch (error) {
  pauseLoadoutStatsSections = { error };
}

try {
  pauseLinkedItemsSection = await import('../src/ui/pause/pauseLinkedItemsSection.js');
} catch (error) {
  pauseLinkedItemsSection = { error };
}

try {
  pauseSynergySection = await import('../src/ui/pause/pauseSynergySection.js');
} catch (error) {
  pauseSynergySection = { error };
}

try {
  pauseEvolutionSection = await import('../src/ui/pause/pauseEvolutionSection.js');
} catch (error) {
  pauseEvolutionSection = { error };
}

function getLoadoutModel() {
  assert.ok(
    !pauseLoadoutModel.error,
    pauseLoadoutModel.error?.message ?? 'src/ui/pause/pauseLoadoutModel.js가 아직 없음',
  );
  return pauseLoadoutModel;
}

function getLoadoutSections() {
  assert.ok(
    !pauseLoadoutSections.error,
    pauseLoadoutSections.error?.message ?? 'src/ui/pause/pauseLoadoutSections.js가 아직 없음',
  );
  return pauseLoadoutSections;
}

function getLoadoutCards() {
  assert.ok(
    !pauseLoadoutCards.error,
    pauseLoadoutCards.error?.message ?? 'src/ui/pause/pauseLoadoutCards.js가 아직 없음',
  );
  return pauseLoadoutCards;
}

function getLoadoutDetailSections() {
  assert.ok(
    !pauseLoadoutDetailSections.error,
    pauseLoadoutDetailSections.error?.message ?? 'src/ui/pause/pauseLoadoutDetailSections.js가 아직 없음',
  );
  return pauseLoadoutDetailSections;
}

function getLoadoutMetaSections() {
  assert.ok(
    !pauseLoadoutMetaSections.error,
    pauseLoadoutMetaSections.error?.message ?? 'src/ui/pause/pauseLoadoutMetaSections.js가 아직 없음',
  );
  return pauseLoadoutMetaSections;
}

function getLoadoutStatsSections() {
  assert.ok(
    !pauseLoadoutStatsSections.error,
    pauseLoadoutStatsSections.error?.message ?? 'src/ui/pause/pauseLoadoutStatsSections.js가 아직 없음',
  );
  return pauseLoadoutStatsSections;
}

function getLinkedItemsSection() {
  assert.ok(
    !pauseLinkedItemsSection.error,
    pauseLinkedItemsSection.error?.message ?? 'src/ui/pause/pauseLinkedItemsSection.js가 아직 없음',
  );
  return pauseLinkedItemsSection;
}

function getSynergySection() {
  assert.ok(
    !pauseSynergySection.error,
    pauseSynergySection.error?.message ?? 'src/ui/pause/pauseSynergySection.js가 아직 없음',
  );
  return pauseSynergySection;
}

function getEvolutionSection() {
  assert.ok(
    !pauseEvolutionSection.error,
    pauseEvolutionSection.error?.message ?? 'src/ui/pause/pauseEvolutionSection.js가 아직 없음',
  );
  return pauseEvolutionSection;
}

test('pause loadout helper modules expose model and section contracts', () => {
  const model = getLoadoutModel();
  const sections = getLoadoutSections();
  const cards = getLoadoutCards();
  const detailSections = getLoadoutDetailSections();
  const metaSections = getLoadoutMetaSections();
  const statsSections = getLoadoutStatsSections();
  const linkedItemsSection = getLinkedItemsSection();
  const synergySection = getSynergySection();
  const evolutionSection = getEvolutionSection();

  assert.equal(typeof model.buildPauseLoadoutItems, 'function', 'buildPauseLoadoutItems가 model helper로 분리되지 않음');
  assert.equal(typeof model.getDefaultPauseSelection, 'function', 'getDefaultPauseSelection이 model helper로 분리되지 않음');
  assert.equal(typeof model.normalizePauseSynergyRequirementId, 'function', 'requirement 정규화 helper가 model helper로 분리되지 않음');
  assert.equal(typeof sections.renderPauseLoadoutPanel, 'function', 'renderPauseLoadoutPanel이 section helper로 분리되지 않음');
  assert.equal(typeof sections.renderPauseLoadoutDetail, 'function', 'detail 렌더 helper가 section helper에 없음');
  assert.equal(typeof cards.renderPauseSlotCard, 'function', 'slot card 렌더가 별도 helper로 분리되지 않음');
  assert.equal(typeof cards.renderPauseLoadoutGrid, 'function', 'grid 렌더가 별도 helper로 분리되지 않음');
  assert.equal(typeof detailSections.renderPauseLoadoutDetail, 'function', 'detail 오케스트레이터가 section helper에 없음');
  assert.equal(typeof metaSections.renderPauseLinkedItemsSection, 'function', 'linked item 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof metaSections.renderPauseSynergySection, 'function', 'synergy 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof metaSections.renderPauseEvolutionSection, 'function', 'evolution 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof linkedItemsSection.renderPauseLinkedItemsSection, 'function', 'linked item 단일 helper가 없음');
  assert.equal(typeof synergySection.renderPauseSynergySection, 'function', 'synergy 단일 helper가 없음');
  assert.equal(typeof evolutionSection.renderPauseEvolutionSection, 'function', 'evolution 단일 helper가 없음');
  assert.equal(typeof statsSections.renderPauseStatusBlock, 'function', 'status 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof statsSections.renderPauseLoadoutDetailHeader, 'function', 'detail header 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof statsSections.renderPauseWeaponStatsSection, 'function', 'weapon stats 섹션이 별도 helper로 분리되지 않음');
  assert.equal(typeof statsSections.renderPauseAccessoryStatsSection, 'function', 'accessory stats 섹션이 별도 helper로 분리되지 않음');
});

test('pause loadout model helper builds deterministic selection keys', () => {
  const model = getLoadoutModel();
  const player = makePlayer({
    weapons: [makeWeapon({ id: 'magic_bolt', name: 'Magic Bolt' })],
    accessories: [{ id: 'iron_heart', name: 'Iron Heart', level: 1, maxLevel: 5 }],
    maxWeaponSlots: 2,
    maxAccessorySlots: 2,
  });

  const items = model.buildPauseLoadoutItems({ player });
  const selection = model.getDefaultPauseSelection({ player });

  assert.equal(items.length >= 4, true);
  assert.equal(typeof selection?.selectionKey, 'string');
  assert.equal(selection?.selectionKey, items[0]?.selectionKey);
});

summary();
