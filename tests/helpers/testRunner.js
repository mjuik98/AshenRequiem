/**
 * tests/helpers/testRunner.js — 공용 테스트 러너
 *
 * CHANGE: 팩토리 패턴으로 전환 + 하위 호환 유지
 *
 * Before (문제):
 *   모듈 레벨 _passed/_failed 상태.
 *   현재는 spawnSync로 파일별 독립 프로세스 실행이라 문제 없지만,
 *   향후 Node.js --test runner / Vitest 전환 시 같은 모듈 인스턴스를 공유하면
 *   카운터가 누적되어 잘못된 결과 보고.
 *
 * After (수정):
 *   createRunner() 팩토리가 독립적인 카운터를 가진 { test, summary } 를 반환.
 *   기존 코드와의 하위 호환을 위해 named export (test, summary, resetCounts) 유지.
 *   기존 import 문 변경 불필요:
 *     import { test, summary } from './helpers/testRunner.js';  ← 여전히 동작
 *
 * 신규 테스트에서는 createRunner() 사용을 권장:
 *   const { test, summary } = createRunner('SystemName');
 */

/**
 * 독립 테스트 러너 인스턴스를 생성한다.
 *
 * @param {string} [label='최종 결과']  summary() 출력 레이블
 * @returns {{ test: Function, summary: Function, resetCounts: Function }}
 */
export function createRunner(label = '최종 결과') {
  let _passed = 0;
  let _failed = 0;

  function test(name, fn) {
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

  function summary() {
    console.log(`\n${label}: ${_passed}개 통과, ${_failed}개 실패`);
    if (_failed > 0) process.exit(1);
  }

  function resetCounts() {
    _passed = 0;
    _failed = 0;
  }

  return { test, summary, resetCounts };
}

// ── 하위 호환: 기존 테스트 파일이 named export를 그대로 사용 가능 ──────────
// import { test, summary } from './helpers/testRunner.js'  ← 변경 없이 동작
const _default = createRunner();
export const test         = _default.test;
export const summary      = _default.summary;
export const resetCounts  = _default.resetCounts;
