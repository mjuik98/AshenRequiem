import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';

let setSessionStorage;
let resetSessionStorage;
let updateSessionOptionsAndSave;
let setSelectedStartWeaponAndSave;
let setSelectedAscensionAndSave;
let setSelectedStartAccessoryAndSave;
let setSelectedArchetypeAndSave;
let setSelectedRiskRelicAndSave;
let setSelectedStageAndSave;
let setRunSeedSelectionAndSave;
let purchasePermanentUpgradeAndSave;

try {
  ({
    setSessionStorage,
    resetSessionStorage,
  } = await import('../src/state/createSessionState.js'));
  ({
    updateSessionOptionsAndSave,
    setSelectedStartWeaponAndSave,
    setSelectedAscensionAndSave,
    setSelectedStartAccessoryAndSave,
    setSelectedArchetypeAndSave,
    setSelectedRiskRelicAndSave,
    setSelectedStageAndSave,
    setRunSeedSelectionAndSave,
    purchasePermanentUpgradeAndSave,
  } = await import('../src/state/sessionFacade.js'));
} catch (e) {
  console.warn('[테스트] sessionFacade import 실패 — 스킵:', e.message);
  process.exit(1);
}

function makeMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

console.log('\n[SessionFacade]');

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
  } finally {
    resetSessionStorage();
  }
}

await test('updateSessionOptionsAndSave()는 옵션 병합 후 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    options: { quality: 'low', glowEnabled: true, soundEnabled: true },
  });
  const next = updateSessionOptionsAndSave(session, { quality: 'high', glowEnabled: false });

  assert.equal(next.quality, 'high');
  assert.equal(session.options.glowEnabled, false);
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"quality":"high"/);
});

await test('setSelectedStartWeaponAndSave()는 시작 무기를 기록하고 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt', 'boomerang'],
      selectedStartWeaponId: 'magic_bolt',
    },
  });
  const result = setSelectedStartWeaponAndSave(session, 'boomerang', {
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
      { id: 'boomerang', isEvolved: false },
    ],
  });

  assert.deepEqual(result, { saved: true, selectedWeaponId: 'boomerang' });
  assert.equal(session.meta.selectedStartWeaponId, 'boomerang');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedStartWeaponId":"boomerang"/);
});

await test('setSelectedStartWeaponAndSave()는 잠긴 시작 무기 선택을 공용 loadout 규칙으로 보정한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'magic_bolt',
    },
  });
  const result = setSelectedStartWeaponAndSave(session, 'fire_orb', {
    weaponData: [
      { id: 'magic_bolt', isEvolved: false },
      { id: 'fire_orb', isEvolved: false },
    ],
    unlockData: [
      { id: 'unlock_fire_orb', targetType: 'weapon', targetId: 'fire_orb' },
    ],
  });

  assert.deepEqual(result, { saved: true, selectedWeaponId: 'magic_bolt' });
  assert.equal(session.meta.selectedStartWeaponId, 'magic_bolt');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedStartWeaponId":"magic_bolt"/);
});

await test('setSelectedStartWeaponAndSave()는 시작 후보가 없으면 저장하지 않고 실패 결과를 반환한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    meta: {
      unlockedWeapons: ['magic_bolt'],
      selectedStartWeaponId: 'magic_bolt',
    },
  });
  const result = setSelectedStartWeaponAndSave(session, 'magic_bolt', {
    weaponData: [],
    unlockData: [],
  });

  assert.deepEqual(result, { saved: false, selectedWeaponId: 'magic_bolt' });
  assert.equal(session.meta.selectedStartWeaponId, 'magic_bolt');
  assert.equal(storage.getItem('ashenRequiem_session'), null);
});

await test('setSelectedAscensionAndSave()는 Ascension 선택을 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    meta: {
      selectedAscensionLevel: 0,
    },
  });
  const result = setSelectedAscensionAndSave(session, 3);

  assert.deepEqual(result, { saved: true, selectedAscensionLevel: 3 });
  assert.equal(session.meta.selectedAscensionLevel, 3);
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedAscensionLevel":3/);
});

await test('setSelectedStartAccessoryAndSave()는 시작 장신구 선택을 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    meta: {
      unlockedAccessories: ['ring_of_speed', 'iron_heart'],
      selectedStartAccessoryId: null,
    },
  });
  const result = setSelectedStartAccessoryAndSave(session, 'iron_heart', {
    accessoryData: [
      { id: 'ring_of_speed' },
      { id: 'iron_heart' },
    ],
  });

  assert.deepEqual(result, { saved: true, selectedStartAccessoryId: 'iron_heart' });
  assert.equal(session.meta.selectedStartAccessoryId, 'iron_heart');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedStartAccessoryId":"iron_heart"/);
});

await test('setSelectedArchetypeAndSave()와 setSelectedRiskRelicAndSave()는 새 로드아웃 선택을 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState();
  const archetype = setSelectedArchetypeAndSave(session, 'spellweaver', {
    archetypeData: [{ id: 'vanguard' }, { id: 'spellweaver' }],
  });
  const relic = setSelectedRiskRelicAndSave(session, 'glass_censer', {
    riskRelicData: [{ id: 'glass_censer' }, { id: 'blood_price' }],
  });

  assert.deepEqual(archetype, { saved: true, selectedArchetypeId: 'spellweaver' });
  assert.deepEqual(relic, { saved: true, selectedRiskRelicId: 'glass_censer' });
  assert.equal(session.meta.selectedArchetypeId, 'spellweaver');
  assert.equal(session.meta.selectedRiskRelicId, 'glass_censer');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedArchetypeId":"spellweaver"/);
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedRiskRelicId":"glass_censer"/);
});

await test('setSelectedStageAndSave()는 유효한 스테이지 선택을 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState();
  const result = setSelectedStageAndSave(session, 'ember_hollow', {
    stageData: [{ id: 'ash_plains' }, { id: 'ember_hollow' }],
  });

  assert.deepEqual(result, { saved: true, selectedStageId: 'ember_hollow' });
  assert.equal(session.meta.selectedStageId, 'ember_hollow');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedStageId":"ember_hollow"/);
});

await test('setRunSeedSelectionAndSave()는 custom/daily 시드 모드를 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState();
  const result = setRunSeedSelectionAndSave(session, {
    seedMode: 'custom',
    seedText: 'ashen-seed',
  });

  assert.deepEqual(result, { saved: true, selectedSeedMode: 'custom', selectedSeedText: 'ashen-seed' });
  assert.equal(session.meta.selectedSeedMode, 'custom');
  assert.equal(session.meta.selectedSeedText, 'ashen-seed');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedSeedMode":"custom"/);
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedSeedText":"ashen-seed"/);

  const daily = setRunSeedSelectionAndSave(session, {
    seedMode: 'daily',
  });
  assert.deepEqual(daily, { saved: true, selectedSeedMode: 'daily', selectedSeedText: '' });
  assert.equal(session.meta.selectedSeedMode, 'daily');
  assert.equal(session.meta.selectedSeedText, '');
});

await test('purchasePermanentUpgradeAndSave()는 성공 시에만 저장한다', async () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({ meta: { currency: 100, permanentUpgrades: {} } });
  const ok = purchasePermanentUpgradeAndSave(session, 'hp_boost', 30);

  assert.equal(ok, true);
  assert.equal(session.meta.currency, 70);
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"currency":70/);
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
