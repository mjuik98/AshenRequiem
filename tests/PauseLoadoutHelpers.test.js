import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makePlayer, makeWeapon } from './fixtures/index.js';

console.log('\n[PauseLoadoutHelpers]');

const { test, summary } = createRunner('PauseLoadoutHelpers');

let pauseLoadoutModel = null;
let pauseLoadoutSections = null;

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

test('pause loadout helper modules expose model and section contracts', () => {
  const model = getLoadoutModel();
  const sections = getLoadoutSections();

  assert.equal(typeof model.buildPauseLoadoutItems, 'function', 'buildPauseLoadoutItems가 model helper로 분리되지 않음');
  assert.equal(typeof model.getDefaultPauseSelection, 'function', 'getDefaultPauseSelection이 model helper로 분리되지 않음');
  assert.equal(typeof model.normalizePauseSynergyRequirementId, 'function', 'requirement 정규화 helper가 model helper로 분리되지 않음');
  assert.equal(typeof sections.renderPauseLoadoutPanel, 'function', 'renderPauseLoadoutPanel이 section helper로 분리되지 않음');
  assert.equal(typeof sections.renderPauseLoadoutDetail, 'function', 'detail 렌더 helper가 section helper에 없음');
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
