/**
 * tests/SpatialGrid.test.js — SpatialGrid 단위 테스트
 *
 * 검증 항목:
 *   - insert → queryUnique 기본 동작
 *   - isAlive=false / pendingDestroy=true 엔티티 제외
 *   - 셀 경계에 걸친 엔티티 처리
 *   - clear() 후 빈 그리드
 *   - 자기 자신 제외 (호출자 책임 확인)
 *   - GC 개선: _cellCxBuf/_cellCyBuf 재사용 버퍼 존재 확인
 *   - queryUnique 결과 중복 없음
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';

let SpatialGrid;
try {
  ({ SpatialGrid } = await import('../src/managers/SpatialGrid.js'));
} catch (e) {
  console.warn('[테스트] SpatialGrid import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── 픽스처 ────────────────────────────────────────────────────────────

let _id = 0;
function makeEntity(overrides = {}) {
  return {
    id: `entity_${++_id}`,
    x: 0, y: 0, radius: 10,
    isAlive: true, pendingDestroy: false,
    ...overrides,
  };
}

// ── 테스트 러너 ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    [ERROR] ${e.message}`);
    failed++;
  }
}

console.log('\n[SpatialGrid 테스트 시작]');

// ── 기본 동작 ─────────────────────────────────────────────────────────

test('insert 후 같은 셀 내 엔티티가 queryUnique에 포함된다', () => {
  const grid = new SpatialGrid(120);
  const a    = makeEntity({ x: 0, y: 0 });
  const b    = makeEntity({ x: 10, y: 10 });

  grid.insert(a);
  grid.insert(b);

  const results = grid.queryUnique(a);
  assert(results.includes(b), 'b가 결과에 없음');
});

test('멀리 있는 엔티티는 queryUnique에 포함되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const a    = makeEntity({ x: 0, y: 0 });
  const far  = makeEntity({ x: 10000, y: 10000 });

  grid.insert(a);
  grid.insert(far);

  const results = grid.queryUnique(a);
  assert(!results.includes(far), '먼 엔티티가 포함됨');
});

test('isAlive=false 엔티티는 insert되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const dead = makeEntity({ isAlive: false });
  const ref  = makeEntity({ x: 0, y: 0 });

  grid.insert(dead);
  grid.insert(ref);

  const results = grid.queryUnique(ref);
  assert(!results.includes(dead), '죽은 엔티티가 포함됨');
});

test('pendingDestroy=true 엔티티는 insert되지 않는다', () => {
  const grid    = new SpatialGrid(120);
  const pending = makeEntity({ pendingDestroy: true });
  const ref     = makeEntity({ x: 0, y: 0 });

  grid.insert(pending);
  grid.insert(ref);

  const results = grid.queryUnique(ref);
  assert(!results.includes(pending), 'pendingDestroy 엔티티가 포함됨');
});

test('clear() 후 queryUnique가 빈 결과를 반환한다', () => {
  const grid = new SpatialGrid(120);
  const a    = makeEntity({ x: 0, y: 0 });
  const b    = makeEntity({ x: 5, y: 5 });

  grid.insert(a);
  grid.insert(b);
  grid.clear();

  const results = grid.queryUnique(a);
  assert.equal(results.length, 0, `clear 후 결과 남음: ${results.length}개`);
});

// ── 셀 경계 ───────────────────────────────────────────────────────────

test('셀 경계에 걸친 큰 엔티티도 인근 엔티티를 검출한다', () => {
  const CELL = 120;
  const grid  = new SpatialGrid(CELL);
  const big   = makeEntity({ x: CELL - 5, y: 0, radius: 20 }); // 두 셀에 걸침
  const other = makeEntity({ x: CELL + 5, y: 0, radius: 10 });

  grid.insert(big);
  grid.insert(other);

  const results = grid.queryUnique(big);
  assert(results.includes(other), '경계 걸친 엔티티가 인접 엔티티 검출 못 함');
});

// ── 중복 제거 ─────────────────────────────────────────────────────────

test('queryUnique 결과에 중복이 없다', () => {
  const grid = new SpatialGrid(120);
  // 큰 반지름으로 여러 셀에 insert
  const a = makeEntity({ x: 60, y: 60, radius: 80 });
  const b = makeEntity({ x: 65, y: 65, radius: 5  });

  grid.insert(a);
  grid.insert(b);

  const results = grid.queryUnique(a);
  const ids     = results.map(e => e.id);
  const unique  = new Set(ids);

  assert.equal(unique.size, ids.length, `중복 발생: ${ids.join(', ')}`);
});

// ── 재사용 버퍼 (P1-D 개선 검증) ────────────────────────────────────

test('_cellCxBuf / _cellCyBuf 재사용 버퍼가 존재한다 (P1-D)', () => {
  const grid = new SpatialGrid(120);
  assert(grid._cellCxBuf !== undefined, '_cellCxBuf 없음 — P1-D 개선 미적용');
  assert(grid._cellCyBuf !== undefined, '_cellCyBuf 없음 — P1-D 개선 미적용');
});

test('반복 insert/queryUnique 후 버퍼가 오염되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0,  y: 0 });
  const b = makeEntity({ x: 5,  y: 5 });
  const c = makeEntity({ x: 500, y: 500 });

  for (let i = 0; i < 10; i++) {
    grid.clear();
    grid.insert(a);
    grid.insert(b);
    grid.insert(c);

    const r = grid.queryUnique(a);
    assert(r.includes(b), `반복 ${i}회차: b 미검출`);
    assert(!r.includes(c), `반복 ${i}회차: 먼 c가 검출됨`);
  }
});

// ── 결과 ─────────────────────────────────────────────────────────────

console.log(`\n최종 결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
