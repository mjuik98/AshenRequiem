import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeRng } from './fixtures/index.js';
import { weightedPick } from '../src/utils/weightedPick.js';

console.log('\n[RandomUtils]');

const { test, summary } = createRunner('RandomUtils');

test('weightedPick는 주입된 rng를 사용해 가중 선택을 수행한다', () => {
  const rng = makeRng([0.99]);
  const picked = weightedPick([
    { id: 'low', weight: 1 },
    { id: 'high', weight: 3 },
  ], rng);

  assert.ok(rng.calls > 0, 'weightedPick가 주입된 rng를 사용하지 않음');
  assert.equal(picked.id, 'high');
});

summary();
