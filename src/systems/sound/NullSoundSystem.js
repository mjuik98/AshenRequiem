/**
 * src/systems/sound/NullSoundSystem.js
 *
 * [개선 P3] NullSoundSystem — soundSystem null 분기 완전 제거
 *
 * Before:
 *   services.soundSystem이 null일 수 있어 각 System에서
 *   if (services.soundSystem) 체크를 반복해야 함.
 *   → 체크 누락 시 런타임 에러.
 *
 * After:
 *   NullSoundSystem을 기본값으로 사용하면 null 체크 불필요.
 *   모든 메서드가 no-op이므로 사운드 비활성화 시에도 코드 흐름 동일.
 *
 * 사용법:
 *   // PlayContext.create() 에서
 *   ctx.soundSystem = options.soundEnabled
 *     ? new SoundSystem()
 *     : new NullSoundSystem();  // null 대신 NullSoundSystem
 *
 *   // 각 System에서 null 체크 없이 직접 호출 가능
 *   services.soundSystem.play('sfx_hit');    // 비활성화 시 조용히 no-op
 *   services.soundSystem.playBgm('bgm_play'); // null 체크 불필요
 */
export class NullSoundSystem {
  /** @param {string} _id  에셋 id (무시) */
  play(_id) {}

  /** @param {string} _id */
  playBgm(_id) {}

  stopBgm() {}

  /** @param {number} _volume */
  setVolume(_volume) {}

  /** @param {boolean} _enabled */
  setEnabled(_enabled) {}

  get isEnabled() { return false; }
}

// ─── 적용 후 각 System의 패턴 변화 예시 ─────────────────────────────
//
// Before (null 체크 필요):
//   if (services.soundSystem) {
//     services.soundSystem.play('sfx_hit');
//   }
//
// After (NullSoundSystem 도입 후):
//   services.soundSystem.play('sfx_hit');  // null 체크 불필요


/**
 * [개선 P3] SessionState 버전 마이그레이션 체인
 *
 * src/state/createSessionState.js 의 _migrateSession() 함수를
 * 아래 버전 체인 패턴으로 교체한다.
 *
 * Before:
 *   단순 버전 비교 후 기본값으로 재초기화 (기존 데이터 유실 위험).
 *
 * After:
 *   v1→v2→v3 순차 마이그레이션으로 기존 데이터를 보존하면서
 *   새 필드를 안전하게 추가한다.
 */

/** @type {number} 현재 저장 버전 (필드 구조 변경 시 증가) */
export const CURRENT_STORAGE_VERSION = 2;

/**
 * 저장된 state를 최신 버전으로 순차 마이그레이션한다.
 *
 * 새 버전 추가 방법:
 *   1. CURRENT_STORAGE_VERSION 증가
 *   2. migrations 배열에 { from, migrate } 항목 추가
 *   3. migrate()는 이전 버전 state를 받아 다음 버전 state 반환
 *
 * @param {object|null} state  localStorage에서 불러온 raw 데이터
 * @returns {object}           최신 버전 SessionState
 */
export function migrateSession(state) {
  if (!state) return _createDefault();

  let current = state;
  let version = current.version ?? 0;

  // 버전별 마이그레이션 체인
  const migrations = [
    {
      from: 0,
      migrate(s) {
        // v0 → v1: meta 필드 추가
        return {
          ...s,
          version: 1,
          meta: {
            currency:          0,
            permanentUpgrades: {},
          },
          options: {
            soundOn: true,
          },
        };
      },
    },
    {
      from: 1,
      migrate(s) {
        // v1 → v2: best.playerLevel 필드 추가
        return {
          ...s,
          version: 2,
          best: {
            ...s.best,
            playerLevel: s.best?.playerLevel ?? 1,
          },
        };
      },
    },
    // 향후 v2 → v3 마이그레이션은 여기에 추가:
    // {
    //   from: 2,
    //   migrate(s) {
    //     return { ...s, version: 3, newField: defaultValue };
    //   },
    // },
  ];

  // 순차 적용
  for (const m of migrations) {
    if (version === m.from) {
      current = m.migrate(current);
      version = current.version;
    }
  }

  // 최신 버전보다 높은 미래 데이터는 안전하게 fallback
  if (version > CURRENT_STORAGE_VERSION) {
    console.warn(
      `[SessionState] 저장 버전(${version})이 현재(${CURRENT_STORAGE_VERSION})보다 높음 — 기본값으로 초기화`
    );
    return _createDefault();
  }

  return current;
}

function _createDefault() {
  return {
    version: CURRENT_STORAGE_VERSION,
    best: { killCount: 0, elapsedTime: 0, playerLevel: 1 },
    last: null,
    meta: { currency: 0, permanentUpgrades: {} },
    options: { soundOn: true },
  };
}

// ─── tests/SessionState.test.js 추가 권장 테스트 케이스 ──────────────
//
// test('v0 데이터 → v2로 마이그레이션 시 meta 필드 생성됨', () => {
//   const v0 = { version: 0, best: { killCount: 42 }, last: null };
//   const result = migrateSession(v0);
//   assert.equal(result.version, CURRENT_STORAGE_VERSION);
//   assert.ok(result.meta, 'meta 필드 없음');
//   assert.equal(result.best.killCount, 42, '기존 best 데이터 유실');
// });
//
// test('null state → 기본값 반환', () => {
//   const result = migrateSession(null);
//   assert.equal(result.version, CURRENT_STORAGE_VERSION);
//   assert.equal(result.best.killCount, 0);
// });
//
// test('미래 버전 state → 기본값으로 안전 fallback', () => {
//   const future = { version: 999, best: { killCount: 99 } };
//   const result = migrateSession(future);
//   assert.equal(result.best.killCount, 0, '미래 버전에서 기존 데이터 사용됨');
// });
