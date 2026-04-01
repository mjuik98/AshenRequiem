import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[BackgroundAssetCleanup]');

const { test, summary } = createRunner('BackgroundAssetCleanup');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BACKGROUND_DIR = join(ROOT, 'public', 'assets', 'backgrounds');
const README_PATH = join(BACKGROUND_DIR, 'README.md');
const EXPECTED_PNGS = [
  'ash-plains-base-tile.png',
  'ash-plains-overlay-tile.png',
  'ember-hollow-base-tile.png',
  'ember-hollow-overlay-tile.png',
  'moon-crypt-base-tile.png',
  'moon-crypt-overlay-tile.png',
];
const LEGACY_ALIAS_PNGS = [
  'ashen-ritual-flagstone-tile.png',
  'ashen-ember-overlay-tile.png',
  'ashen-stone-floor-tile.png',
  'spectral-cosmos-overlay-tile.png',
  'moon-crypt-runestone-floor-tile.png',
  'moon-crypt-spectral-mist-overlay-tile.png',
];

test('background asset folder keeps only final base/overlay tile files', () => {
  const files = readdirSync(BACKGROUND_DIR).filter((file) => file.endsWith('.png')).sort();

  assert.deepEqual(files, EXPECTED_PNGS, 'background tile folder에 legacy alias PNG가 남아 있으면 안 됨');
});

test('background asset README documents only final tile names', () => {
  const readme = readFileSync(README_PATH, 'utf8');

  for (const fileName of EXPECTED_PNGS) {
    assert.equal(readme.includes(fileName), true, `README가 final background tile "${fileName}"를 안내하지 않음`);
  }

  for (const legacyName of LEGACY_ALIAS_PNGS) {
    assert.equal(readme.includes(legacyName), false, `README가 제거된 legacy alias "${legacyName}"를 여전히 안내함`);
  }
});

summary();
