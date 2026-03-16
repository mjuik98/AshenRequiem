/** ObjectPool — 오브젝트 재사용 풀 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 30) {
    this._createFn  = createFn;
    this._resetFn   = resetFn;
    this._available = [];
    for (let i = 0; i < initialSize; i++) {
      this._available.push(this._createFn());
    }
  }

  /** 풀에서 오브젝트 취득 후 config로 초기화 */
  acquire(config) {
    const obj = this._available.length > 0
      ? this._available.pop()
      : this._createFn();
    this._resetFn(obj, config);
    return obj;
  }

  /** 오브젝트 반환 */
  release(obj) { this._available.push(obj); }

  get available() { return this._available.length; }

  /** 풀 사이즈 사전 확보 */
  prewarm(count) {
    for (let i = 0; i < count; i++) this._available.push(this._createFn());
  }
}
