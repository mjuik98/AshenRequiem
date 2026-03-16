/**
 * createSessionState — 세션 상태 초기화 및 localStorage 연동
 *
 * 역할:
 *   - 최고 기록(킬 수, 생존 시간, 최고 레벨) 영구 저장
 *   - 마지막 런 결과 임시 보관 (결과 화면 표시용)
 *   - 사운드 on/off 등 사용자 옵션 저장
 *
 * 계약:
 *   - 읽기: localStorage 에서 초기값 복원
 *   - 쓰기: saveSession() 호출 시 localStorage 저장
 *   - 출력: 없음
 *
 * 사용 방법:
 *   // PlayScene.enter()
 *   const session = createSessionState();
 *
 *   // 런 종료 시 (PlayScene._showResultUI 등에서)
 *   updateSessionBest(session, {
 *     killCount:    world.killCount,
 *     elapsedTime:  world.elapsedTime,
 *     playerLevel:  world.player.level,
 *   });
 *   saveSession(session);
 *
 *   // 결과 화면에서 읽기
 *   session.best.killCount   // 역대 최다 킬
 *   session.last.elapsedTime // 이번 런 생존 시간
 *   session.options.soundOn  // 사운드 설정
 */

const STORAGE_KEY = 'vamplike_session';

// ── 타입 정의 (JSDoc) ─────────────────────────────────────────
/**
 * @typedef {Object} RunResult
 * @property {number} killCount    - 처치 수
 * @property {number} elapsedTime  - 생존 시간 (초)
 * @property {number} playerLevel  - 도달 레벨
 */

/**
 * @typedef {Object} SessionState
 * @property {RunResult} best    - 역대 최고 기록
 * @property {RunResult|null} last - 마지막 런 결과
 * @property {{ soundOn: boolean }} options - 사용자 설정
 */

// ── 기본값 ────────────────────────────────────────────────────

function defaultBest() {
  return { killCount: 0, elapsedTime: 0, playerLevel: 1 };
}

function defaultOptions() {
  return { soundOn: true };
}

// ── 생성 ──────────────────────────────────────────────────────

/**
 * sessionState를 초기화한다.
 * localStorage에 저장된 값이 있으면 복원하고, 없으면 기본값을 사용한다.
 *
 * @returns {SessionState}
 */
export function createSessionState() {
  const saved = _loadFromStorage();

  return {
    best: {
      killCount:   saved?.best?.killCount   ?? 0,
      elapsedTime: saved?.best?.elapsedTime ?? 0,
      playerLevel: saved?.best?.playerLevel ?? 1,
    },
    last: null, // 이번 세션 내 마지막 런 결과 (저장 안 함)
    options: {
      soundOn: saved?.options?.soundOn ?? true,
    },
  };
}

// ── 갱신 ──────────────────────────────────────────────────────

/**
 * 런 종료 후 최고 기록을 갱신하고 last에 결과를 기록한다.
 * saveSession()을 별도로 호출해야 localStorage에 저장된다.
 *
 * @param {SessionState} session
 * @param {RunResult} result - 이번 런 결과
 */
export function updateSessionBest(session, result) {
  session.last = {
    killCount:   result.killCount   ?? 0,
    elapsedTime: result.elapsedTime ?? 0,
    playerLevel: result.playerLevel ?? 1,
  };

  let updated = false;

  if (result.killCount > session.best.killCount) {
    session.best.killCount = result.killCount;
    updated = true;
  }
  if (result.elapsedTime > session.best.elapsedTime) {
    session.best.elapsedTime = result.elapsedTime;
    updated = true;
  }
  if (result.playerLevel > session.best.playerLevel) {
    session.best.playerLevel = result.playerLevel;
    updated = true;
  }

  if (updated) {
    console.debug('[SessionState] 최고 기록 갱신:', session.best);
  }
}

/**
 * 사운드 설정을 변경하고 즉시 저장한다.
 *
 * @param {SessionState} session
 * @param {boolean} enabled
 */
export function setSessionSound(session, enabled) {
  session.options.soundOn = enabled;
  saveSession(session);
}

// ── 저장 / 불러오기 ───────────────────────────────────────────

/**
 * 현재 세션 상태를 localStorage에 저장한다.
 * last는 저장하지 않는다 (런 임시 데이터이므로).
 *
 * @param {SessionState} session
 */
export function saveSession(session) {
  try {
    const payload = {
      best:    session.best,
      options: session.options,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // localStorage 쓰기 실패 (프라이빗 브라우저 모드 등) — 무음 처리
    console.warn('[SessionState] localStorage 저장 실패:', e.message);
  }
}

/**
 * localStorage에서 세션 데이터를 불러온다.
 * 파싱 실패 또는 데이터 없음이면 null 반환.
 *
 * @returns {object|null}
 * @private
 */
function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    console.warn('[SessionState] localStorage 읽기 실패 — 기본값 사용');
    return null;
  }
}

/**
 * 저장된 기록을 초기화한다.
 * (설정 화면 "기록 초기화" 버튼 등에서 사용)
 *
 * @param {SessionState} session
 */
export function resetSession(session) {
  session.best    = defaultBest();
  session.last    = null;
  session.options = defaultOptions();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무음 처리
  }
  console.debug('[SessionState] 기록 초기화 완료');
}

// ── 유틸: 표시용 포맷 ────────────────────────────────────────

/**
 * 생존 시간을 "MM:SS" 형식으로 변환한다.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatElapsedTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
