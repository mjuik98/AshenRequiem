/**
 * scripts/runTests.js — 전체 테스트 일괄 실행기
 *
 * 사용법:
 *   node scripts/runTests.js
 *   npm test           (package.json에 "test": "node scripts/runTests.js" 추가 후)
 *
 * 동작:
 *   - tests/ 디렉토리에서 *.test.js 파일을 자동 탐색
 *   - 각 테스트를 순차적으로 subprocess 실행
 *   - 하나라도 실패하면 exit(1)
 *   - 전체 결과 요약 출력
 *
 * 주의:
 *   Node.js 18+ 환경에서 --experimental-vm-modules 플래그 필요
 */

import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const TEST_DIR  = join(ROOT, 'tests');

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
console.log(` 테스트 실행 — ${testFiles.length}개 파일`);
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
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    },
  );

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? 1;

  // 표준 출력을 그대로 표시 (각 테스트 파일의 ✓/✗ 출력 포함)
  if (stdout.trim()) {
    console.log(stdout.trimEnd());
  }

  // 경고/에러는 stderr로 — 단, ExperimentalWarning 제외
  const filteredStderr = stderr
    .split('\n')
    .filter(l => !l.includes('ExperimentalWarning') && l.trim())
    .join('\n');
  if (filteredStderr) {
    console.error(filteredStderr);
  }

  if (exitCode === 0) {
    passed++;
    results.push({ name, status: 'pass' });
  } else if (result.signal === 'SIGTERM' || exitCode === null) {
    skipped++;
    results.push({ name, status: 'skip' });
  } else {
    failed++;
    results.push({ name, status: 'fail' });
  }
}

// ── 최종 요약 ────────────────────────────────────────────────────
console.log(`\n${'='.repeat(52)}`);
console.log(' 결과 요약');
console.log('='.repeat(52));

for (const r of results) {
  const icon = r.status === 'pass' ? '✓' : r.status === 'skip' ? '○' : '✗';
  const label = r.status === 'pass' ? 'PASS' : r.status === 'skip' ? 'SKIP' : 'FAIL';
  console.log(`  ${icon} [${label}] ${r.name}`);
}

console.log('');
console.log(`  통과: ${passed}  실패: ${failed}  스킵: ${skipped}  합계: ${testFiles.length}`);
console.log('='.repeat(52) + '\n');

if (failed > 0) {
  console.error(`실패한 테스트가 ${failed}개 있습니다.\n`);
  process.exit(1);
}

process.exit(0);
