import assert from 'node:assert/strict';

let createSceneNavigationGuard;

try {
  ({ createSceneNavigationGuard } = await import('../src/scenes/sceneNavigation.js'));
} catch (e) {
  console.warn('[테스트] sceneNavigation import 실패 — 스킵:', e.message);
  process.exit(1);
}

console.log('\n[SceneNavigation]');

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

await test('가드 실행 중에는 중복 navigation run을 막는다', async () => {
  const guard = createSceneNavigationGuard();
  guard.reset();

  let resolveFirst;
  const first = guard.run(async () => {
    await new Promise((resolve) => {
      resolveFirst = resolve;
    });
  });

  const second = await guard.run(async () => {});
  assert.equal(second, false, '진행 중인 전환이 있는데 두 번째 run이 허용됨');

  resolveFirst();
  await first;
});

await test('reset() 이후 이전 전환은 stale로 판정된다', async () => {
  const guard = createSceneNavigationGuard();
  guard.reset();

  let staleState = null;
  let release;
  const pending = guard.run(async ({ isStale }) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    staleState = isStale();
  });

  guard.reset();
  release();
  await pending;

  assert.equal(staleState, true, 'reset 후 이전 전환이 stale로 판정되지 않음');
});

await test('완료 후에는 다음 전환을 다시 허용한다', async () => {
  const guard = createSceneNavigationGuard();
  guard.reset();

  const first = await guard.run(async () => {});
  const second = await guard.run(async () => {});

  assert.equal(first, true);
  assert.equal(second, true);
});

await test('change()는 동기 씬 전환도 같은 guard 경계로 실행한다', async () => {
  const guard = createSceneNavigationGuard();
  guard.reset();

  let changed = false;
  const result = await guard.change(() => {
    changed = true;
  });

  assert.equal(result, true);
  assert.equal(changed, true);
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
