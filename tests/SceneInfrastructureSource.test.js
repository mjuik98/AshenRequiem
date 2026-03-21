import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, summary } from './helpers/testRunner.js';

const settingsSceneSource = readFileSync(new URL('../src/scenes/SettingsScene.js', import.meta.url), 'utf8');
const codexSceneSource = readFileSync(new URL('../src/scenes/CodexScene.js', import.meta.url), 'utf8');
const metaShopSceneSource = readFileSync(new URL('../src/scenes/MetaShopScene.js', import.meta.url), 'utf8');
const titleSceneSource = readFileSync(new URL('../src/scenes/TitleScene.js', import.meta.url), 'utf8');
const playResultHandlerSource = readFileSync(new URL('../src/scenes/play/PlayResultHandler.js', import.meta.url), 'utf8');

console.log('\n[SceneInfrastructureSource]');

test('서브씬은 공통 navigation guard를 사용한다', () => {
  assert.equal(settingsSceneSource.includes('createSceneNavigationGuard'), true, 'SettingsScene이 공통 navigation guard를 사용하지 않음');
  assert.equal(codexSceneSource.includes('createSceneNavigationGuard'), true, 'CodexScene이 공통 navigation guard를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('createSceneNavigationGuard'), true, 'MetaShopScene이 공통 navigation guard를 사용하지 않음');
  assert.equal(titleSceneSource.includes('createSceneNavigationGuard'), true, 'TitleScene이 공통 navigation guard를 사용하지 않음');
  assert.equal(titleSceneSource.includes('this._nav.change('), true, 'TitleScene이 동기 씬 전환에도 공통 navigation helper를 사용하지 않음');
});

test('씬은 직접 saveSession() 대신 sessionFacade를 사용한다', () => {
  assert.equal(settingsSceneSource.includes('saveSession('), false, 'SettingsScene이 직접 saveSession을 호출함');
  assert.equal(metaShopSceneSource.includes('saveSession('), false, 'MetaShopScene이 직접 saveSession을 호출함');
  assert.equal(titleSceneSource.includes('saveSession('), false, 'TitleScene이 직접 saveSession을 호출함');
  assert.equal(settingsSceneSource.includes('updateSessionOptionsAndSave'), true, 'SettingsScene이 sessionFacade를 사용하지 않음');
  assert.equal(metaShopSceneSource.includes('purchasePermanentUpgradeAndSave'), true, 'MetaShopScene이 sessionFacade를 사용하지 않음');
  assert.equal(titleSceneSource.includes('setSelectedStartWeaponAndSave'), true, 'TitleScene이 sessionFacade를 사용하지 않음');
  assert.equal(playResultHandlerSource.includes('persistSession'), true, 'PlayResultHandler가 sessionFacade persist를 사용하지 않음');
});

summary();
