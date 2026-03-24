import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[TestRunnerContract]');

const { test, summary } = createRunner('TestRunnerContract');
const runTestsSource = readProjectSource('../scripts/runTests.js');

test('createRunner.test returns a promise for async test bodies', async () => {
  const runner = createRunner('AsyncContract');
  const markers = [];

  const result = runner.test('async body', async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    markers.push('done');
  });

  markers.push('scheduled');
  assert.equal(typeof result?.then, 'function', 'async test는 await 가능한 promise를 반환해야 함');
  await result;
  assert.deepEqual(markers, ['scheduled', 'done']);
});

test('runTests script exposes a match/filter execution path for targeted debugging', () => {
  assert.equal(
    /--match|TEST_MATCH/.test(runTestsSource),
    true,
    'scripts/runTests.js에 테스트 필터 계약이 아직 없음',
  );
});

summary();
