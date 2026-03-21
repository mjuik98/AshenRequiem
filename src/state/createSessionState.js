/**
 * src/state/createSessionState.js
 *
 * ── 개선 P0: SessionState 단일 진실의 원천 ────────────────────────────────
 *
 * CHANGE (Settings): SESSION_VERSION 2 → 3, options 필드 확장
 *   - masterVolume, bgmVolume, sfxVolume : 볼륨 조절
 *   - quality                           : 렌더링 품질 프리셋 ('low'|'medium'|'high')
 *   - glowEnabled                       : 발광 효과 온오프
 *   - useDevicePixelRatio               : 고해상도 렌더링
 *   - v2 → v3 마이그레이션 추가 (기존 저장값 보존)
 */

const STORAGE_KEY      = 'ashenRequiem_session';
const SESSION_VERSION  = 5;

function _createDefaultLast() {
  return {
    kills:        0,
    survivalTime: 0,
    level:        1,
    weaponsUsed:  [],
  };
}

function _createDefaultBest() {
  return {
    kills:        0,
    survivalTime: 0,
    level:        1,
  };
}

function _createDefaultMeta() {
  return {
    currency:             0,
    permanentUpgrades:    {},
    enemyKills:           {},
    enemiesEncountered:   [],
    killedBosses:         [],
    weaponsUsedAll:       [],
    evolvedWeapons:       [],
    totalRuns:            0,
    unlockedWeapons:      ['magic_bolt'],
    unlockedAccessories:  [],
    completedUnlocks:     [],
    selectedStartWeaponId:'magic_bolt',
  };
}

function _createDefaultOptions() {
  return {
    soundEnabled:        true,
    musicEnabled:        true,
    masterVolume:        80,
    bgmVolume:           60,
    sfxVolume:           100,
    quality:             'medium',
    glowEnabled:         true,
    showFps:             false,
    useDevicePixelRatio: true,
  };
}

function _normalizeSessionState(state) {
  const defaults = createSessionState();
  const quality = state?.options?.quality;
  const normalizedQuality = quality === 'low' || quality === 'medium' || quality === 'high'
    ? quality
    : defaults.options.quality;

  return {
    _version: SESSION_VERSION,
    last: {
      ...defaults.last,
      ...(state?.last ?? {}),
      weaponsUsed: Array.isArray(state?.last?.weaponsUsed) ? [...state.last.weaponsUsed] : [],
    },
    best: {
      ...defaults.best,
      ...(state?.best ?? {}),
    },
    meta: {
      ...defaults.meta,
      ...(state?.meta ?? {}),
      permanentUpgrades: { ...(state?.meta?.permanentUpgrades ?? {}) },
      enemyKills: { ...(state?.meta?.enemyKills ?? {}) },
      unlockedWeapons: Array.isArray(state?.meta?.unlockedWeapons)
        ? [...state.meta.unlockedWeapons]
        : [...defaults.meta.unlockedWeapons],
      unlockedAccessories: Array.isArray(state?.meta?.unlockedAccessories)
        ? [...state.meta.unlockedAccessories]
        : [...defaults.meta.unlockedAccessories],
      completedUnlocks: Array.isArray(state?.meta?.completedUnlocks)
        ? [...state.meta.completedUnlocks]
        : [...defaults.meta.completedUnlocks],
      selectedStartWeaponId: typeof state?.meta?.selectedStartWeaponId === 'string'
        ? state.meta.selectedStartWeaponId
        : defaults.meta.selectedStartWeaponId,
    },
    options: {
      ...defaults.options,
      ...(state?.options ?? {}),
      quality: normalizedQuality,
    },
  };
}

// ── 기본값 생성 ───────────────────────────────────────────────────────────

/**
 * v3 세션 기본값 생성.
 * @returns {SessionState}
 */
export function createSessionState() {
  return {
    _version: SESSION_VERSION,

    /** 현재 런 최종 결과 (임시, 저장 안 함) */
    last: _createDefaultLast(),

    /** 역대 최고 기록 (각 축 독립 갱신) */
    best: _createDefaultBest(),

    /** Meta-Progression */
    meta: _createDefaultMeta(),

    /** UI / 설정 */
    options: _createDefaultOptions(),
  };
}

// ── 마이그레이션 ──────────────────────────────────────────────────────────

/**
 * localStorage에서 읽은 raw 데이터를 최신 버전으로 순차 마이그레이션한다.
 *
 * @param {object|null} raw  localStorage에서 읽은 원본 객체
 * @returns {SessionState}   최신 버전 SessionState
 */
function _migrate(raw) {
  if (!raw) return createSessionState();

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
    {
      from: 2,
      // v2 → v3: options 확장 (볼륨, 품질, 화면 설정)
      migrate(s) {
        return {
          ...s,
          _version: 3,
          options: {
            // 기존 필드 보존
            soundEnabled: s.options?.soundEnabled ?? true,
            musicEnabled: s.options?.musicEnabled ?? true,
            showFps:      s.options?.showFps      ?? false,
            // 신규 필드 — 기본값으로 초기화
            masterVolume:        s.options?.masterVolume        ?? 80,
            bgmVolume:           s.options?.bgmVolume           ?? 60,
            sfxVolume:           s.options?.sfxVolume           ?? 100,
            quality:             s.options?.quality             ?? 'medium',
            glowEnabled:         s.options?.glowEnabled         ?? true,
            useDevicePixelRatio: s.options?.useDevicePixelRatio ?? true,
          },
        };
      },
    },
    {
      from: 3,
      migrate(s) {
        return {
          ...s,
          _version: 4,
          meta: {
            ...s.meta,
            enemyKills:         s.meta?.enemyKills         ?? {},
            enemiesEncountered: s.meta?.enemiesEncountered ?? [],
            killedBosses:       s.meta?.killedBosses       ?? [],
            weaponsUsedAll:     s.meta?.weaponsUsedAll     ?? [],
            evolvedWeapons:     s.meta?.evolvedWeapons     ?? [],
            totalRuns:          s.meta?.totalRuns          ?? 0,
          },
        };
      },
    },
    {
      from: 4,
      migrate(s) {
        return {
          ...s,
          _version: 5,
          meta: {
            ...s.meta,
            unlockedWeapons: Array.isArray(s.meta?.unlockedWeapons) ? s.meta.unlockedWeapons : ['magic_bolt'],
            unlockedAccessories: Array.isArray(s.meta?.unlockedAccessories) ? s.meta.unlockedAccessories : [],
            completedUnlocks: Array.isArray(s.meta?.completedUnlocks) ? s.meta.completedUnlocks : [],
            selectedStartWeaponId: typeof s.meta?.selectedStartWeaponId === 'string'
              ? s.meta.selectedStartWeaponId
              : 'magic_bolt',
          },
        };
      },
    },
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

  return _normalizeSessionState(state);
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
    const normalized = _normalizeSessionState(session);
    const toSave = {
      _version: SESSION_VERSION,
      best:     normalized.best,
      meta:     normalized.meta,
      options:  normalized.options,
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
 * @property {{
 *   currency: number,
 *   permanentUpgrades: Record<string, number>,
 *   enemyKills: Record<string, number>,
 *   enemiesEncountered: string[],
 *   killedBosses: string[],
 *   weaponsUsedAll: string[],
 *   evolvedWeapons: string[],
 *   totalRuns: number,
 *   unlockedWeapons: string[],
 *   unlockedAccessories: string[],
 *   completedUnlocks: string[],
 *   selectedStartWeaponId: string
 * }} meta
 * @property {{
 *   soundEnabled: boolean,
 *   musicEnabled: boolean,
 *   masterVolume: number,
 *   bgmVolume: number,
 *   sfxVolume: number,
 *   quality: 'low'|'medium'|'high',
 *   glowEnabled: boolean,
 *   showFps: boolean,
 *   useDevicePixelRatio: boolean
 * }} options
 */

export {};
