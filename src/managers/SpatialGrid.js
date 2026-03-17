/**
 * SpatialGrid — 공간 분할 그리드 (충돌 최적화)
 *
 * WHY (P1-1):
 *   현재 CollisionSystem은 O(n²) 전수 순회로 충돌을 검사한다.
 *   적 100마리 + 투사체 200개 환경에서는 프레임당 20,000회 이상 거리 계산이 발생한다.
 *   SpatialGrid는 엔티티를 셀에 분류해 인근 셀만 검사하므로
 *   평균 복잡도를 O(n) 수준으로 낮춘다.
 *
 * 트리거 기준:
 *   - 적 스폰 수가 80개를 넘기 시작하거나
 *   - 실제 프레임 드랍이 관측될 때 CollisionSystem에 도입한다.
 *
 * 사용법 (CollisionSystem 내부):
 *
 *   const grid = new SpatialGrid(cellSize = 120);
 *
 *   // 매 프레임 시작 시
 *   grid.clear();
 *   for (const e of world.enemies)     grid.insert(e);
 *   for (const p of world.projectiles) grid.insert(p);
 *
 *   // 충돌 후보 조회
 *   for (const proj of world.projectiles) {
 *     const candidates = grid.query(proj);
 *     for (const enemy of candidates) {
 *       // 실제 거리 계산
 *     }
 *   }
 *
 * 계약:
 *   - 입력: 위치(x, y)와 반지름(radius)을 가진 엔티티 객체
 *   - 읽기: 엔티티 좌표
 *   - 쓰기: 내부 셀 맵만
 *   - 출력: 인근 셀의 엔티티 목록
 */

export class SpatialGrid {
  /**
   * @param {number} [cellSize=120]  셀 크기(px). 가장 큰 엔티티 반지름 × 2 권장.
   */
  constructor(cellSize = 120) {
    this.cellSize = cellSize;
    /** @type {Map<number, object[]>} hash → 엔티티 목록 */
    this._cells   = new Map();
    // PERF(P2): queryUnique() 시 사용할 재사용 버퍼 (GC 방지)
    this._queryBuffer = [];
    this._seenIds = new Set();
  }

  // ── 셀 키 계산 ──────────────────────────────────────────────

  /** @private */
  _key(cx, cy) {
    // 간단한 cantor pairing (음수 좌표 대응을 위해 오프셋 적용)
    const x = cx + 32768;
    const y = cy + 32768;
    return (x << 16) | (y & 0xFFFF);
  }

  /** 엔티티가 점유하는 셀 좌표 목록을 반환 */
  _cellsOf(entity) {
    const r    = entity.radius ?? 8;
    const minX = Math.floor((entity.x - r) / this.cellSize);
    const maxX = Math.floor((entity.x + r) / this.cellSize);
    const minY = Math.floor((entity.y - r) / this.cellSize);
    const maxY = Math.floor((entity.y + r) / this.cellSize);

    const result = [];
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        result.push({ cx, cy });
      }
    }
    return result;
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * 그리드를 초기화한다. 매 프레임 시작 시 호출.
   */
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

    for (const { cx, cy } of this._cellsOf(entity)) {
      const key = this._key(cx, cy);
      let cell = this._cells.get(key);
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
   * @returns {object[]}  중복이 있을 수 있음 — Set으로 처리 필요 시 queryUnique 사용
   */
  query(entity) {
    const result = [];
    for (const { cx, cy } of this._cellsOf(entity)) {
      const cell = this._cells.get(this._key(cx, cy));
      if (cell) {
        for (let i = 0; i < cell.length; i++) {
          result.push(cell[i]);
        }
      }
    }
    return result;
  }

  /**
   * 중복 없는 후보 목록을 반환한다.
   * PERF(P2): 임시 구조체(new Set, new Array) 대신 인스턴스의 재사용 버퍼(_queryBuffer)를 반환한다.
   *
   * @param {object} entity
   * @returns {object[]} 반환된 배열은 다음 queryUnique 호출까지만 유효하다.
   */
  queryUnique(entity) {
    this._seenIds.clear();
    this._queryBuffer.length = 0;

    for (const { cx, cy } of this._cellsOf(entity)) {
      const cell = this._cells.get(this._key(cx, cy));
      if (!cell) continue;
      for (let i = 0; i < cell.length; i++) {
        const e = cell[i];
        if (!this._seenIds.has(e.id)) {
          this._seenIds.add(e.id);
          this._queryBuffer.push(e);
        }
      }
    }
    return this._queryBuffer;
  }

  /**
   * 현재 점유된 셀 수를 반환한다. (디버그·프로파일링용)
   * @returns {number}
   */
  get cellCount() {
    return this._cells.size;
  }

  /**
   * 총 삽입된 엔티티-셀 매핑 수를 반환한다. (밀도 지표)
   * @returns {number}
   */
  get entryCount() {
    let n = 0;
    for (const cell of this._cells.values()) n += cell.length;
    return n;
  }
}
