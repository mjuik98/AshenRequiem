/**
 * SpatialGrid.js — 균일 격자 기반 Broad-Phase 충돌 보조
 *
 * 목적:
 *   CollisionSystem 의 투사체 vs 적 내부 루프가 O(n×m) 선형 탐색에서
 *   각 셀당 후보만 조회하는 O(n×k) (k = 평균 셀 밀도) 로 개선된다.
 *   적 100+, 투사체 50+ 상황에서 실질적인 체감 개선이 시작된다.
 *
 * 사용 방법:
 *   const grid = new SpatialGrid(128);  // 셀 크기(px) — 가장 큰 엔티티 지름의 2배 권장
 *
 *   // 매 프레임 충돌 판정 전 한 번만 호출
 *   grid.clear();
 *   for (const enemy of nearEnemies) grid.insert(enemy);
 *
 *   // 각 투사체에서 후보만 조회
 *   const candidates = grid.query(proj.x, proj.y, proj.radius + maxEnemyRadius);
 *   for (const e of candidates) { ... }
 *
 * 설계 결정:
 *   - 셀 맵은 `Map<key, entity[]>` — 희소 월드에서 빈 셀 메모리 낭비 없음
 *   - `_candidateSet` 로 동일 프레임 내 중복 후보 제거 (Set 재사용)
 *   - `insert` 는 엔티티의 bounding box 전체를 커버하는 셀들에 등록
 *     (radius > cellSize 인 보스도 올바르게 처리)
 *
 * 한계:
 *   - 동적 엔티티 전용 (매 프레임 clear + 재삽입)
 *   - 월드 좌표 범위에 제한 없음 (음수 좌표도 동작)
 */
export class SpatialGrid {
  /**
   * @param {number} cellSize - 셀 크기(px). 기본값 128.
   *   너무 작으면 삽입 비용 증가, 너무 크면 후보가 늘어 개선 효과 감소.
   *   경험치: 가장 큰 적 반지름의 2~3배가 적당.
   */
  constructor(cellSize = 128) {
    this._cellSize    = cellSize;
    /** @type {Map<number, object[]>} */
    this._cells       = new Map();
    /** @type {Set<object>} — query 시 중복 방지 재사용 Set */
    this._candidateSet = new Set();
  }

  // ── 내부 헬퍼 ────────────────────────────────────────────────

  /** 월드 좌표 → 셀 정수 좌표 */
  _cellCoord(v) { return Math.floor(v / this._cellSize); }

  /**
   * (cx, cy) 셀 좌표 쌍을 하나의 정수 키로 인코딩.
   * 32비트 범위(±2^15 셀 ≈ ±4백만 px @ cellSize=128)까지 무충돌 보장.
   */
  _key(cx, cy) { return (cx & 0xffff) | ((cy & 0xffff) << 16); }

  // ── 공개 API ─────────────────────────────────────────────────

  /** 그리드 초기화 — 매 프레임 충돌 판정 전에 한 번 호출 */
  clear() { this._cells.clear(); }

  /**
   * 엔티티를 그리드에 삽입.
   * 엔티티의 AABB(bounding box)를 커버하는 모든 셀에 참조를 등록.
   *
   * @param {{ x: number, y: number, radius: number }} entity
   */
  insert(entity) {
    const r   = entity.radius;
    const minCX = this._cellCoord(entity.x - r);
    const maxCX = this._cellCoord(entity.x + r);
    const minCY = this._cellCoord(entity.y - r);
    const maxCY = this._cellCoord(entity.y + r);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const key = this._key(cx, cy);
        let cell = this._cells.get(key);
        if (!cell) { cell = []; this._cells.set(key, cell); }
        cell.push(entity);
      }
    }
  }

  /**
   * 주어진 위치 + 범위(radius)와 겹치는 셀의 모든 후보를 반환.
   * 중복 없이 반환하기 위해 내부 Set 을 재사용 (GC 최소화).
   *
   * @param {number} x
   * @param {number} y
   * @param {number} radius - 조회 반경 (투사체 radius + 가장 큰 적 radius)
   * @returns {object[]} 중복 없는 후보 배열 (재사용 버퍼 — 호출 측에서 직접 수정 금지)
   */
  query(x, y, radius) {
    const minCX = this._cellCoord(x - radius);
    const maxCX = this._cellCoord(x + radius);
    const minCY = this._cellCoord(y - radius);
    const maxCY = this._cellCoord(y + radius);

    this._candidateSet.clear();
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this._cells.get(this._key(cx, cy));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) {
          this._candidateSet.add(cell[i]);
        }
      }
    }
    return this._candidateSet;
  }

  /** 현재 삽입된 총 엔티티 수 (디버그용, 중복 포함) */
  get insertedCount() {
    let n = 0;
    for (const cell of this._cells.values()) n += cell.length;
    return n;
  }
}
