import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[ArchitectureRefactorBoundaries]');

const { test, summary } = createRunner('ArchitectureRefactorBoundaries');

test('sessionFacade는 app/session write services를 thin wrapper로 재노출한다', async () => {
  const persistence = await import('../src/app/session/sessionPersistenceService.js');
  const loadoutWrites = await import('../src/app/session/loadoutSelectionWriteService.js');
  const sessionFacade = await import('../src/state/sessionFacade.js');

  assert.equal(sessionFacade.persistSession, persistence.persistSession, 'sessionFacade가 persistSession을 app/session service에서 재노출하지 않음');
  assert.equal(sessionFacade.setActiveRunAndSave, persistence.setActiveRunAndSave, 'sessionFacade가 activeRun write helper를 재노출하지 않음');
  assert.equal(sessionFacade.clearActiveRunAndSave, persistence.clearActiveRunAndSave, 'sessionFacade가 clearActiveRun helper를 재노출하지 않음');
  assert.equal(sessionFacade.updateSessionOptionsAndSave, persistence.updateSessionOptionsAndSave, 'sessionFacade가 options write helper를 재노출하지 않음');
  assert.equal(sessionFacade.purchasePermanentUpgradeAndSave, persistence.purchasePermanentUpgradeAndSave, 'sessionFacade가 permanent upgrade write helper를 재노출하지 않음');

  assert.equal(sessionFacade.setSelectedStartWeaponAndSave, loadoutWrites.setSelectedStartWeaponAndSave, 'sessionFacade가 start weapon selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setSelectedAscensionAndSave, loadoutWrites.setSelectedAscensionAndSave, 'sessionFacade가 ascension selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setSelectedStartAccessoryAndSave, loadoutWrites.setSelectedStartAccessoryAndSave, 'sessionFacade가 accessory selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setSelectedArchetypeAndSave, loadoutWrites.setSelectedArchetypeAndSave, 'sessionFacade가 archetype selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setSelectedRiskRelicAndSave, loadoutWrites.setSelectedRiskRelicAndSave, 'sessionFacade가 risk relic selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setSelectedStageAndSave, loadoutWrites.setSelectedStageAndSave, 'sessionFacade가 stage selection write helper를 재노출하지 않음');
  assert.equal(sessionFacade.setRunSeedSelectionAndSave, loadoutWrites.setRunSeedSelectionAndSave, 'sessionFacade가 seed selection write helper를 재노출하지 않음');
});

test('playResultDomain은 state/session persistence 경계에 직접 의존하지 않는다', () => {
  const source = readProjectSource('../src/domain/meta/progression/playResultDomain.js');

  assert.equal(/from\s+['"][.\/]+(?:\.\.\/)*state\//.test(source), false, 'playResultDomain이 state 계층에 직접 의존하면 안 됨');
  assert.equal(source.includes('persistSession'), false, 'playResultDomain이 세션 저장 구현을 직접 소유하면 안 됨');
});

test('RenderSystem은 브라우저 runtime adapter 대신 주입된 clock service를 사용한다', () => {
  const source = readProjectSource('../src/systems/render/RenderSystem.js');

  assert.equal(source.includes("from '../../adapters/browser/runtimeEnv.js'"), false, 'RenderSystem이 browser runtime adapter를 직접 import하면 안 됨');
  assert.equal(source.includes('services.nowSeconds'), true, 'RenderSystem이 주입된 nowSeconds clock service를 사용해야 함');
});

test('session repository port는 browser repository owner를 app/session seam으로 감싼다', async () => {
  const port = await import('../src/app/session/sessionRepositoryPort.js');
  const browserRepository = await import('../src/adapters/browser/session/sessionRepository.js');
  const persistenceSource = readProjectSource('../src/app/session/sessionPersistenceService.js');
  const querySource = readProjectSource('../src/app/session/sessionSnapshotQueryService.js');
  const commandSource = readProjectSource('../src/app/session/sessionSnapshotCommandService.js');

  assert.equal(port.saveSessionState, browserRepository.saveSessionState, 'sessionRepositoryPort가 browser owner save helper를 재노출하지 않음');
  assert.equal(port.serializeSessionState, browserRepository.serializeSessionState, 'sessionRepositoryPort가 browser owner serialize helper를 재노출하지 않음');
  assert.equal(port.parseSessionState, browserRepository.parseSessionState, 'sessionRepositoryPort가 browser owner parse helper를 재노출하지 않음');
  assert.equal(port.inspectStoredSessionSnapshots, browserRepository.inspectStoredSessionSnapshots, 'sessionRepositoryPort가 browser owner inspect helper를 재노출하지 않음');
  assert.equal(port.restoreStoredSessionSnapshot, browserRepository.restoreStoredSessionSnapshot, 'sessionRepositoryPort가 browser owner restore helper를 재노출하지 않음');
  assert.equal(persistenceSource.includes("from './sessionRepositoryPort.js'"), true, 'sessionPersistenceService가 local repository port를 사용하지 않음');
  assert.equal(querySource.includes("from './sessionRepositoryPort.js'"), true, 'sessionSnapshotQueryService가 local repository port를 사용하지 않음');
  assert.equal(commandSource.includes("from './sessionRepositoryPort.js'"), true, 'sessionSnapshotCommandService가 local repository port를 사용하지 않음');
});

summary();
