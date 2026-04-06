import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[ArchitectureOwnerRealignment]');

const { test, summary } = createRunner('ArchitectureOwnerRealignment');

test('browser input compatibility wrappers re-export platform-owned adapters', async () => {
  const keyboardWrapper = await import('../src/input/KeyboardAdapter.js');
  const keyboardOwner = await import('../src/platform/browser/input/KeyboardAdapter.js');
  const gamepadWrapper = await import('../src/input/GamepadAdapter.js');
  const gamepadOwner = await import('../src/platform/browser/input/GamepadAdapter.js');
  const touchWrapper = await import('../src/input/TouchAdapter.js');
  const touchOwner = await import('../src/platform/browser/input/TouchAdapter.js');
  const touchHudWrapper = await import('../src/input/touchHudRuntime.js');
  const touchHudOwner = await import('../src/platform/browser/input/touchHudRuntime.js');
  const gameInputRuntimeSource = readProjectSource('../src/adapters/browser/gameInputRuntime.js');

  assert.equal(keyboardWrapper.KeyboardAdapter, keyboardOwner.KeyboardAdapter, 'KeyboardAdapter wrapper가 platform owner를 재노출하지 않음');
  assert.equal(gamepadWrapper.GamepadAdapter, gamepadOwner.GamepadAdapter, 'GamepadAdapter wrapper가 platform owner를 재노출하지 않음');
  assert.equal(touchWrapper.TouchAdapter, touchOwner.TouchAdapter, 'TouchAdapter wrapper가 platform owner를 재노출하지 않음');
  assert.equal(touchHudWrapper.createTouchHudRuntime, touchHudOwner.createTouchHudRuntime, 'touch HUD wrapper가 platform owner helper를 재노출하지 않음');
  assert.equal(touchHudWrapper.syncTouchHudRuntime, touchHudOwner.syncTouchHudRuntime, 'touch HUD wrapper가 platform owner sync helper를 재노출하지 않음');
  assert.equal(gameInputRuntimeSource.includes("from '../../platform/browser/input/KeyboardAdapter.js'"), true, 'gameInputRuntime이 platform-owned keyboard adapter를 사용하지 않음');
  assert.equal(gameInputRuntimeSource.includes("from '../../platform/browser/input/GamepadAdapter.js'"), true, 'gameInputRuntime이 platform-owned gamepad adapter를 사용하지 않음');
  assert.equal(gameInputRuntimeSource.includes("from '../../platform/browser/input/TouchAdapter.js'"), true, 'gameInputRuntime이 platform-owned touch adapter를 사용하지 않음');
});

test('permanent upgrade applicator compatibility wrapper delegates to play progression owner', async () => {
  const wrapper = await import('../src/data/permanentUpgradeApplicator.js');
  const owner = await import('../src/domain/play/progression/permanentUpgradeApplicator.js');
  const playerSpawnSource = readProjectSource('../src/app/play/playerSpawnApplicationService.js');
  const permanentUpgradeDataSource = readProjectSource('../src/data/permanentUpgradeData.js');

  assert.equal(wrapper.applyPermanentUpgrades, owner.applyPermanentUpgrades, 'permanentUpgradeApplicator wrapper가 play progression owner를 재노출하지 않음');
  assert.equal(playerSpawnSource.includes("from '../../domain/play/progression/permanentUpgradeApplicator.js'"), true, 'playerSpawnApplicationService가 play progression owner를 사용하지 않음');
  assert.equal(playerSpawnSource.includes("from '../../data/permanentUpgradeApplicator.js'"), false, 'playerSpawnApplicationService가 compatibility wrapper에 직접 결합하면 안 됨');
  assert.equal(permanentUpgradeDataSource.includes("from '../domain/play/progression/permanentUpgradeApplicator.js'"), true, 'permanentUpgradeData facade가 play progression owner를 사용하지 않음');
  assert.equal(permanentUpgradeDataSource.includes("from './permanentUpgradeApplicator.js'"), false, 'permanentUpgradeData facade가 compatibility wrapper에 직접 결합하면 안 됨');
});

test('app session services depend on a local repository port instead of browser adapters directly', async () => {
  const sessionRepositoryPort = await import('../src/app/session/sessionRepositoryPort.js');
  const browserSessionRepository = await import('../src/adapters/browser/session/sessionRepository.js');
  const sessionPersistenceSource = readProjectSource('../src/app/session/sessionPersistenceService.js');
  const sessionSnapshotQuerySource = readProjectSource('../src/app/session/sessionSnapshotQueryService.js');
  const sessionSnapshotCommandSource = readProjectSource('../src/app/session/sessionSnapshotCommandService.js');
  const sessionRepositoryPortSource = readProjectSource('../src/app/session/sessionRepositoryPort.js');

  assert.equal(sessionRepositoryPort.saveSessionState, browserSessionRepository.saveSessionState, 'sessionRepositoryPort가 browser owner save helper를 재노출하지 않음');
  assert.equal(sessionRepositoryPort.serializeSessionState, browserSessionRepository.serializeSessionState, 'sessionRepositoryPort가 browser owner serialize helper를 재노출하지 않음');
  assert.equal(sessionRepositoryPort.parseSessionState, browserSessionRepository.parseSessionState, 'sessionRepositoryPort가 browser owner parse helper를 재노출하지 않음');
  assert.equal(sessionRepositoryPort.inspectStoredSessionSnapshots, browserSessionRepository.inspectStoredSessionSnapshots, 'sessionRepositoryPort가 browser owner inspect helper를 재노출하지 않음');
  assert.equal(sessionRepositoryPort.restoreStoredSessionSnapshot, browserSessionRepository.restoreStoredSessionSnapshot, 'sessionRepositoryPort가 browser owner restore helper를 재노출하지 않음');
  assert.equal(sessionRepositoryPortSource.includes("from '../../adapters/browser/session/sessionRepository.js'"), true, 'sessionRepositoryPort가 browser owner repository를 연결하지 않음');
  assert.equal(sessionPersistenceSource.includes("from './sessionRepositoryPort.js'"), true, 'sessionPersistenceService가 local session repository port를 사용하지 않음');
  assert.equal(sessionSnapshotQuerySource.includes("from './sessionRepositoryPort.js'"), true, 'sessionSnapshotQueryService가 local session repository port를 사용하지 않음');
  assert.equal(sessionSnapshotCommandSource.includes("from './sessionRepositoryPort.js'"), true, 'sessionSnapshotCommandService가 local session repository port를 사용하지 않음');
  assert.equal(sessionPersistenceSource.includes("from '../../adapters/browser/session/sessionRepository.js'"), false, 'sessionPersistenceService가 browser adapter에 직접 결합하면 안 됨');
  assert.equal(sessionSnapshotQuerySource.includes("from '../../adapters/browser/session/sessionRepository.js'"), false, 'sessionSnapshotQueryService가 browser adapter에 직접 결합하면 안 됨');
  assert.equal(sessionSnapshotCommandSource.includes("from '../../adapters/browser/session/sessionRepository.js'"), false, 'sessionSnapshotCommandService가 browser adapter에 직접 결합하면 안 됨');
});

summary();
