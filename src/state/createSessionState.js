/**
 * src/state/createSessionState.js
 *
 * CHANGE(P1-③): MetaProgression을 위한 v2 스키마 추가
 *   Before (v1): best{ killCount, elapsedTime, playerLevel }, options, last
 *   After  (v2): + meta{ currency, permanentUpgrades{} }
 *
 * 마이그레이션 경로:
 *   v0 → v1 → v2 순차 적용
 *   기존 사용자의 localStorage 데이터 보존 보장
 *
 * 새로운 API:
 *   earnCurrency(session, amount)  — 런 종료 후 재화 누적
 *   spendCurrency(session, cost)   — 영구 업그레이드 구매
 *   addPermanentUpgrade(session, upgradeId) — 영구 업그레이드 등록
 *   hasPermanentUpgrade(session, upgradeId) — 보유 여부 확인
 */

const STORAGE_KEY = 'vamplike_session';
const CURRENT_STORAGE_VERSION = 2;

// ─── 타입 정의 ────────────────────────────────────────────────────────

/**
 * @typedef {Object} RunResult
 * @property {number} killCount
 * @property {number} elapsedTime
 * @property {number} playerLevel
 */

/**
 * @typedef {Object} MetaState
 * @property {number}          currency           - 누적 재화 (런 간 유지)
 * @property {Record<string,number>} permanentUpgrades - upgradeId → 레벨
 */

/**
 * @typedef {Object} SessionState
 * @property {number}        version
 * @property {RunResult}     best
 * @property {RunResult|null} last
 * @property {MetaState}     meta
 * @property {{ soundOn: boolean }} options
 */

// ─── 기본값 ───────────────────────────────────────────────────────────

function defaultBest() {
  return { killCount: 0, elapsedTime: 0, playerLevel: 1 };
}

function defaultMeta() {
  return { currency: 0, permanentUpgrades: {} };
}

function defaultOptions() {
  return { soundOn: true };
}

// ─── 마이그레이션 ────────────────────────────────────────────────────

/**
 * localStorage에서 읽은 raw 데이터를 최신 버전 스키마로 변환.
 *
 * @param {object|null} saved
 * @returns {SessionState}
 */
function _migrateSession(saved) {
  if (!saved) {
    return {
      version: CURRENT_STORAGE_VERSION,
      best:    defaultBest(),
      last:    null,
      meta:    defaultMeta(),
      options: defaultOptions(),
    };
  }

  const v = saved.version ?? 0;
  let state = { ...saved };

  // v0 → v1: best 필드 정규화
  if (v < 1) {
    state = {
      ...state,
      version: 1,
      best: {
        killCount:   state.best?.killCount   ?? 0,
        elapsedTime: state.best?.elapsedTime ?? 0,
        playerLevel: state.best?.playerLevel ?? 1,
      },
      options: {
        soundOn: state.options?.soundOn ?? true,
      },
    };
  }

  // v1 → v2: meta 필드 추가
  if (v < 2) {
    state = {
      ...state,
      version: 2,
      meta: {
        currency:          state.meta?.currency          ?? 0,
        permanentUpgrades: state.meta?.permanentUpgrades ?? {},
      },
    };
  }

  return {
    version: CURRENT_STORAGE_VERSION,
    best: {
      killCount:   state.best?.killCount   ?? 0,
      elapsedTime: state.best?.elapsedTime ?? 0,
      playerLevel: state.best?.playerLevel ?? 1,
    },
    last: null,
    meta: {
      currency:          state.meta?.currency          ?? 0,
      permanentUpgrades: state.meta?.permanentUpgrades ?? {},
    },
    options: {
      soundOn: state.options?.soundOn ?? true,
    },
  };
}

// ─── 생성 ─────────────────────────────────────────────────────────────

/**
 * @returns {SessionState}
 */
export function createSessionState() {
  const saved = _loadFromStorage();
  return _migrateSession(saved);
}

// ─── 런 기록 갱신 ────────────────────────────────────────────────────

/**
 * 런 종료 후 최고 기록을 필드별로 갱신하고 last에 결과를 기록한다.
 * saveSession()을 별도 호출해야 localStorage에 저장된다.
 *
 * @param {SessionState} session
 * @param {RunResult}    result
 */
export function updateSessionBest(session, result) {
  session.last = {
    killCount:   result.killCount   ?? 0,
    elapsedTime: result.elapsedTime ?? 0,
    playerLevel: result.playerLevel ?? 1,
  };

  // 각 축 독립 갱신 — 한 런의 결과로 전체 덮어쓰기 금지
  if ((result.killCount   ?? 0) > session.best.killCount)   session.best.killCount   = result.killCount;
  if ((result.elapsedTime ?? 0) > session.best.elapsedTime) session.best.elapsedTime = result.elapsedTime;
  if ((result.playerLevel ?? 1) > session.best.playerLevel) session.best.playerLevel = result.playerLevel;
}

// ─── MetaProgression API ─────────────────────────────────────────────

/**
 * 런 종료 후 재화를 누적한다.
 *
 * @param {SessionState} session
 * @param {number}       amount   양수만 허용
 */
export function earnCurrency(session, amount) {
  if (amount <= 0) return;
  session.meta.currency += Math.floor(amount);
}

/**
 * 영구 업그레이드 구매 시 재화를 차감한다.
 * 잔액 부족 시 false 반환.
 *
 * @param {SessionState} session
 * @param {number}       cost
 * @returns {boolean}
 */
export function spendCurrency(session, cost) {
  if (cost <= 0 || session.meta.currency < cost) return false;
  session.meta.currency -= cost;
  return true;
}

/**
 * 영구 업그레이드를 추가하거나 레벨을 올린다.
 *
 * @param {SessionState} session
 * @param {string}       upgradeId
 * @param {number}       [delta=1]
 */
export function addPermanentUpgrade(session, upgradeId, delta = 1) {
  const current = session.meta.permanentUpgrades[upgradeId] ?? 0;
  session.meta.permanentUpgrades[upgradeId] = current + delta;
}

/**
 * 특정 영구 업그레이드 보유 여부 확인.
 *
 * @param {SessionState} session
 * @param {string}       upgradeId
 * @returns {boolean}
 */
export function hasPermanentUpgrade(session, upgradeId) {
  return (session.meta.permanentUpgrades[upgradeId] ?? 0) > 0;
}

/**
 * 특정 영구 업그레이드 레벨 반환.
 *
 * @param {SessionState} session
 * @param {string}       upgradeId
 * @returns {number}
 */
export function getPermanentUpgradeLevel(session, upgradeId) {
  return session.meta.permanentUpgrades[upgradeId] ?? 0;
}

// ─── 저장 / 로드 ──────────────────────────────────────────────────────

/**
 * localStorage에 세션 저장. last는 저장하지 않음.
 *
 * @param {SessionState} session
 */
export function saveSession(session) {
  try {
    const toSave = {
      version: session.version,
      best:    session.best,
      meta:    session.meta,
      options: session.options,
      // last는 의도적으로 제외 (임시 결과 — 영구 저장 불필요)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[createSessionState] localStorage 저장 실패:', e.message);
  }
}

/**
 * @returns {object|null}
 */
function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
