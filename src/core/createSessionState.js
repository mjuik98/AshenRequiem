/**
 * src/core/createSessionState.js
 *
 * [개선 P2] localStorage 스키마 버전 관리 추가
 *
 * Before:
 *   schemaVersion 필드가 없어, Phase 2 메타 진행 데이터 추가 / 필드 이름 변경 시
 *   기존 localStorage 값이 부분 로드되거나 undefined 필드가 남아 런타임 오류 유발.
 *
 * After:
 *   SAVE_VERSION 상수를 두고, loadSession() 시 버전 불일치를 감지하면
 *   자동 마이그레이션(migrateSession)을 수행하거나 안전하게 초기값으로 대체.
 *
 * 마이그레이션 추가 방법:
 *   1. SAVE_VERSION을 올린다.
 *   2. migrateSession() 내부에 해당 버전 분기를 추가한다.
 *   3. 기존 localStorage 구조를 새 구조로 변환하는 코드를 작성한다.
 *   4. AGENTS.md §3 Architecture Changes Log에 변경 기록을 남긴다.
 *
 * 사용 예:
 *   import { createSessionState, loadSession, saveSession, updateSessionBest } from './createSessionState.js';
 *
 *   const session = loadSession();          // 저장 데이터 로드 (없으면 초기값)
 *   updateSessionBest(session, runResult);  // 각 축별 기록 갱신 판정
 *   saveSession(session);                  // localStorage 저장
 */

/** 현재 저장 스키마 버전. 구조 변경 시 반드시 올린다. */
export const SAVE_VERSION = 2;

const STORAGE_KEY = 'ashen-requiem-session';

// ─────────────────────────────────────────────────────────────
// 기본값 팩토리
// ─────────────────────────────────────────────────────────────

/**
 * 빈 세션 상태를 생성한다. (저장 데이터 없거나 마이그레이션 실패 시 사용)
 *
 * @returns {SessionState}
 */
export function createSessionState() {
  return {
    schemaVersion: SAVE_VERSION,

    /** 이번 런 임시 결과 (영구 저장 안 함) */
    last: {
      kills:        0,
      survivalTime: 0,
      level:        1,
      wave:         0,
    },

    /** 각 기록 축별 최고 기록 (영구 저장) */
    best: {
      kills:        0,
      survivalTime: 0,
      level:        1,
    },

    /**
     * [Phase 2] 메타 진행 — 런 종료 시 획득한 소울로 영구 능력치 강화.
     * 필드를 추가할 때 migrateSession()에도 기본값 설정 코드를 추가한다.
     */
    meta: {
      souls:        0,    // 누적 소울 (런 간 유지)
      permanentHp:  0,    // 영구 최대 체력 보너스
      permanentSpd: 0,    // 영구 이동속도 보너스
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 마이그레이션
// ─────────────────────────────────────────────────────────────

/**
 * 이전 버전 저장 데이터를 현재 버전으로 마이그레이션한다.
 * 버전 불일치가 감지될 때만 호출된다.
 *
 * 새 버전 추가 시: `if (data.schemaVersion < N)` 블록을 순서대로 추가한다.
 * 각 블록은 한 버전씩 올리는 최소 변환만 수행한다 (멱등성 보장).
 *
 * @param {object} data  로드된 raw 저장 데이터
 * @returns {SessionState}  마이그레이션된 세션 상태
 */
function migrateSession(data) {
  // v1 → v2: meta 필드 신규 추가 (Phase 2)
  if ((data.schemaVersion ?? 1) < 2) {
    data.meta = {
      souls:        0,
      permanentHp:  0,
      permanentSpd: 0,
    };
    data.schemaVersion = 2;
    console.log('[createSessionState] 세션 스키마 v1 → v2 마이그레이션 완료');
  }

  // v2 → v3 예시 (미래 버전):
  // if (data.schemaVersion < 3) {
  //   data.meta.permanentDamage = 0;
  //   data.schemaVersion = 3;
  // }

  return data;
}

// ─────────────────────────────────────────────────────────────
// localStorage I/O
// ─────────────────────────────────────────────────────────────

/**
 * localStorage에서 세션을 로드한다.
 * 저장 데이터 없음 / 파싱 실패 / 버전 불일치 → 마이그레이션 또는 초기값 반환.
 *
 * @returns {SessionState}
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSessionState();

    const data = JSON.parse(raw);

    if (!data || typeof data !== 'object') {
      console.warn('[createSessionState] 저장 데이터 파싱 오류 — 초기값으로 대체');
      return createSessionState();
    }

    // 버전 불일치 → 마이그레이션 시도
    if ((data.schemaVersion ?? 1) < SAVE_VERSION) {
      return migrateSession(data);
    }

    // 미래 버전 (다운그레이드 방지)
    if (data.schemaVersion > SAVE_VERSION) {
      console.warn('[createSessionState] 저장 버전이 현재보다 높음 — 초기값으로 대체');
      return createSessionState();
    }

    return data;
  } catch (e) {
    console.warn('[createSessionState] 로드 실패:', e.message, '— 초기값으로 대체');
    return createSessionState();
  }
}

/**
 * 세션을 localStorage에 저장한다.
 * session.last는 임시 데이터이므로 저장에서 제외한다.
 *
 * 규칙 (AGENTS.md §6.2):
 *   반드시 updateSessionBest() 호출 후 saveSession() 순서를 지킨다.
 *
 * @param {SessionState} session
 */
export function saveSession(session) {
  try {
    // last는 영구 저장 대상 아님 — 저장 시 제외
    const { last: _last, ...persistent } = session;
    persistent.schemaVersion = SAVE_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
  } catch (e) {
    console.warn('[createSessionState] 저장 실패:', e.message);
  }
}

/**
 * 이번 런 결과로 best 기록을 갱신한다.
 * 각 축별로 독립적으로 판정하여 덮어쓰지 않는다.
 *
 * 규칙 (AGENTS.md §6.2): saveSession() 이전에 반드시 이 함수를 먼저 호출한다.
 *
 * @param {SessionState} session
 * @param {{ kills: number, survivalTime: number, level: number }} runResult
 */
export function updateSessionBest(session, runResult) {
  const b = session.best;
  if ((runResult.kills        ?? 0) > (b.kills        ?? 0)) b.kills        = runResult.kills;
  if ((runResult.survivalTime ?? 0) > (b.survivalTime ?? 0)) b.survivalTime = runResult.survivalTime;
  if ((runResult.level        ?? 1) > (b.level        ?? 1)) b.level        = runResult.level;
  session.last = { ...runResult };
}

/**
 * 세션 저장 데이터를 삭제하고 초기값으로 초기화한다.
 * 개발 디버그 또는 설정 화면 "기록 초기화" 버튼용.
 *
 * @returns {SessionState}  새 빈 세션
 */
export function resetSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[createSessionState] 초기화 실패:', e.message);
  }
  return createSessionState();
}

/**
 * @typedef {Object} SessionState
 * @property {number} schemaVersion
 * @property {{ kills: number, survivalTime: number, level: number, wave: number }} last
 * @property {{ kills: number, survivalTime: number, level: number }} best
 * @property {{ souls: number, permanentHp: number, permanentSpd: number }} meta
 */
