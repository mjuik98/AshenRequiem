/**
 * SceneManager — 씬 전환 관리
 *
 * 각 Scene은 { enter(), update(dt), render(), exit() } 인터페이스를 구현한다.
 */
export class SceneManager {
  constructor() {
    /** @type {object|null} */
    this._currentScene = null;
  }

  /** 현재 활성 씬 */
  get currentScene() {
    return this._currentScene;
  }

  /**
   * 씬을 전환한다.
   * @param {object} newScene — { enter, update, render, exit }
   */
  changeScene(newScene) {
    if (this._currentScene && typeof this._currentScene.exit === 'function') {
      this._currentScene.exit();
    }
    this._currentScene = newScene;
    if (this._currentScene && typeof this._currentScene.enter === 'function') {
      this._currentScene.enter();
    }
  }

  /**
   * 현재 씬의 update 호출
   * @param {number} dt — deltaTime (초)
   */
  update(dt) {
    if (this._currentScene && typeof this._currentScene.update === 'function') {
      this._currentScene.update(dt);
    }
  }

  /**
   * 현재 씬의 render 호출
   */
  render() {
    if (this._currentScene && typeof this._currentScene.render === 'function') {
      this._currentScene.render();
    }
  }
}
