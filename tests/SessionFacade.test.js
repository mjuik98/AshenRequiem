import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';

let setSessionStorage;
let resetSessionStorage;
let updateSessionOptionsAndSave;
let setSelectedStartWeaponAndSave;
let purchasePermanentUpgradeAndSave;

try {
  ({
    setSessionStorage,
    resetSessionStorage,
  } = await import('../src/state/createSessionState.js'));
  ({
    updateSessionOptionsAndSave,
    setSelectedStartWeaponAndSave,
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
