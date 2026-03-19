/**
 * src/state/createSessionState.js
 *
 * ── 개선 P0: SessionState 단일 진실의 원천 ────────────────────────────────
 *
 * Before (버그):
 *   - 마이그레이션 로직이 이 파일과 NullSoundSystem.js 하단에 중복 정의됨.
 *   - best 필드명 불일치:
 *       createSessionState.js → { kills, survivalTime, level }
 *       NullSoundSystem.js   → { killCount, elapsedTime, playerLevel }
 *   - 버전 키 불일치: '_version' vs 'version'
 *   - _migrate()가 기존 데이터를 보존하지 않고 재초기화만 함.
 *
 * After (수정):
 *   - 이 파일이 SessionState 스키마 · 마이그레이션 · CRUD의 유일한 소스.
 *   - NullSoundSystem.js는 순수 NullObject만 보유 (SessionState 코드 없음).
 *   - best 필드명을 { kills, survivalTime, level }로 통일.
 *   - 버전 키를 '_version'으로 통일.
 *   - v0 → v1 → v2 순차 마이그레이션 체인으로 기존 데이터 보존.
 *
 * 규칙 (AGENTS.md §6.2):
 *   - 런 종료 시: updateSessionBest() → saveSession() 순서.
 *   - session.last: 이번 판 임시 결과, 영구 저장 안 함.
 *   - session.best: 각 필드별 독립 갱신 판정.
 */

const STORAGE_KEY      = 'ashenRequiem_session';
const SESSION_VERSION  = 2;

// ── 기본값 생성 ───────────────────────────────────────────────────────────

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

    /** 역대 최고 기록 (각 축 독립 갱신) */
    best: {
      kills:        0,
      survivalTime: 0,
      level:        1,
    },

    /** Meta-Progression */
    meta: {
      currency:          0,
      /** @type {Record<string, number>} upgradeId → 구매 횟수 */
      permanentUpgrades: {},
    },

    /** UI / 설정 */
    options: {
      soundEnabled: true,
      musicEnabled: true,
      showFps:      false,
    },
  };
}

// ── 마이그레이션 ──────────────────────────────────────────────────────────

/**
 * localStorage에서 읽은 raw 데이터를 최신 버전으로 순차 마이그레이션한다.
 * 새 버전 추가 방법:
 *   1. SESSION_VERSION 증가
 *   2. _migrations 배열에 { from, migrate } 항목 추가
 *   3. migrate()는 이전 버전 객체를 받아 다음 버전 객체를 반환
 *
 * @param {object|null} raw  localStorage에서 읽은 원본 객체
 * @returns {SessionState}   최신 버전 SessionState
 */
function _migrate(raw) {
  if (!raw) return createSessionState();

  // 버전 키 정규화: 구버전은 'version' 키를 사용했을 수 있음
  let state   = { ...raw };
  let version = state._version ?? state.version ?? 0;

  const migrations = [
    {
      from: 0,
      // v0 → v1: meta 필드 추가, 필드명 통일
      migrate(s) {
        return {
          ...s,
          _version: 1,
          best: {
            kills:        s.best?.kills        ?? s.best?.killCount        ?? 0,
            survivalTime: s.best?.survivalTime  ?? s.best?.elapsedTime     ?? 0,
            level:        s.best?.level         ?? s.best?.playerLevel     ?? 1,
          },
          meta: {
            currency:          s.meta?.currency          ?? 0,
            permanentUpgrades: s.meta?.permanentUpgrades ?? {},
          },
          options: {
            soundEnabled: s.options?.soundEnabled ?? s.options?.soundOn ?? true,
            musicEnabled: s.options?.musicEnabled ?? true,
            showFps:      s.options?.showFps      ?? false,
          },
        };
      },
    },
    {
      from: 1,
      // v1 → v2: last 필드 추가
      migrate(s) {
        return {
          ...s,
          _version: 2,
          last: {
            kills:        s.last?.kills        ?? 0,
            survivalTime: s.last?.survivalTime  ?? 0,
            level:        s.last?.level         ?? 1,
            weaponsUsed:  s.last?.weaponsUsed   ?? [],
          },
        };
      },
    },
    // 향후 v2 → v3 마이그레이션은 여기에 추가:
    // {
    //   from: 2,
    //   migrate(s) {
    //     return { ...s, _version: 3, newField: defaultValue };
    //   },
    // },
  ];

  for (const m of migrations) {
    if (version === m.from) {
      state   = m.migrate(state);
      version = state._version;
    }
  }

  // 미래 버전 데이터 → 안전하게 기본값으로 fallback
  if (version > SESSION_VERSION) {
    console.warn(
      `[SessionState] 저장 버전(${version})이 현재(${SESSION_VERSION})보다 높음 — 기본값으로 초기화`,
    );
    return createSessionState();
  }

  return /** @type {SessionState} */ (state);
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

  session.last = {
    kills:        runResult.kills        ?? 0,
    survivalTime: runResult.survivalTime ?? 0,
    level:        runResult.level        ?? 1,
    weaponsUsed:  runResult.weaponsUsed  ?? [],
  };
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSessionState();
    return _migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('[SessionState] 불러오기 실패, 기본값 사용:', e);
    return createSessionState();
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
