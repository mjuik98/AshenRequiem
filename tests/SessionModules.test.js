import assert from 'node:assert/strict';

console.log('\n[SessionModules]');

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
  }
}

await test('세션 저장소 모듈은 저장소 주입과 localStorage 접근 함수를 노출한다', async () => {
  const sessionStorage = await import('../src/state/session/sessionStorage.js');
  const browserSessionStorage = await import('../src/adapters/browser/session/sessionStorage.js');
  const sessionStorageDriver = await import('../src/state/session/sessionStorageDriver.js');
  const sessionStorageKeys = await import('../src/state/session/sessionStorageKeys.js');
  const sessionStateCodec = await import('../src/state/session/sessionStateCodec.js');
  const sessionRecoveryPolicy = await import('../src/state/session/sessionRecoveryPolicy.js');
  const browserSessionRecoveryPolicy = await import('../src/adapters/browser/session/sessionRecoveryPolicy.js');
  const browserSessionRepository = await import('../src/adapters/browser/session/sessionRepository.js');
  const browserSessionStorageDriver = await import('../src/adapters/browser/session/sessionStorageDriver.js');
  assert.equal(typeof sessionStorage.saveSession, 'function');
  assert.equal(typeof sessionStorage.loadSession, 'function');
  assert.equal(typeof sessionStorage.setSessionStorage, 'function');
  assert.equal(typeof sessionStorage.resetSessionStorage, 'function');
  assert.equal(sessionStorage.saveSession, browserSessionStorage.saveSession, 'state/sessionStorage wrapper가 browser owner saveSession을 재노출하지 않음');
  assert.equal(sessionStorage.loadSession, browserSessionStorage.loadSession, 'state/sessionStorage wrapper가 browser owner loadSession을 재노출하지 않음');
  assert.equal(sessionStorage.setSessionStorage, browserSessionStorage.setSessionStorage, 'state/sessionStorage wrapper가 browser owner setSessionStorage를 재노출하지 않음');
  assert.equal(sessionStorage.resetSessionStorage, browserSessionStorage.resetSessionStorage, 'state/sessionStorage wrapper가 browser owner resetSessionStorage를 재노출하지 않음');
  assert.equal(typeof sessionStorageKeys.SESSION_STORAGE_KEY, 'string');
  assert.equal(typeof sessionStorageKeys.buildSessionStorageKeys, 'function');
  assert.equal(typeof sessionStateCodec.serializeSessionState, 'function');
  assert.equal(typeof sessionStateCodec.parseSessionState, 'function');
  assert.equal(
    sessionStorageDriver.resolveSessionStorage,
    browserSessionStorageDriver.resolveSessionStorage,
    'state/sessionStorageDriver wrapper가 browser owner resolve helper를 재노출하지 않음',
  );
  assert.equal(typeof sessionRecoveryPolicy.inspectStoredSessionSnapshots, 'function');
  assert.equal(typeof sessionRecoveryPolicy.restoreStoredSessionSnapshot, 'function');
  assert.equal(
    sessionRecoveryPolicy.inspectStoredSessionSnapshots,
    browserSessionRecoveryPolicy.inspectStoredSessionSnapshots,
    'state/sessionRecoveryPolicy wrapper가 browser owner inspect helper를 재노출하지 않음',
  );
  assert.equal(
    sessionRecoveryPolicy.restoreStoredSessionSnapshot,
    browserSessionRecoveryPolicy.restoreStoredSessionSnapshot,
    'state/sessionRecoveryPolicy wrapper가 browser owner restore helper를 재노출하지 않음',
  );
  assert.equal(typeof browserSessionRepository.createLocalSessionRepository, 'function');
  assert.equal(typeof browserSessionStorageDriver.resolveSessionStorage, 'function');
});

await test('세션 마이그레이션 모듈은 상태 정규화와 버전 상수를 노출한다', async () => {
  const sessionMigrations = await import('../src/state/session/sessionMigrations.js');
  const sessionMigrationSteps = await import('../src/state/session/migrations/sessionMigrationSteps.js');
  assert.equal(typeof sessionMigrations.SESSION_VERSION, 'number');
  assert.equal(typeof sessionMigrations.createSessionState, 'function');
  assert.equal(typeof sessionMigrations.migrateSessionState, 'function');
  assert.equal(typeof sessionMigrations.normalizeSessionState, 'function');
  assert.equal(Array.isArray(sessionMigrationSteps.SESSION_MIGRATION_STEPS), true);
  assert.equal(sessionMigrationSteps.SESSION_MIGRATION_STEPS.length > 0, true, '세션 migration step registry가 비어 있음');
});

await test('세션 명령 모듈은 런 결과와 메타 진행 갱신 함수를 노출한다', async () => {
  const sessionCommands = await import('../src/state/session/sessionCommands.js');
  assert.equal(typeof sessionCommands.updateSessionBest, 'function');
  assert.equal(typeof sessionCommands.earnCurrency, 'function');
  assert.equal(typeof sessionCommands.purchasePermanentUpgrade, 'function');
});

console.log(`\nSessionModules: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
