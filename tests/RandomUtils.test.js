import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeRng } from './fixtures/index.js';
import { weightedPick } from '../src/utils/weightedPick.js';
import { ensureRng, nextFloat } from '../src/utils/random.js';

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

test('shared random helper는 함수형 RNG도 nextFloat 계약으로 감싼다', () => {
  const rng = ensureRng(() => 0.25);

  assert.equal(typeof rng.nextFloat, 'function', '함수형 RNG가 nextFloat contract로 정규화되지 않음');
  assert.equal(nextFloat(() => 0.25), 0.25, 'nextFloat가 함수형 RNG를 직접 지원하지 않음');
  assert.equal(rng.nextFloat(), 0.25, '정규화된 함수형 RNG가 값을 반환하지 않음');
});

summary();
