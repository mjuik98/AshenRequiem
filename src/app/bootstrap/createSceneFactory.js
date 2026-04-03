import { CodexScene } from '../../scenes/CodexScene.js';
import { MetaShopScene } from '../../scenes/MetaShopScene.js';
import { PlayScene } from '../../scenes/PlayScene.js';
import { SettingsScene } from '../../scenes/SettingsScene.js';
import { TitleScene } from '../../scenes/TitleScene.js';

export function createSceneFactory({
  createTitleSceneImpl = (game) => new TitleScene(game),
  createPlaySceneImpl = (game) => new PlayScene(game),
  createMetaShopSceneImpl = (game) => new MetaShopScene(game),
  createSettingsSceneImpl = (game) => new SettingsScene(game),
  createCodexSceneImpl = (game, from = 'title') => new CodexScene(game, from),
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
