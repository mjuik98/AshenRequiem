import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[StageBackgroundRenderer]');

const { test, summary } = createRunner('StageBackgroundRenderer');

function makeCtx() {
  const calls = [];
  const state = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
  };
  const methods = new Set([
    'save', 'restore', 'translate', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke',
  ]);

  return {
    calls,
    ctx: new Proxy(state, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (methods.has(prop)) return (...args) => calls.push({ fn: prop, args });
        return () => {};
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
    }),
  };
}

test('stage background renderer skips legacy-grid stages', async () => {
  const { createStageBackgroundRenderer } = await import('../src/renderer/background/createStageBackgroundRenderer.js');
  const { ctx, calls } = makeCtx();
  const renderer = createStageBackgroundRenderer();

  const drawn = renderer.draw(ctx, { x: 0, y: 0 }, {
    background: {
      fillStyle: '#0d1117',
    },
  }, { width: 800, height: 600 });

  assert.equal(drawn, false);
  assert.equal(calls.length, 0);
});

test('stage background renderer repeats seamless tiles using camera modulo offsets', async () => {
  const { createStageBackgroundRenderer } = await import('../src/renderer/background/createStageBackgroundRenderer.js');
  const { ctx, calls } = makeCtx();
  const renderer = createStageBackgroundRenderer();

  const drawn = renderer.draw(ctx, { x: 1550, y: 775 }, {
    background: {
      mode: 'seamless_tile',
      tileSize: 256,
      palette: {
        base: '#111111',
        stone: '#20242a',
        crack: '#2d333b',
        dust: 'rgba(255,255,255,0.04)',
        ember: 'rgba(120,32,20,0.14)',
      },
      layers: [{ id: 'ash', type: 'ash_drift', alpha: 0.2, drift: 0.08 }],
    },
  }, { width: 800, height: 600 });

  assert.equal(drawn, true);
  assert.equal(calls.some((call) => call.fn === 'translate'), true, 'camera offset translate가 호출되어야 함');
  assert.equal(calls.filter((call) => call.fn === 'fillRect').length >= 4, true, '반복 타일 fillRect가 여러 번 호출되어야 함');
});

summary();
