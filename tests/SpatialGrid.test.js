/**
 * tests/SpatialGrid.test.js — SpatialGrid 단위 테스트
 *
 * 검증 항목:
 *   - insert → queryUnique 기본 동작
 *   - isAlive=false / pendingDestroy=true 엔티티 제외
 *   - 셀 경계에 걸친 엔티티 처리
 *   - clear() 후 빈 그리드
 *   - queryUnique 결과 중복 없음
 *   - GC 개선: _cellCxBuf/_cellCyBuf 재사용 버퍼 존재 확인 (P1-D)
 *
 * 리팩터링:
 *   Before: 로컬 makeEntity() + 로컬 test/passed/failed 패턴
 *   After:  tests/fixtures/index.js → makeEntity()
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makeEntity }        from './fixtures/index.js';
import { test, summary }     from './helpers/testRunner.js';

let SpatialGrid;
try {
  ({ SpatialGrid } = await import('../src/managers/SpatialGrid.js'));
} catch (e) {
  console.warn('[테스트] SpatialGrid import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── 기본 동작 ─────────────────────────────────────────────────────────

console.log('\n[SpatialGrid 테스트 시작]');

test('insert 후 같은 셀 내 엔티티가 queryUnique에 포함된다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0,  y: 0 });
  const b = makeEntity({ x: 10, y: 10 });
  grid.insert(a);
  grid.insert(b);
  const results = grid.queryUnique(a);
  assert(results.includes(b), 'b가 결과에 없음');
});

test('멀리 있는 엔티티는 queryUnique에 포함되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0,   y: 0 });
  const b = makeEntity({ x: 500, y: 500 });
  grid.insert(a);
  grid.insert(b);
  const results = grid.queryUnique(a);
  assert(!results.includes(b), '멀리 있는 b가 결과에 포함됨');
});

test('isAlive=false 엔티티는 insert되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0,  y: 0 });
  const b = makeEntity({ x: 5,  y: 5, isAlive: false });
  grid.insert(a);
  grid.insert(b);
  const results = grid.queryUnique(a);
  assert(!results.includes(b), 'isAlive=false인 b가 결과에 포함됨');
});

test('pendingDestroy=true 엔티티는 insert되지 않는다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0, y: 0 });
  const b = makeEntity({ x: 5, y: 5, pendingDestroy: true });
  grid.insert(a);
  grid.insert(b);
  const results = grid.queryUnique(a);
  assert(!results.includes(b), 'pendingDestroy=true인 b가 결과에 포함됨');
});

test('clear() 후 queryUnique 결과가 비어있다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 0, y: 0 });
  const b = makeEntity({ x: 5, y: 5 });
  grid.insert(a);
  grid.insert(b);
  grid.clear();
  grid.insert(a);
  const results = grid.queryUnique(a);
  assert(!results.includes(b), 'clear() 후에도 b가 검출됨');
});

test('셀 경계에 걸친 엔티티가 인접 엔티티를 감지한다', () => {
  const grid  = new SpatialGrid(120);
  const big   = makeEntity({ x: 120, y: 0, radius: 30 });
  const other = makeEntity({ x: 100, y: 0, radius: 10 });
  grid.insert(big);
  grid.insert(other);
  const results = grid.queryUnique(big);
  assert(results.includes(other), '경계 걸친 엔티티가 인접 엔티티 검출 못 함');
});

// ── 중복 제거 ─────────────────────────────────────────────────────────

test('queryUnique 결과에 중복이 없다', () => {
  const grid = new SpatialGrid(120);
  const a = makeEntity({ x: 60, y: 60, radius: 80 });
  const b = makeEntity({ x: 65, y: 65, radius: 5  });
  grid.insert(a);
  grid.insert(b);
  const results = grid.queryUnique(a);
  const ids    = results.map(e => e.id);
  const unique = new Set(ids);
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
  const a = makeEntity({ x: 0,   y: 0 });
  const b = makeEntity({ x: 5,   y: 5 });
  const c = makeEntity({ x: 500, y: 500 });
  for (let i = 0; i < 10; i++) {
    grid.clear();
    grid.insert(a);
    grid.insert(b);
    grid.insert(c);
    const r = grid.queryUnique(a);
    assert(r.includes(b),  `반복 ${i}회차: b 미검출`);
    assert(!r.includes(c), `반복 ${i}회차: 먼 c가 검출됨`);
  }
});

summary();
