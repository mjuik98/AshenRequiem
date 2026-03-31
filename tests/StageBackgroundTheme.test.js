import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[StageBackgroundTheme]');

const { test, summary } = createRunner('StageBackgroundTheme');

test('buildStageBackgroundTheme normalizes seamless tile defaults and clones layers', async () => {
  const { buildStageBackgroundTheme } = await import('../src/renderer/background/stageBackgroundTheme.js');

  const input = {
    mode: 'seamless_tile',
    tileSize: 1024,
    palette: {
      base: '#111111',
      crack: '#2b2b2b',
      ember: 'rgba(120,32,20,0.14)',
    },
    images: {
      baseSrc: '/assets/backgrounds/ashen-stone-floor-tile.png',
      overlaySrc: '/assets/backgrounds/spectral-cosmos-overlay-tile.png',
      overlayAlpha: 0.2,
    },
    layers: [{ id: 'ash', type: 'ash_drift', alpha: 0.24 }],
  };

  const theme = buildStageBackgroundTheme(input);

  assert.equal(theme.mode, 'seamless_tile');
  assert.equal(theme.tileSize, 1024);
  assert.equal(theme.palette.base, '#111111');
  assert.equal(theme.palette.crack, '#2b2b2b');
  assert.equal(theme.palette.ember, 'rgba(120,32,20,0.14)');
  assert.deepEqual(theme.images, {
    baseSrc: '/assets/backgrounds/ashen-stone-floor-tile.png',
    overlaySrc: '/assets/backgrounds/spectral-cosmos-overlay-tile.png',
    overlayAlpha: 0.2,
  });
  assert.notEqual(theme.images, input.images, 'images는 defensive copy여야 함');
  assert.deepEqual(theme.layers, [{ id: 'ash', type: 'ash_drift', alpha: 0.24 }]);
  assert.notEqual(theme.layers, input.layers, 'layers는 defensive copy여야 함');
});

test('buildStageBackgroundTheme falls back to legacy grid tokens when seamless tile data is omitted', async () => {
  const { buildStageBackgroundTheme } = await import('../src/renderer/background/stageBackgroundTheme.js');

  const theme = buildStageBackgroundTheme({
    fillStyle: '#0d1117',
    gridColor: 'rgba(255,255,255,0.04)',
    accentColor: 'rgba(199,163,93,0.06)',
  });

  assert.equal(theme.mode, 'legacy_grid');
  assert.equal(theme.tileSize, 512);
  assert.equal(theme.palette.base, '#0d1117');
  assert.equal(theme.palette.grid, 'rgba(255,255,255,0.04)');
  assert.equal(theme.palette.ember, 'rgba(199,163,93,0.06)');
});

summary();
