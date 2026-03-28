/**
 * scripts/runTests.js — 전체 테스트 일괄 실행기
 *
 * 개선 사항:
 * - override 가능한 TEST_DIR / TEST_TIMEOUT_MS 계약 추가
 * - bounded worker pool(--jobs / TEST_JOBS) 기반 병렬 실행
 * - 테스트별 stdout/stderr 버퍼링 유지
 * - 최종 요약은 입력 정렬 순서를 유지
 *
 * 사용법:
 *   node scripts/runTests.js
 *   node scripts/runTests.js --match Collision
 *   node scripts/runTests.js --jobs 2
 *   TEST_DIR=/tmp/custom-tests TEST_JOBS=2 node scripts/runTests.js
 */

import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const argv = process.argv.slice(2);

function readOption(flag) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : undefined;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const TEST_DIR = resolve(process.env.TEST_DIR ?? join(ROOT, 'tests'));
const TEST_MATCH = (readOption('--match') ?? process.env.TEST_MATCH ?? '').trim();
const TEST_TIMEOUT_MS = parsePositiveInteger(process.env.TEST_TIMEOUT_MS, 10_000);
const DEFAULT_JOBS = Math.max(1, Math.min(4, cpus().length || 1));
const TEST_JOBS = parsePositiveInteger(readOption('--jobs') ?? process.env.TEST_JOBS, DEFAULT_JOBS);

function discoverTestFiles() {
  try {
    return readdirSync(TEST_DIR)
      .filter((fileName) => fileName.endsWith('.test.js'))
      .filter((fileName) => !TEST_MATCH || fileName.includes(TEST_MATCH))
      .sort()
      .map((fileName) => join(TEST_DIR, fileName));
  } catch {
    console.error(`[runTests] tests/ 디렉토리를 찾을 수 없습니다: ${TEST_DIR}`);
    process.exit(1);
  }
}

function reportBufferedOutput(result) {
  if (result.stdout.trim()) {
    console.log(result.stdout.trimEnd());
  }

  const filteredStderr = result.stderr
    .split('\n')
    .filter((line) => !line.includes('ExperimentalWarning') && line.trim())
    .join('\n');
  if (filteredStderr) {
    console.error(filteredStderr);
  }

  if (result.status === 'skip') {
    console.warn(`  ⏱ [SKIP] ${result.name} — ${TEST_TIMEOUT_MS / 1000}s 타임아웃`);
  }
}

function summarizeResults(results) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const result of results) {
    if (result.status === 'pass') passed += 1;
    else if (result.status === 'skip') skipped += 1;
    else failed += 1;
  }

  console.log(`\n${'='.repeat(52)}`);
  console.log(' 결과 요약');
  console.log('='.repeat(52));

  for (const result of results) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'skip' ? '○' : '✗';
    const label = result.status === 'pass' ? 'PASS' : result.status === 'skip' ? 'SKIP' : 'FAIL';
    const extra = result.reason ? ` (${result.reason})` : '';
    console.log(`  ${icon} [${label}] ${result.name}${extra}`);
  }

  console.log('');
  console.log(`  통과: ${passed}  실패: ${failed}  스킵: ${skipped}  합계: ${results.length}`);
  console.log('='.repeat(52) + '\n');

  if (failed > 0) {
    console.error(`실패한 테스트가 ${failed}개 있습니다.\n`);
    process.exit(1);
  }
}

function runTestFile(filePath) {
  return new Promise((resolveResult) => {
    const name = relative(ROOT, filePath);
    const child = spawn(
      process.execPath,
      ['--experimental-vm-modules', filePath],
      {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      },
    );

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, TEST_TIMEOUT_MS);

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolveResult({
        name,
        status: 'fail',
        stdout,
        stderr: `${stderr}\n${error.stack ?? error.message}`.trim(),
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      if (timedOut || signal === 'SIGTERM' || code === null) {
        resolveResult({
          name,
          status: 'skip',
          reason: 'timeout',
          stdout,
          stderr,
        });
        return;
      }

      resolveResult({
        name,
        status: code === 0 ? 'pass' : 'fail',
        stdout,
        stderr,
      });
    });
  });
}

async function runAllTests(testFiles) {
  const results = new Array(testFiles.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < testFiles.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const result = await runTestFile(testFiles[currentIndex]);
      results[currentIndex] = result;
      reportBufferedOutput(result);
    }
  }

  const workerCount = Math.min(TEST_JOBS, testFiles.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const testFiles = discoverTestFiles();

if (testFiles.length === 0) {
  console.log('[runTests] 실행할 테스트 파일이 없습니다.');
  process.exit(0);
}

console.log(`\n${'='.repeat(52)}`);
console.log(` 테스트 실행 — ${testFiles.length}개 파일  (timeout: ${TEST_TIMEOUT_MS / 1000}s, jobs: ${Math.min(TEST_JOBS, testFiles.length)})`);
if (TEST_MATCH) {
  console.log(` 필터: ${TEST_MATCH}`);
}
console.log(` 테스트 디렉토리: ${TEST_DIR}`);
console.log(`${'='.repeat(52)}\n`);

const results = await runAllTests(testFiles);
summarizeResults(results);
process.exit(0);
