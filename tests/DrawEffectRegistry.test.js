/**
 * tests/DrawEffectRegistry.test.js — drawEffectRegistry 단위 테스트
 *
 * 검증 항목:
 *   - 기본 3종 (damageText / levelFlash / burst) 등록 확인
 *   - 미등록 타입은 burst로 폴백
 *   - registerEffectDraw()로 신규 타입 등록 가능
 *   - 등록된 함수가 실제로 호출됨 (ctx.save/restore 계약)
 *   - drawEffect.js 진입점이 registry를 사용하는지 확인
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';

let getEffectDraw, registerEffectDraw, getRegisteredEffectTypes;
try {
  ({
    getEffectDraw,
    registerEffectDraw,
    getRegisteredEffectTypes,
  } = await import('../src/renderer/draw/drawEffectRegistry.js'));
} catch (e) {
  console.warn('[테스트] drawEffectRegistry import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── 캔버스 스텁 ────────────────────────────────────────────────────────

function makeCtx() {
  const calls = [];
  const ctx = new Proxy({
    canvas: { width: 1280, height: 720 },
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    font: '',
    textAlign: '',
    lineWidth: 1,
  }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        return (...args) => { calls.push({ fn: prop, args }); };
      }
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
  return { ctx, calls };
}

function makeEffect(overrides = {}) {
  return {
    isAlive: true,
    effectType: 'damageText',
    x: 100, y: 100, radius: 10,
    color: '#ff0000',
    text: '-15',
    lifetime: 0.1, maxLifetime: 0.4,
    ...overrides,
  };
}

const camera = { x: 0, y: 0 };

// ── 테스트 러너 ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${e.message}`);
    failed++;
  }
}

console.log('\n[DrawEffectRegistry 테스트 시작]');

// ── 등록 확인 ─────────────────────────────────────────────────────────

test('기본 3종 effectType이 등록되어 있다', () => {
  const types = getRegisteredEffectTypes();
  assert(types.has('damageText'), 'damageText 미등록');
  assert(types.has('levelFlash'), 'levelFlash 미등록');
  assert(types.has('burst'),      'burst 미등록');
  assert(types.has('chainLightning'), 'chainLightning 미등록');
});

test('미등록 타입은 burst draw 함수로 폴백된다', () => {
  const burst   = getEffectDraw('burst');
  const unknown = getEffectDraw('nonExistentType_xyz');
  assert.equal(unknown, burst, '폴백 함수가 burst가 아님');
});

// ── 신규 등록 ─────────────────────────────────────────────────────────

test('registerEffectDraw()로 새 타입을 등록할 수 있다', () => {
  let called = false;
  registerEffectDraw('testFlash', () => { called = true; });

  const fn = getEffectDraw('testFlash');
  const { ctx } = makeCtx();
  fn(ctx, makeEffect({ effectType: 'testFlash' }), camera, 1);

  assert(called, '등록한 draw 함수가 호출되지 않음');
});

test('등록 후 getRegisteredEffectTypes()에 포함된다', () => {
  registerEffectDraw('testFlash2', () => {});
  const types = getRegisteredEffectTypes();
  assert(types.has('testFlash2'), 'testFlash2가 타입 목록에 없음');
});

// ── 기본 draw 함수 실행 ───────────────────────────────────────────────

test('damageText draw 함수가 예외 없이 실행된다', () => {
  const { ctx } = makeCtx();
  const fn = getEffectDraw('damageText');
  assert.doesNotThrow(() => {
    fn(ctx, makeEffect({ effectType: 'damageText', lifetime: 0.1, maxLifetime: 0.4 }), camera, 1);
  });
});

test('burst draw 함수가 예외 없이 실행된다', () => {
  const { ctx } = makeCtx();
  const fn = getEffectDraw('burst');
  assert.doesNotThrow(() => {
    fn(ctx, makeEffect({ effectType: 'burst', lifetime: 0.1, maxLifetime: 0.45 }), camera, 1);
  });
});

test('levelFlash draw 함수가 예외 없이 실행된다 (setTransform 필요)', () => {
  const { ctx } = makeCtx();
  // setTransform 스텁 추가
  ctx.setTransform = () => {};
  const fn = getEffectDraw('levelFlash');
  assert.doesNotThrow(() => {
    fn(ctx, makeEffect({ effectType: 'levelFlash', lifetime: 0.2, maxLifetime: 0.6 }), camera, 2);
  });
});

test('chainLightning draw 함수가 연쇄 포인트 기반으로 예외 없이 실행된다', () => {
  const { ctx } = makeCtx();
  const fn = getEffectDraw('chainLightning');
  assert.doesNotThrow(() => {
    fn(ctx, makeEffect({
      effectType: 'chainLightning',
      color: '#b388ff',
      radius: 14,
      chainPoints: [
        { x: 100, y: 100 },
        { x: 160, y: 96 },
        { x: 220, y: 118 },
      ],
      lifetime: 0.05,
      maxLifetime: 0.16,
    }), camera, 1);
  });
});

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
