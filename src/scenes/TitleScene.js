import {
  bindTitleSceneEvents,
  buildTitleSceneDom,
  ensureTitleLoadoutView,
  initTitleSceneBackground,
  openTitleStartLoadout,
  teardownTitleSceneRuntime,
} from './title/titleSceneRuntime.js';
import { createTitleSceneRuntimeState } from './title/titleSceneRuntimeState.js';
import {
  ensureTitleFonts,
} from './title/titleScreenContent.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.sceneId = 'TitleScene';
    this._runtimeState = createTitleSceneRuntimeState();
  }

  enter() {
    this._runtimeState.nav.reset();
    ensureTitleFonts();
    this._buildDOM();
    this._bindEvents();
  }

  update() {}
  render() {}

  exit() {
    teardownTitleSceneRuntime(this);
  }

  _buildDOM() {
    buildTitleSceneDom(this);
  }

  async _initBackground() {
    return initTitleSceneBackground(this);
  }

  _bindEvents() {
    bindTitleSceneEvents(this);
  }

  async _ensureLoadoutView() {
    return ensureTitleLoadoutView(this);
  }

  async _openStartLoadout({ setMessage, pulseFlash }) {
    return openTitleStartLoadout(this, { setMessage, pulseFlash });
  }
}
