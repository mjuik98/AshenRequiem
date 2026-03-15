/**
 * SceneManager — 씬 전환 관리
 */
export class SceneManager {
  constructor() {
    this._current = null;
  }

  changeScene(newScene) {
    if (this._current?.exit) this._current.exit();
    this._current = newScene;
    if (this._current?.enter) this._current.enter();
  }

  update(dt) {
    if (this._current?.update) this._current.update(dt);
  }

  render() {
    if (this._current?.render) this._current.render();
  }
}
