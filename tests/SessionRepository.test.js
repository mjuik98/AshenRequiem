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

test('local session repository는 저장 시 primary와 backup 슬롯을 함께 갱신한다', () => {
  const { createLocalSessionRepository } = getRepositoryApi();
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  const repository = createLocalSessionRepository({ storage });
  repository.save(makeSessionState({
    best: { kills: 9, survivalTime: 88, level: 4 },
    meta: { currency: 55 },
  }));

  assert.equal(store.has('ashenRequiem_session'), true, 'primary session slot이 저장되지 않음');
  assert.equal(store.has('ashenRequiem_session_backup'), true, 'backup session slot이 저장되지 않음');
});

test('local session repository는 primary save가 손상되면 backup 슬롯으로 복구한다', () => {
  const { createLocalSessionRepository } = getRepositoryApi();
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  const repository = createLocalSessionRepository({ storage });
  const healthy = JSON.stringify(makeSessionState({
    best: { kills: 17, survivalTime: 333, level: 6 },
    meta: { currency: 91 },
  }));

  store.set('ashenRequiem_session', '{bad json');
  store.set('ashenRequiem_session_backup', healthy);

  const loaded = repository.load();

  assert.equal(loaded.best.kills, 17, 'backup session이 로드되지 않음');
  assert.equal(loaded.meta.currency, 91, 'backup session의 메타 데이터가 복구되지 않음');
  assert.equal(store.has('ashenRequiem_session_corrupt'), true, '손상된 primary save snapshot이 보존되지 않음');
});

summary();
