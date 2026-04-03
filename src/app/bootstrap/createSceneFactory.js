import { TitleScene } from '../../scenes/TitleScene.js';

async function instantiateScene(loadModule, exportName, ...args) {
  const sceneModule = await loadModule();
  const SceneType = sceneModule?.[exportName];
  if (typeof SceneType !== 'function') {
    throw new Error(`Scene module "${exportName}" did not export a constructor.`);
  }
  return new SceneType(...args);
}

export function createSceneFactory({
  createTitleSceneImpl = (game) => new TitleScene(game),
  createPlaySceneImpl = (game) => instantiateScene(() => import('../../scenes/PlayScene.js'), 'PlayScene', game),
  createMetaShopSceneImpl = (game) => instantiateScene(() => import('../../scenes/MetaShopScene.js'), 'MetaShopScene', game),
  createSettingsSceneImpl = (game) => instantiateScene(() => import('../../scenes/SettingsScene.js'), 'SettingsScene', game),
  createCodexSceneImpl = (game, from = 'title') => instantiateScene(() => import('../../scenes/CodexScene.js'), 'CodexScene', game, from),
} = {}) {
  return {
    createTitleScene(game) {
      return createTitleSceneImpl(game);
    },

    createPlayScene(game) {
      return createPlaySceneImpl(game);
    },

    createMetaShopScene(game) {
      return createMetaShopSceneImpl(game);
    },

    createSettingsScene(game) {
      return createSettingsSceneImpl(game);
    },

    createCodexScene(game, from = 'title') {
      return createCodexSceneImpl(game, from);
    },

    createScene(sceneId, game, options = {}) {
      switch (sceneId) {
        case 'title':
          return createTitleSceneImpl(game);
        case 'play':
          return createPlaySceneImpl(game);
        case 'metashop':
          return createMetaShopSceneImpl(game);
        case 'settings':
          return createSettingsSceneImpl(game);
        case 'codex':
          return createCodexSceneImpl(game, options.from ?? 'title');
        default:
          throw new Error(`Unknown scene id: ${sceneId}`);
      }
    },
  };
}
