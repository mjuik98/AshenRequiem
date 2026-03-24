import assert from 'node:assert/strict';
import { CanvasRenderer } from '../src/renderer/CanvasRenderer.js';

function makeCtx() {
  const calls = [];
  const state = {
    canvas: { width: 1280, height: 720 },
    fillStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    lineWidth: 1,
  };
  const methods = new Set([
    'save', 'restore', 'beginPath', 'arc', 'fill', 'translate', 'rotate',
    'moveTo', 'lineTo', 'closePath', 'stroke', 'fillRect', 'clearRect', 'setTransform',
  ]);

  return {
    calls,
    ctx: new Proxy(state, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (methods.has(prop)) {
          return (...args) => calls.push({ fn: prop, args });
        }
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    }),
  };
}

const camera = { x: 0, y: 0 };

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('\n[CanvasRenderer]');

test('low quality에서도 ricochetProjectile은 원형 대신 전용 외형을 유지한다', () => {
  const { ctx, calls } = makeCtx();
  const renderer = new CanvasRenderer({ width: 1280, height: 720 }, ctx);

  renderer.drawProjectiles([{
    isAlive: true,
    behaviorId: 'ricochetProjectile',
    x: 120,
    y: 80,
    dirX: 1,
    dirY: 0,
    radius: 6,
    color: '#90caf9',
  }], camera, true);

  assert.equal(calls.some((call) => call.fn === 'translate'), true, 'low quality에서 ricochet 전용 draw가 호출되지 않음');
  assert.equal(calls.some((call) => call.fn === 'lineTo'), true, 'low quality에서 다이아 형태 경로가 유지되지 않음');
});
