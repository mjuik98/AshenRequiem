/**
 * SpatialGrid — 공간 분할 해시 그리드
 *
 * WHY(P2): CollisionSystem의 O(n²) 브루트 포스를 개선한다.
 *   적 200+, 투사체 100+ 상황에서 프레임당 충돌 체크가
 *   20,000회 이상 발생하는 것을 인접 셀 기반 ~500회로 줄인다.
 *
 * 사용 방법:
 *
 *   // CollisionSystem.js 상단에 import
 *   import { SpatialGrid } from '../../utils/SpatialGrid.js';
 *
 *   // 모듈 레벨 (싱글톤처럼 재사용)
 *   const _grid = new SpatialGrid(64); // cellSize = 최대 충돌 반경 × 2
 *
 *   // update() 내부
 *   _grid.clear();
 *   for (const e of enemies) {
 *     if (e.isAlive && !e.pendingDestroy) _grid.insert(e);
 *   }
 *
 *   for (const p of projectiles) {
 *     if (!p.isAlive || p.pendingDestroy || p.ownerId !== player.id) continue;
 *     const candidates = _grid.queryRadius(p.x, p.y, p.radius + MAX_ENEMY_RADIUS);
 *     for (const e of candidates) { ... }
 *   }
 *
 * 권장 cellSize:
 *   - 최대 적 radius가 32px이면 cellSize = 64
 *   - 보스 radius가 80px이면 cellSize = 100 이상으로 조정
 */
export class SpatialGrid {
  /**
   * @param {number} cellSize  격자 한 칸의 크기 (px). 최대 충돌 반경 × 2 이상 권장.
   */
  constructor(cellSize = 64) {
    this._cellSize = cellSize;
    /** @type {Map<string, object[]>} */
    this._grid = new Map();
  }

  /** 격자 키 반환 */
  _key(cx, cy) {
    return `${cx},${cy}`;
  }

  /** 좌표 → 셀 인덱스 */
  _cellOf(x, y) {
    return {
      cx: Math.floor(x / this._cellSize),
      cy: Math.floor(y / this._cellSize),
    };
  }

  /** 그리드를 비운다. 매 프레임 시작 시 호출. */
  clear() {
    this._grid.clear();
  }

  /**
   * 엔티티를 그리드에 삽입한다.
   * @param {{x: number, y: number}} entity
   */
  insert(entity) {
    const { cx, cy } = this._cellOf(entity.x, entity.y);
    const key = this._key(cx, cy);
    let cell = this._grid.get(key);
    if (!cell) {
      cell = [];
      this._grid.set(key, cell);
    }
    cell.push(entity);
  }

  /**
   * 원형 범위 내 후보 엔티티를 반환한다. (중복 포함 가능 — 호출자가 실제 거리 검사)
   * @param {number} x
   * @param {number} y
   * @param {number} radius  검색 반경 (px)
   * @returns {object[]}
   */
  queryRadius(x, y, radius) {
    const cs   = this._cellSize;
    const minCX = Math.floor((x - radius) / cs);
    const maxCX = Math.floor((x + radius) / cs);
    const minCY = Math.floor((y - radius) / cs);
    const maxCY = Math.floor((y + radius) / cs);

    const results = [];
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this._grid.get(this._key(cx, cy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) results.push(cell[i]);
        }
      }
    }
    return results;
  }

  /**
   * 단일 점 주변 인접 9셀 엔티티를 반환한다. (queryRadius보다 빠름)
   * @param {number} x
   * @param {number} y
   * @returns {object[]}
   */
  queryNeighbors(x, y) {
    const { cx, cy } = this._cellOf(x, y);
    const results = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this._grid.get(this._key(cx + dx, cy + dy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) results.push(cell[i]);
        }
      }
    }
    return results;
  }

  /** 디버그용: 현재 점유 셀 수 반환 */
  get cellCount() {
    return this._grid.size;
  }

  /** 디버그용: 전체 삽입 엔티티 수 반환 */
  get entityCount() {
    let n = 0;
    for (const cell of this._grid.values()) n += cell.length;
    return n;
  }
}
