/**
 * tests/helpers/testRunner.js — 공용 테스트 러너
 */
let _passed = 0;
let _failed = 0;

export function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    _passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${e.message}`);
    _failed++;
  }
}

export function summary(label = '최종 결과') {
  console.log(`\n${label}: ${_passed}개 통과, ${_failed}개 실패`);
  if (_failed > 0) process.exit(1);
}

export function resetCounts() {
  _passed = 0;
  _failed = 0;
}
