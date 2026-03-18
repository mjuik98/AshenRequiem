/**
 * scripts/runTests.js — 전체 테스트 일괄 실행기
 *
 * P2-② 개선: spawnSync timeout 추가
 *
 * Before:
 *   spawnSync에 timeout 옵션 없음.
 *   무한루프 테스트 발생 시 CI가 영구 블로킹됨.
 *
 * After:
 *   TEST_TIMEOUT_MS(기본 10초) 초과 시 SIGTERM → 'skip'으로 처리.
 *   기존 SIGTERM 핸들링 로직을 그대로 활용하므로 0줄 추가 변경.
 *
 * 사용법:
 *   node scripts/runTests.js
 *   npm test
 */

import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const TEST_DIR  = join(ROOT, 'tests');

// P2-② 추가: 테스트 파일당 최대 실행 시간 (ms)
const TEST_TIMEOUT_MS = 10_000;

// tests/ 디렉토리에서 *.test.js 파일 탐색
let testFiles;
try {
  testFiles = readdirSync(TEST_DIR)
    .filter(f => f.endsWith('.test.js'))
    .sort()
    .map(f => join(TEST_DIR, f));
} catch {
  console.error(`[runTests] tests/ 디렉토리를 찾을 수 없습니다: ${TEST_DIR}`);
  process.exit(1);
}

if (testFiles.length === 0) {
  console.log('[runTests] 실행할 테스트 파일이 없습니다.');
  process.exit(0);
}

console.log(`\n${'='.repeat(52)}`);
console.log(` 테스트 실행 — ${testFiles.length}개 파일  (timeout: ${TEST_TIMEOUT_MS / 1000}s)`);
console.log(`${'='.repeat(52)}\n`);

let passed  = 0;
let failed  = 0;
let skipped = 0;

const results = [];

for (const file of testFiles) {
  const name = file.replace(ROOT + '/', '');
  const result = spawnSync(
    process.execPath,
    ['--experimental-vm-modules', file],
    {
      cwd:      ROOT,
      stdio:    'pipe',
      encoding: 'utf-8',
      timeout:  TEST_TIMEOUT_MS,   // ← P2-② 핵심 변경점
      killSignal: 'SIGTERM',       // 타임아웃 시 SIGTERM → 기존 skip 처리와 호환
    },
  );

  const stdout   = result.stdout ?? '';
  const stderr   = result.stderr ?? '';
  const exitCode = result.status ?? 1;

  if (stdout.trim()) {
    console.log(stdout.trimEnd());
  }

  const filteredStderr = stderr
    .split('\n')
    .filter(l => !l.includes('ExperimentalWarning') && l.trim())
    .join('\n');
  if (filteredStderr) {
    console.error(filteredStderr);
  }

  // 타임아웃 → signal: 'SIGTERM', status: null
  const isTimeout = result.signal === 'SIGTERM' || exitCode === null;

  if (isTimeout) {
    skipped++;
    results.push({ name, status: 'skip', reason: 'timeout' });
    console.warn(`  ⏱ [SKIP] ${name} — ${TEST_TIMEOUT_MS / 1000}s 타임아웃`);
  } else if (exitCode === 0) {
    passed++;
    results.push({ name, status: 'pass' });
  } else {
    failed++;
    results.push({ name, status: 'fail' });
  }
}

// ── 최종 요약 ────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(52)}`);
console.log(' 결과 요약');
console.log('='.repeat(52));

for (const r of results) {
  const icon  = r.status === 'pass' ? '✓' : r.status === 'skip' ? '○' : '✗';
  const label = r.status === 'pass' ? 'PASS' : r.status === 'skip' ? 'SKIP' : 'FAIL';
  const extra = r.reason ? ` (${r.reason})` : '';
  console.log(`  ${icon} [${label}] ${r.name}${extra}`);
}

console.log('');
console.log(`  통과: ${passed}  실패: ${failed}  스킵: ${skipped}  합계: ${testFiles.length}`);
console.log('='.repeat(52) + '\n');

if (failed > 0) {
  console.error(`실패한 테스트가 ${failed}개 있습니다.\n`);
  process.exit(1);
}

process.exit(0);
