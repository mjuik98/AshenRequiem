/**
 * src/managers/SpatialGrid.js
 *
 * ─── 개선 P1-D ────────────────────────────────────────────────────────
 * Before:
 *   _cellsOf()가 호출될 때마다 { cx, cy } 객체 배열을 새로 생성.
 *   매 프레임 삽입 엔티티 수 × 최대 4셀 = 수백 개 임시 객체 생성 → GC 압박.
 *
 * After:
 *   인스턴스 내부 _cellBuffer / _cellCxBuf / _cellCyBuf 재사용 배열 보유.
 *   _cellsOf() 대신 _fillCellBuffer()가 재사용 버퍼를 채우고 count 반환.
 *   queryUnique()와 동일한 GC-free 패턴 통일.
 * ──────────────────────────────────────────────────────────────────────
 */

export class SpatialGrid {
  /**
   * @param {number} [cellSize=120]  셀 크기(px). 가장 큰 엔티티 반지름 × 2 권장.
   */
  constructor(cellSize = 120) {
    this.cellSize = cellSize;

    /** @type {Map<number, object[]>} hash → 엔티티 목록 */
    this._cells = new Map();

    // PERF: queryUnique() 재사용 버퍼 (GC 방지)
    this._queryBuffer = [];
    this._seenIds     = new Set();

    // PERF(P1-D): _fillCellBuffer() 재사용 버퍼 — { cx, cy } 객체 할당 제거
    // 최대 4셀 점유 (엔티티가 4개 셀 경계에 걸칠 수 있음)
    this._cellCxBuf = new Int32Array(16);
    this._cellCyBuf = new Int32Array(16);
  }

  // ── 내부 유틸 ──────────────────────────────────────────────────────

  /** @private */
  _key(cx, cy) {
    const x = cx + 32768;
    const y = cy + 32768;
    return (x << 16) | (y & 0xFFFF);
  }

  /**
   * 엔티티가 점유하는 셀 좌표를 재사용 버퍼에 채우고 셀 수를 반환한다.
   * Before: _cellsOf() → 매 호출 { cx, cy }[] 새 배열 생성
   * After:  _fillCellBuffer() → _cellCxBuf/_cellCyBuf 재사용, count 반환
   *
   * @private
   * @param {object} entity  { x, y, radius }
   * @returns {number} 점유 셀 수
   */
  _fillCellBuffer(entity) {
    const r    = entity.radius ?? 8;
    const minX = Math.floor((entity.x - r) / this.cellSize);
    const maxX = Math.floor((entity.x + r) / this.cellSize);
    const minY = Math.floor((entity.y - r) / this.cellSize);
    const maxY = Math.floor((entity.y + r) / this.cellSize);

    let count = 0;
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        if (count < this._cellCxBuf.length) {
          this._cellCxBuf[count] = cx;
          this._cellCyBuf[count] = cy;
          count++;
        }
      }
    }
    return count;
  }

  // ── Public API ────────────────────────────────────────────────────

  /** 그리드를 초기화한다. 매 프레임 시작 시 호출. */
  clear() {
    this._cells.clear();
  }

  /**
   * 엔티티를 그리드에 삽입한다.
   * isAlive === false 또는 pendingDestroy === true 인 엔티티는 삽입하지 않는다.
   *
   * @param {object} entity  { x, y, radius, isAlive, pendingDestroy }
   */
  insert(entity) {
    if (!entity.isAlive || entity.pendingDestroy) return;

    const count = this._fillCellBuffer(entity);
    for (let i = 0; i < count; i++) {
      const key  = this._key(this._cellCxBuf[i], this._cellCyBuf[i]);
      let   cell = this._cells.get(key);
      if (!cell) {
        cell = [];
        this._cells.set(key, cell);
      }
      cell.push(entity);
    }
  }

  /**
   * 엔티티 주변의 후보 목록을 반환한다.
   * 자기 자신이 포함될 수 있으므로 호출 측에서 제외해야 한다.
   *
   * @param {object} entity
   * @returns {object[]}  중복이 있을 수 있음
   */
  query(entity) {
    const result = [];
    const count  = this._fillCellBuffer(entity);
    for (let i = 0; i < count; i++) {
      const cell = this._cells.get(this._key(this._cellCxBuf[i], this._cellCyBuf[i]));
      if (cell) {
        for (let j = 0; j < cell.length; j++) result.push(cell[j]);
      }
    }
    return result;
  }

  /**
   * 중복 없는 후보 목록을 반환한다.
   * PERF: 인스턴스의 재사용 버퍼(_queryBuffer)를 반환한다.
   *
   * @param {object} entity
   * @returns {object[]} 반환된 배열은 다음 queryUnique 호출까지만 유효하다.
   */
  queryUnique(entity) {
    this._queryBuffer.length = 0;
    this.forEachUnique(entity, (candidate) => {
      this._queryBuffer.push(candidate);
    });
    return this._queryBuffer;
  }

  /**
   * 중복 없는 후보를 callback으로 순회한다.
   * callback이 false를 반환하면 즉시 순회를 중단한다.
   *
   * @param {object} entity
   * @param {(candidate: object) => (void | boolean)} visit
   */
  forEachUnique(entity, visit) {
    this._seenIds.clear();

    const count = this._fillCellBuffer(entity);
    for (let i = 0; i < count; i++) {
      const cell = this._cells.get(this._key(this._cellCxBuf[i], this._cellCyBuf[i]));
      if (!cell) continue;
      for (let j = 0; j < cell.length; j++) {
        const candidate = cell[j];
        if (this._seenIds.has(candidate.id)) continue;
        this._seenIds.add(candidate.id);
        if (visit(candidate) === false) {
          return;
        }
      }
    }
  }

  /** 현재 점유된 셀 수를 반환한다. (디버그·프로파일링용) */
  get cellCount() {
    return this._cells.size;
  }

  /** 총 삽입된 엔티티-셀 매핑 수를 반환한다. (밀도 지표) */
  get entryCount() {
    let n = 0;
    for (const cell of this._cells.values()) n += cell.length;
    return n;
  }
}
