import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[SessionRepository]');

const { test, summary } = createRunner('SessionRepository');

let repositoryApi = null;
let sessionStorageApi = null;

try {
  repositoryApi = await import('../src/state/session/sessionRepository.js');
  sessionStorageApi = await import('../src/state/session/sessionStorage.js');
} catch (error) {
  repositoryApi = { error };
  sessionStorageApi = { error };
}

function getRepositoryApi() {
  assert.ok(
    !repositoryApi.error,
    repositoryApi.error?.message ?? 'src/state/session/sessionRepository.js가 아직 없음',
  );
  return repositoryApi;
}

function getSessionStorageApi() {
  assert.ok(
    !sessionStorageApi.error,
    sessionStorageApi.error?.message ?? 'src/state/session/sessionStorage.js를 불러오지 못함',
  );
  return sessionStorageApi;
}

test('session repository 모듈은 저장소 경계 API를 노출한다', () => {
  const api = getRepositoryApi();
  assert.equal(typeof api.createLocalSessionRepository, 'function');
  assert.equal(typeof api.loadSessionState, 'function');
  assert.equal(typeof api.saveSessionState, 'function');
  assert.equal(typeof api.setSessionRepository, 'function');
  assert.equal(typeof api.resetSessionRepository, 'function');
});

test('sessionStorage compatibility API는 session repository override를 따른다', () => {
  const {
    setSessionRepository,
    resetSessionRepository,
  } = getRepositoryApi();
  const {
    saveSession,
    loadSession,
  } = getSessionStorageApi();

  let savedPayload = null;
  const session = makeSessionState({
    best: { kills: 12, survivalTime: 34, level: 5 },
    meta: { currency: 99 },
  });

  setSessionRepository({
    save(nextSession) {
      savedPayload = structuredClone(nextSession);
    },
    load() {
      return savedPayload;
    },
  });

  try {
    saveSession(session);
    const loaded = loadSession();
    assert.equal(savedPayload.best.kills, 12);
    assert.equal(loaded.meta.currency, 99);
    assert.equal(loaded.best.level, 5);
  } finally {
    resetSessionRepository();
  }
});

summary();
