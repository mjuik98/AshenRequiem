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
  assert.equal(typeof sessionStorage.saveSession, 'function');
  assert.equal(typeof sessionStorage.loadSession, 'function');
  assert.equal(typeof sessionStorage.setSessionStorage, 'function');
  assert.equal(typeof sessionStorage.resetSessionStorage, 'function');
});

await test('세션 마이그레이션 모듈은 상태 정규화와 버전 상수를 노출한다', async () => {
  const sessionMigrations = await import('../src/state/session/sessionMigrations.js');
  assert.equal(typeof sessionMigrations.SESSION_VERSION, 'number');
  assert.equal(typeof sessionMigrations.createSessionState, 'function');
  assert.equal(typeof sessionMigrations.migrateSessionState, 'function');
  assert.equal(typeof sessionMigrations.normalizeSessionState, 'function');
});

await test('세션 명령 모듈은 런 결과와 메타 진행 갱신 함수를 노출한다', async () => {
  const sessionCommands = await import('../src/state/session/sessionCommands.js');
  assert.equal(typeof sessionCommands.updateSessionBest, 'function');
  assert.equal(typeof sessionCommands.earnCurrency, 'function');
  assert.equal(typeof sessionCommands.purchasePermanentUpgrade, 'function');
});

console.log(`\nSessionModules: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
