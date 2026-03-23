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
  setSelectedStartWeaponAndSave(session, 'boomerang');

  assert.equal(session.meta.selectedStartWeaponId, 'boomerang');
  assert.match(storage.getItem('ashenRequiem_session') ?? '', /"selectedStartWeaponId":"boomerang"/);
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
