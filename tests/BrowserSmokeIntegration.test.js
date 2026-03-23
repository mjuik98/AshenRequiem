import assert from 'node:assert/strict';

console.log('\n[BrowserSmokeIntegration]');

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

await test('preview 기반 smoke wrapper 모듈을 제공한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  assert.equal(typeof smokeWrapper.runSmokeAgainstPreview, 'function');
  assert.equal(typeof smokeWrapper.buildCommandInvocation, 'function');
});

await test('smoke wrapper는 Windows npm 실행을 shell 없이 cmd 경유로 정규화한다', async () => {
  const smokeWrapper = await import('../scripts/browser-smoke/runSmokeAgainstPreview.mjs');
  const invocation = smokeWrapper.buildCommandInvocation('npm.cmd', ['run', 'build'], {
    platform: 'win32',
    comspec: 'C:\\Windows\\System32\\cmd.exe',
  });

  assert.equal(invocation.command, 'C:\\Windows\\System32\\cmd.exe');
  assert.deepEqual(invocation.args.slice(0, 3), ['/d', '/s', '/c']);
  assert.equal(invocation.args[3].includes('npm.cmd run build'), true);
  assert.equal(invocation.shell, false);
});

await test('package.json은 smoke 실행과 전체 verify 스크립트를 노출한다', async () => {
  const pkg = await import('../package.json', { with: { type: 'json' } });
  assert.equal(typeof pkg.default.scripts['test:smoke'], 'string');
  assert.equal(typeof pkg.default.scripts.verify, 'string');
});

console.log(`\nBrowserSmokeIntegration: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
