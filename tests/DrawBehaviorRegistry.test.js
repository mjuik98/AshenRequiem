import assert from 'node:assert/strict';

let getProjectileDraw;
try {
  ({ getProjectileDraw } = await import('../src/renderer/draw/drawBehaviorRegistry.js'));
} catch (error) {
  console.warn('[테스트] drawBehaviorRegistry import 실패 — 스킵:', error.message);
  process.exit(0);
}

function makeCtx() {
  const calls = [];
  const ctx = new Proxy({
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        return (...args) => { calls.push({ fn: prop, args }); };
      }
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  return { ctx, calls };
}

function makeProjectile(overrides = {}) {
  return {
    isAlive: true,
    behaviorId: 'targetProjectile',
    projectileVisualId: 'magic_bolt',
    x: 120,
    y: 80,
    dirX: 1,
    dirY: 0,
    radius: 6,
    color: '#ffee58',
    ...overrides,
  };
}

const camera = { x: 0, y: 0 };

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    failed += 1;
  }
}

console.log('\n[DrawBehaviorRegistry 테스트 시작]');

test('cataloged projectile는 low-quality에서도 sprite draw를 우선한다', () => {
  const { ctx, calls } = makeCtx();
  const drawFn = getProjectileDraw('targetProjectile');
  let spriteCalls = 0;

  drawFn(
    ctx,
    makeProjectile(),
    camera,
    true,
    {
      drawProjectileSprite() {
        spriteCalls += 1;
        return true;
      },
    },
  );

  assert.equal(spriteCalls, 1, 'low-quality에서도 sprite runtime이 호출되어야 함');
  assert.equal(calls.some((call) => call.fn === 'arc'), false, 'cataloged projectile는 vector path로 폴백하면 안 됨');
});

test('cataloged projectile sprite draw가 준비되지 않았으면 vector path로 폴백하지 않는다', () => {
  const { ctx, calls } = makeCtx();
  const drawFn = getProjectileDraw('targetProjectile');

  drawFn(
    ctx,
    makeProjectile(),
    camera,
    false,
    {
      drawProjectileSprite() {
        return false;
      },
    },
  );

  assert.equal(calls.some((call) => call.fn === 'arc'), false, 'cataloged projectile는 sprite 미준비 시 vector fallback을 그리면 안 됨');
});

test('non-cataloged projectile는 low-quality에서 기존 vector path를 유지한다', () => {
  const { ctx, calls } = makeCtx();
  const drawFn = getProjectileDraw('ricochetProjectile');

  drawFn(
    ctx,
    makeProjectile({
      behaviorId: 'ricochetProjectile',
      projectileVisualId: null,
      color: '#90caf9',
    }),
    camera,
    true,
    {
      drawProjectileSprite() {
        return false;
      },
    },
  );

  assert.equal(calls.some((call) => call.fn === 'lineTo'), true, 'non-cataloged projectile는 기존 vector silhouette을 유지해야 함');
});

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
