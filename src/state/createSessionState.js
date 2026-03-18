/**
 * src/state/createSessionState.js
 *
 * P1-① 개선: sessionState v2 — Meta-Progression 지원
 *
 * Before (v1):
 *   { best: { kills, survivalTime }, last: {}, options: {} }
 *   currency, permanentUpgrades 필드 없음 → 메타 진행 구현 불가.
 *
 * After (v2):
 *   meta: { currency, permanentUpgrades } 추가.
 *   localStorage 스키마 버전 관리(SESSION_VERSION) + 마이그레이션 처리.
 *   updateSessionBest() / saveSession() / loadSession() 분리.
 *
 * 규칙(AGENTS.md §6.2):
 *   - 런 종료 시: updateSessionBest() → saveSession() 순서.
 *   - session.last: 이번 판 임시 결과, 영구저장 안 함.
 *   - session.best: 각 필드별 독립 갱신판정.
 */

const STORAGE_KEY     = 'ashenRequiem_session';
const SESSION_VERSION = 2;

// ── 기본 구조 ─────────────────────────────────────────────────────────────

/**
 * v2 세션 기본값 생성.
 * @returns {SessionState}
 */
export function createSessionState() {
  return {
    _version: SESSION_VERSION,

    /** 현재 런 최종 결과 (임시, 저장 안 함) */
    last: {
      kills:        0,
      survivalTime: 0,
      level:        1,
      weaponsUsed:  [],
    },

    /** 역대 최고 기록 (각 축 독립) */
    best: {
      kills:        0,
      survivalTime: 0,
      level:        1,
    },

    /** Meta-Progression (P1-① 신규) */
    meta: {
      /** 런 보상으로 획득하는 영구 통화 */
      currency: 0,

      /**
       * 영구 업그레이드 목록.
       * @type {Record<string, number>}  upgradeId → 구매 횟수
       */
      permanentUpgrades: {},
    },

    /** UI·설정 옵션 */
    options: {
      soundEnabled:  true,
      musicEnabled:  true,
      showFps:       false,
    },
  };
}

// ── 갱신 ──────────────────────────────────────────────────────────────────

/**
 * 이번 런 결과로 best 레코드를 갱신한다.
 * 각 필드별 독립 판정 (한 런이 모든 기록을 덮어쓰지 않음).
 *
 * @param {SessionState} session
 * @param {{ kills: number, survivalTime: number, level: number }} runResult
 */
export function updateSessionBest(session, runResult) {
  if (runResult.kills        > session.best.kills)        session.best.kills        = runResult.kills;
  if (runResult.survivalTime > session.best.survivalTime) session.best.survivalTime = runResult.survivalTime;
  if (runResult.level        > session.best.level)        session.best.level        = runResult.level;

  // last는 항상 이번 판으로 덮어씀 (임시)
  session.last = { ...runResult };
}

/**
 * 영구 통화를 추가한다.
 * @param {SessionState} session
 * @param {number}       amount
 */
export function earnCurrency(session, amount) {
  session.meta.currency = Math.max(0, session.meta.currency + amount);
}

/**
 * 영구 업그레이드를 구매한다.
 * @param {SessionState} session
 * @param {string}       upgradeId
 * @param {number}       cost
 * @returns {boolean}  성공 여부
 */
export function purchasePermanentUpgrade(session, upgradeId, cost) {
  if (session.meta.currency < cost) return false;
  session.meta.currency -= cost;
  session.meta.permanentUpgrades[upgradeId] =
    (session.meta.permanentUpgrades[upgradeId] ?? 0) + 1;
  return true;
}

// ── 저장 / 불러오기 ───────────────────────────────────────────────────────

/**
 * best, meta, options 를 localStorage에 저장한다.
 * last는 저장하지 않는다 (임시 데이터).
 *
 * @param {SessionState} session
 */
export function saveSession(session) {
  try {
    const toSave = {
      _version: SESSION_VERSION,
      best:     session.best,
      meta:     session.meta,
      options:  session.options,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('[SessionState] 저장 실패:', e);
  }
}

/**
 * localStorage에서 세션을 불러와 마이그레이션 후 반환한다.
 * 데이터 없거나 파싱 실패 시 기본값 반환.
 *
 * @returns {SessionState}
 */
export function loadSession() {
  const session = createSessionState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return session;

    const saved = JSON.parse(raw);

    // 버전 마이그레이션
    const version = saved._version ?? 1;
    if (version < SESSION_VERSION) {
      _migrate(saved, version);
    }

    // 저장된 값 복원 (필드별 안전 병합)
    if (saved.best)    Object.assign(session.best,    saved.best);
    if (saved.meta)    Object.assign(session.meta,    saved.meta);
    if (saved.options) Object.assign(session.options, saved.options);

    // permanentUpgrades 타입 보정
    if (typeof session.meta.permanentUpgrades !== 'object') {
      session.meta.permanentUpgrades = {};
    }
  } catch (e) {
    console.warn('[SessionState] 불러오기 실패, 기본값 사용:', e);
  }
  return session;
}

// ── 마이그레이션 ──────────────────────────────────────────────────────────

/**
 * 구버전 데이터를 v2 스키마로 업그레이드한다.
 * @param {object} saved    localStorage에서 읽은 원본 객체 (변이됨)
 * @param {number} fromVersion
 * @private
 */
function _migrate(saved, fromVersion) {
  if (fromVersion < 2) {
    // v1 → v2: meta 필드 추가
    if (!saved.meta) {
      saved.meta = { currency: 0, permanentUpgrades: {} };
    }
    saved._version = 2;
    console.info('[SessionState] v1 → v2 마이그레이션 완료');
  }
}

// ── JSDoc 타입 정의 ───────────────────────────────────────────────────────

/**
 * @typedef {Object} SessionState
 * @property {number}  _version
 * @property {{ kills: number, survivalTime: number, level: number, weaponsUsed: string[] }} last
 * @property {{ kills: number, survivalTime: number, level: number }} best
 * @property {{ currency: number, permanentUpgrades: Record<string, number> }} meta
 * @property {{ soundEnabled: boolean, musicEnabled: boolean, showFps: boolean }} options
 */

export {};
