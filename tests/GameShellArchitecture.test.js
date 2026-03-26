import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[GameShellArchitecture]');

const { test, summary } = createRunner('GameShellArchitecture');

let appApi = null;
let shellApi = null;
let bootstrapApi = null;

try {
  appApi = await import('../src/app/GameApp.js');
  shellApi = await import('../src/adapters/browser/BrowserGameShell.js');
  bootstrapApi = await import('../src/app/bootstrap/bootstrapBrowserGame.js');
} catch (error) {
  appApi = { error };
  shellApi = { error };
  bootstrapApi = { error };
}

test('GameApp과 BrowserGameShell은 분리된 entrypoint를 노출한다', () => {
  assert.ok(!appApi.error, appApi.error?.message ?? 'GameApp.js가 아직 없음');
  assert.ok(!shellApi.error, shellApi.error?.message ?? 'BrowserGameShell.js가 아직 없음');
  assert.ok(!bootstrapApi.error, bootstrapApi.error?.message ?? 'bootstrapBrowserGame.js가 아직 없음');
  assert.equal(typeof appApi.GameApp, 'function');
  assert.equal(typeof shellApi.createBrowserGameShell, 'function');
  assert.equal(typeof bootstrapApi.bootstrapBrowserGame, 'function');
});

test('Game는 shell/app 조합 facade로 축소된다', () => {
  const source = readProjectSource('../src/core/Game.js');

  assert.equal(source.includes("from '../app/GameApp.js'"), true, 'Game가 GameApp을 import해야 함');
  assert.equal(source.includes("from '../adapters/browser/BrowserGameShell.js'"), true, 'Game가 BrowserGameShell을 import해야 함');
  assert.equal(source.includes("from '../scenes/TitleScene.js'"), false, 'Game가 TitleScene을 직접 import하면 안 됨');
  assert.equal(source.includes("from './gameRuntime.js'"), false, 'Game가 runtime 세부 helper를 직접 붙잡고 있으면 안 됨');
});

test('main은 Game facade 대신 browser bootstrap helper를 직접 사용한다', () => {
  const source = readProjectSource('../src/main.js');

  assert.equal(source.includes("from './app/bootstrap/bootstrapBrowserGame.js'"), true, 'main이 browser bootstrap helper를 import해야 함');
  assert.equal(source.includes("from './core/Game.js'"), false, 'main이 Game facade를 직접 import하면 안 됨');
});

summary();
