import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[SceneFactory]');

const { test, summary } = createRunner('SceneFactory');

const createSceneFactorySource = readProjectSource('../src/app/bootstrap/createSceneFactory.js');

let factoryApi = null;

try {
  factoryApi = await import('../src/app/bootstrap/createSceneFactory.js');
} catch (error) {
  factoryApi = { error };
}

function ensureFactoryModule() {
  assert.ok(!factoryApi.error, factoryApi.error?.message ?? 'createSceneFactory.js가 아직 없음');
  assert.equal(typeof factoryApi.createSceneFactory, 'function', 'scene factory helper export가 없음');
}

test('scene factory는 non-title scene을 정적 import하지 않는다', () => {
  assert.equal(
    /import\s+\{\s*PlayScene\s*\}\s+from\s+['"]\.\.\/\.\.\/scenes\/PlayScene\.js['"]/.test(createSceneFactorySource),
    false,
    'createSceneFactory가 PlayScene을 정적 import하면 초기 번들에 전투 런타임이 실린다',
  );
  assert.equal(
    /import\s+\{\s*MetaShopScene\s*\}\s+from\s+['"]\.\.\/\.\.\/scenes\/MetaShopScene\.js['"]/.test(createSceneFactorySource),
    false,
    'createSceneFactory가 MetaShopScene을 정적 import하면 초기 번들에 메타 상점이 실린다',
  );
  assert.equal(
    /import\s+\{\s*SettingsScene\s*\}\s+from\s+['"]\.\.\/\.\.\/scenes\/SettingsScene\.js['"]/.test(createSceneFactorySource),
    false,
    'createSceneFactory가 SettingsScene을 정적 import하면 초기 번들에 설정 화면이 실린다',
  );
  assert.equal(
    /import\s+\{\s*CodexScene\s*\}\s+from\s+['"]\.\.\/\.\.\/scenes\/CodexScene\.js['"]/.test(createSceneFactorySource),
    false,
    'createSceneFactory가 CodexScene을 정적 import하면 초기 번들에 Codex가 실린다',
  );
});

test('scene factory 기본 구현은 title만 동기 생성하고 나머지 scene은 지연 로드한다', async () => {
  ensureFactoryModule();

  const factory = factoryApi.createSceneFactory();
  const game = { sceneFactory: null };

  const titleScene = factory.createTitleScene(game);
  const playScene = factory.createPlayScene(game);
  const metaShopScene = factory.createMetaShopScene(game);
  const settingsScene = factory.createSettingsScene(game);
  const codexScene = factory.createCodexScene(game, 'title');

  assert.equal(typeof titleScene?.then, 'undefined', 'initial TitleScene은 동기 생성돼야 함');
  assert.equal(titleScene?.sceneId, 'TitleScene', 'title factory가 TitleScene을 즉시 생성하지 않음');

  assert.equal(typeof playScene?.then, 'function', 'play factory는 Promise로 scene을 지연 로드해야 함');
  assert.equal(typeof metaShopScene?.then, 'function', 'meta shop factory는 Promise로 scene을 지연 로드해야 함');
  assert.equal(typeof settingsScene?.then, 'function', 'settings factory는 Promise로 scene을 지연 로드해야 함');
  assert.equal(typeof codexScene?.then, 'function', 'codex factory는 Promise로 scene을 지연 로드해야 함');

  assert.equal((await playScene)?.sceneId, 'PlayScene', 'play factory가 PlayScene을 해석하지 않음');
  assert.equal((await metaShopScene)?.sceneId, 'MetaShopScene', 'meta shop factory가 MetaShopScene을 해석하지 않음');
  assert.equal((await settingsScene)?.sceneId, 'SettingsScene', 'settings factory가 SettingsScene을 해석하지 않음');
  assert.equal((await codexScene)?.sceneId, 'CodexScene', 'codex factory가 CodexScene을 해석하지 않음');
});

summary();
