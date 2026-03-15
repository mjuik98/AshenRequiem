export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 30) {
    this._createFn  = createFn;
    this._resetFn   = resetFn;
    this._available = [];
    for (let i = 0; i < initialSize; i++) this._available.push(this._createFn());
  }

  acquire(config) {
    const obj = this._available.length > 0 ? this._available.pop() : this._createFn();
    this._resetFn(obj, config);
    return obj;
  }

  release(obj) { this._available.push(obj); }
  get available() { return this._available.length; }
  prewarm(count) { for (let i = 0; i < count; i++) this._available.push(this._createFn()); }
}
