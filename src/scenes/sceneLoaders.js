/**
 * Legacy compatibility facade for scene/view lazy loaders.
 * Internal runtime modules should prefer injected sceneFactory or overlayViewLoaders.
 */
export function loadTitleSceneModule() {
  return import('./TitleScene.js');
}

export function loadPlaySceneModule() {
  return import('./PlayScene.js');
}

export function loadMetaShopSceneModule() {
  return import('./MetaShopScene.js');
}

export function loadSettingsSceneModule() {
  return import('./SettingsScene.js');
}

export function loadCodexSceneModule() {
  return import('./CodexScene.js');
}

export {
  loadPauseViewModule,
  loadResultViewModule,
  loadLevelUpViewModule,
} from './overlayViewLoaders.js';
