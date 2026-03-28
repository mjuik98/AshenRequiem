import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[TestRunnerContract]');

const { test, summary } = createRunner('TestRunnerContract');
const runTestsSource = readProjectSource('../scripts/runTests.js');
const repoRoot = new URL('..', import.meta.url);

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

test('runTests script exposes worker-count and overrideable test-dir contracts for fast targeted runs', () => {
  assert.equal(/--jobs|TEST_JOBS/.test(runTestsSource), true, 'scripts/runTests.js에 병렬 worker 계약이 아직 없음');
  assert.equal(/TEST_DIR/.test(runTestsSource), true, 'scripts/runTests.js에 override 가능한 테스트 디렉토리 계약이 아직 없음');
});

test('runTests can execute an override test directory with bounded worker count while preserving summary order', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'ashen-run-tests-'));
  try {
    writeFileSync(join(tempDir, 'a.contract_jobs.test.js'), "console.log('temp-a');\n");
    writeFileSync(join(tempDir, 'b.contract_jobs.test.js'), "console.log('temp-b');\n");

    const result = spawnSync(
      process.execPath,
      ['scripts/runTests.js', '--jobs', '2', '--match', 'contract_jobs'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          TEST_DIR: tempDir,
          TEST_TIMEOUT_MS: '1000',
        },
      },
    );

    assert.equal(result.status, 0, `override test dir run failed: ${result.stderr}`);
    assert.equal(result.stdout.includes('a.contract_jobs.test.js'), true, 'override test dir의 첫 테스트가 실행되지 않음');
    assert.equal(result.stdout.includes('b.contract_jobs.test.js'), true, 'override test dir의 두 번째 테스트가 실행되지 않음');

    const summaryA = result.stdout.indexOf('a.contract_jobs.test.js');
    const summaryB = result.stdout.indexOf('b.contract_jobs.test.js');
    assert.equal(summaryA >= 0 && summaryB >= 0 && summaryA < summaryB, true, '결과 요약 순서가 입력 정렬 순서를 유지하지 않음');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

summary();
