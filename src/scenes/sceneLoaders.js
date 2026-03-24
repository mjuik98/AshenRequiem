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

export function loadPauseViewModule() {
  return import('../ui/pause/PauseView.js');
}

export function loadResultViewModule() {
  return import('../ui/result/ResultView.js');
}

export function loadLevelUpViewModule() {
  return import('../ui/levelup/LevelUpView.js');
}
