/**
 * ObjectPool — 범용 오브젝트 풀
 *
 * GC 부담을 줄이기 위해 투사체·이펙트 등 짧은 수명의 오브젝트를 재사용한다.
 *
 * @param {function}  createFn   — 풀이 비었을 때 새 오브젝트를 만드는 팩토리 함수
 * @param {function}  resetFn    — acquire 시 오브젝트를 초기화하는 함수 (obj, config) => void
 * @param {number}    initialSize — 풀 초기 오브젝트 수
 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 30) {
    this._createFn = createFn;
    this._resetFn = resetFn;
    this._available = [];

    for (let i = 0; i < initialSize; i++) {
      this._available.push(this._createFn());
    }
  }

  /**
   * 풀에서 오브젝트를 꺼내 초기화 후 반환
   * @param {object} config
   */
  acquire(config) {
    const obj = this._available.length > 0
      ? this._available.pop()
      : this._createFn();
    this._resetFn(obj, config);
    return obj;
  }

  /**
   * 사용 완료된 오브젝트를 풀에 반납
   * @param {object} obj
   */
  release(obj) {
    this._available.push(obj);
  }

  /** 현재 풀에 대기 중인 오브젝트 수 */
  get available() {
    return this._available.length;
  }

  /** 풀을 추가로 예열 */
  prewarm(count) {
    for (let i = 0; i < count; i++) {
      this._available.push(this._createFn());
    }
  }
}
