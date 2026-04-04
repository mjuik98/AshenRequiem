import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { makeSessionState } from './fixtures/index.js';

console.log('\n[SessionRepository]');

const { test, summary } = createRunner('SessionRepository');

let repositoryApi = null;
let sessionStorageApi = null;
let browserRepositoryApi = null;
let browserSessionStorageApi = null;

try {
  repositoryApi = await import('../src/state/session/sessionRepository.js');
  sessionStorageApi = await import('../src/state/session/sessionStorage.js');
  browserRepositoryApi = await import('../src/adapters/browser/session/sessionRepository.js');
  browserSessionStorageApi = await import('../src/adapters/browser/session/sessionStorage.js');
} catch (error) {
  repositoryApi = { error };
  sessionStorageApi = { error };
  browserRepositoryApi = { error };
  browserSessionStorageApi = { error };
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

function getBrowserRepositoryApi() {
  assert.ok(
    !browserRepositoryApi.error,
    browserRepositoryApi.error?.message ?? 'src/adapters/browser/session/sessionRepository.js를 불러오지 못함',
  );
  return browserRepositoryApi;
}

function getBrowserSessionStorageApi() {
  assert.ok(
    !browserSessionStorageApi.error,
    browserSessionStorageApi.error?.message ?? 'src/adapters/browser/session/sessionStorage.js를 불러오지 못함',
  );
  return browserSessionStorageApi;
}

test('session repository 모듈은 저장소 경계 API를 노출한다', () => {
  const api = getRepositoryApi();
  const browserApi = getBrowserRepositoryApi();
  assert.equal(typeof api.createLocalSessionRepository, 'function');
  assert.equal(typeof api.loadSessionState, 'function');
  assert.equal(typeof api.saveSessionState, 'function');
  assert.equal(typeof api.serializeSessionState, 'function');
  assert.equal(typeof api.parseSessionState, 'function');
  assert.equal(typeof api.inspectStoredSessionSnapshots, 'function');
  assert.equal(typeof api.restoreStoredSessionSnapshot, 'function');
  assert.equal(typeof api.setSessionRepository, 'function');
  assert.equal(typeof api.resetSessionRepository, 'function');
  assert.equal(api.createLocalSessionRepository, browserApi.createLocalSessionRepository, 'state/sessionRepository wrapper가 browser owner repository factory를 재노출하지 않음');
  assert.equal(api.loadSessionState, browserApi.loadSessionState, 'state/sessionRepository wrapper가 browser owner loadSessionState를 재노출하지 않음');
  assert.equal(api.saveSessionState, browserApi.saveSessionState, 'state/sessionRepository wrapper가 browser owner saveSessionState를 재노출하지 않음');
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
  const browserSessionStorage = getBrowserSessionStorageApi();

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
    assert.equal(saveSession, browserSessionStorage.saveSession, 'state/sessionStorage wrapper가 browser owner saveSession을 재노출하지 않음');
    assert.equal(loadSession, browserSessionStorage.loadSession, 'state/sessionStorage wrapper가 browser owner loadSession을 재노출하지 않음');
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
  const { createLocalSessionRepository } = getBrowserRepositoryApi();
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
  const { createLocalSessionRepository } = getBrowserRepositoryApi();
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

test('session repository는 내보내기/가져오기용 직렬화 헬퍼를 제공한다', () => {
  const { serializeSessionState, parseSessionState } = getBrowserRepositoryApi();
  const session = makeSessionState({
    meta: {
      currency: 123,
      recentRuns: [{ outcome: 'victory', stageId: 'ash_plains' }],
    },
  });

  const raw = serializeSessionState(session);
  const restored = parseSessionState(raw);

  assert.equal(typeof raw, 'string', 'session export 직렬화 결과가 문자열이 아님');
  assert.equal(restored.meta.currency, 123, 'session import가 meta.currency를 복원하지 못함');
  assert.equal(restored.meta.recentRuns[0].outcome, 'victory', 'session import가 recentRuns를 복원하지 못함');
});

test('session repository는 primary/backup/corrupt 슬롯 상태를 요약할 수 있다', () => {
  const { inspectStoredSessionSnapshots } = getBrowserRepositoryApi();
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };

  store.set('ashenRequiem_session', JSON.stringify(makeSessionState({ meta: { currency: 12 } })));
  store.set('ashenRequiem_session_backup', JSON.stringify(makeSessionState({ meta: { currency: 99 } })));
  store.set('ashenRequiem_session_corrupt', '{bad json');

  const inspection = inspectStoredSessionSnapshots({ storage });

  assert.equal(inspection.primary.status, 'ok');
  assert.equal(inspection.primary.session.meta.currency, 12);
  assert.equal(inspection.backup.status, 'ok');
  assert.equal(inspection.backup.session.meta.currency, 99);
  assert.equal(inspection.corrupt.status, 'invalid');
});

test('session repository는 backup 슬롯을 primary로 복구할 수 있다', () => {
  const { restoreStoredSessionSnapshot } = getBrowserRepositoryApi();
  const store = new Map();
  const storage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };

  store.set('ashenRequiem_session', JSON.stringify(makeSessionState({ meta: { currency: 12 } })));
  store.set('ashenRequiem_session_backup', JSON.stringify(makeSessionState({ meta: { currency: 99 } })));

  const restored = restoreStoredSessionSnapshot('backup', { storage });

  assert.equal(restored.meta.currency, 99, 'backup session restore가 대상 세션을 반환하지 않음');
  assert.equal(
    JSON.parse(store.get('ashenRequiem_session')).meta.currency,
    99,
    'backup restore가 primary 슬롯을 덮어쓰지 않음',
  );
});

summary();
