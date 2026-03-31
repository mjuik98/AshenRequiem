import assert from 'node:assert/strict';
import { CanvasRenderer } from '../src/renderer/CanvasRenderer.js';

function makeCtx() {
  const calls = [];
  const state = {
    canvas: { width: 1280, height: 720 },
    fillStyle: '',
    strokeStyle: '',
    shadowColor: '',
    shadowBlur: 0,
    globalAlpha: 1,
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
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
          return () => ({ addColorStop() {} });
        }
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

test('drawBackground는 seamless background runtime이 처리하면 legacy grid fallback을 건너뛴다', () => {
  const { ctx, calls } = makeCtx();
  const runtimeCalls = { draw: 0 };
  const renderer = new CanvasRenderer({ width: 1280, height: 720 }, ctx, {
    backgroundRenderer: {
      draw(...args) {
        runtimeCalls.draw += 1;
        calls.push({ fn: 'runtimeDraw', args });
        return true;
      },
    },
  });

  renderer.drawBackground({ x: 64, y: 96 }, {
    background: { mode: 'seamless_tile', tileSize: 1024, palette: { base: '#111111', ember: 'rgba(0,0,0,0)' } },
  });

  assert.equal(runtimeCalls.draw, 1);
  assert.equal(calls.some((call) => call.fn === 'runtimeDraw'), true);
  assert.equal(calls.some((call) => call.fn === 'stroke'), false, 'runtime이 처리한 경우 legacy grid stroke가 나오면 안 됨');
});

test('drawBackground는 seamless runtime이 처리하지 않으면 legacy grid fallback을 유지한다', () => {
  const { ctx, calls } = makeCtx();
  const runtimeCalls = { draw: 0 };
  const renderer = new CanvasRenderer({ width: 1280, height: 720 }, ctx, {
    backgroundRenderer: {
      draw() {
        runtimeCalls.draw += 1;
        return false;
      },
    },
  });

  renderer.drawBackground({ x: 64, y: 96 }, {
    background: { fillStyle: '#0d1117', gridColor: 'rgba(255,255,255,0.04)', accentColor: 'rgba(199,163,93,0.06)' },
  });

  assert.equal(runtimeCalls.draw, 1);
  assert.equal(calls.some((call) => call.fn === 'stroke'), true, 'fallback legacy grid stroke가 유지되어야 함');
});
