/**
 * SceneManager — 씬 전환 관리
 * 각 Scene은 { enter(), update(dt), render(), exit() } 인터페이스를 구현한다.
 */
export class SceneManager {
  constructor() {
    this._currentScene = null;
  }

  get currentScene() { return this._currentScene; }

  changeScene(newScene) {
    if (this._currentScene?.exit) this._currentScene.exit();
    this._currentScene = newScene;
    if (this._currentScene?.enter) this._currentScene.enter();
  }

  update(dt) {
    this._currentScene?.update(dt);
  }

  render() {
    this._currentScene?.render();
  }
}
