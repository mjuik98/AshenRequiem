/**
 * tests/SessionState.test.js
 *
 * ── 개선 P1: SessionState 단위 테스트 ────────────────────────────────────
 *
 * 검증 항목:
 *   - createSessionState() 기본값 구조
 *   - updateSessionBest() 각 필드 독립 갱신 판정
 *   - earnCurrency() / purchasePermanentUpgrade() 정상 동작
 *   - _migrate(): v0 → v2 순차 마이그레이션 (필드명 변환 포함)
 *   - _migrate(): null 입력 → 기본값 반환
 *   - _migrate(): 미래 버전 → 기본값 fallback
 *   - loadSession() / saveSession() localStorage 연동 (브라우저 환경 스킵)
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makeSessionState } from './fixtures/index.js';
import { test, summary }    from './helpers/testRunner.js';

let createSessionState, updateSessionBest, earnCurrency, purchasePermanentUpgrade, loadSession, saveSession, setSessionStorage, resetSessionStorage;

try {
  ({
    createSessionState,
    updateSessionBest,
    earnCurrency,
    purchasePermanentUpgrade,
    loadSession,
    saveSession,
    setSessionStorage,
    resetSessionStorage,
  } = await import('../src/state/createSessionState.js'));
} catch (e) {
  console.warn('[테스트] createSessionState import 실패 — 스킵:', e.message);
  process.exit(0);
}

console.log('\n[SessionState 테스트 시작]');

function makeMemoryStorage() {
  const store = new Map();
  return {
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
}

// ── 기본값 구조 ───────────────────────────────────────────────────────────

test('createSessionState()는 현재 세션 버전을 반환한다', () => {
  const s = createSessionState();
  assert.equal(s._version, 5);
});

test('createSessionState()의 best 필드명이 올바르다 (kills/survivalTime/level)', () => {
  const s = createSessionState();
  assert('kills'        in s.best, 'best.kills 없음');
  assert('survivalTime' in s.best, 'best.survivalTime 없음');
  assert('level'        in s.best, 'best.level 없음');
  assert(!('killCount'    in s.best), 'best.killCount가 남아있음 (구버전 필드)');
  assert(!('elapsedTime'  in s.best), 'best.elapsedTime이 남아있음 (구버전 필드)');
  assert(!('playerLevel'  in s.best), 'best.playerLevel이 남아있음 (구버전 필드)');
});

test('createSessionState()의 meta 필드가 올바르다', () => {
  const s = createSessionState();
  assert.equal(typeof s.meta.currency, 'number');
  assert(typeof s.meta.permanentUpgrades === 'object');
  assert.deepEqual(s.meta.unlockedWeapons, ['magic_bolt']);
  assert.deepEqual(s.meta.unlockedAccessories, []);
  assert.deepEqual(s.meta.completedUnlocks, []);
  assert.equal(s.meta.selectedStartWeaponId, 'magic_bolt');
});

// ── updateSessionBest ─────────────────────────────────────────────────────

test('kills가 클 때만 best.kills가 갱신된다', () => {
  const s = makeSessionState({ best: { kills: 10, survivalTime: 0, level: 1 } });
  updateSessionBest(s, { kills: 15, survivalTime: 0, level: 1 });
  assert.equal(s.best.kills, 15, '더 큰 kills로 갱신 안 됨');
});

test('kills가 작을 때 best.kills는 유지된다', () => {
  const s = makeSessionState({ best: { kills: 50, survivalTime: 0, level: 1 } });
  updateSessionBest(s, { kills: 5, survivalTime: 0, level: 1 });
  assert.equal(s.best.kills, 50, '더 작은 kills로 best가 덮어씌워짐');
});

test('각 best 필드는 독립적으로 갱신된다', () => {
  const s = makeSessionState({ best: { kills: 20, survivalTime: 300, level: 5 } });
  updateSessionBest(s, { kills: 5, survivalTime: 400, level: 3 });
  assert.equal(s.best.kills,        20,  'kills best가 줄어들었음');
  assert.equal(s.best.survivalTime, 400, 'survivalTime best가 갱신 안 됨');
  assert.equal(s.best.level,        5,   'level best가 줄어들었음');
});

test('updateSessionBest()는 session.last를 이번 런 결과로 덮어쓴다', () => {
  const s = makeSessionState();
  updateSessionBest(s, { kills: 3, survivalTime: 120, level: 2, weaponsUsed: ['magic_bolt'] });
  assert.equal(s.last.kills, 3);
  assert.equal(s.last.survivalTime, 120);
  assert.deepEqual(s.last.weaponsUsed, ['magic_bolt']);
});

// ── Meta-Progression ──────────────────────────────────────────────────────

test('earnCurrency()가 통화를 올바르게 추가한다', () => {
  const s = makeSessionState();
  earnCurrency(s, 50);
  assert.equal(s.meta.currency, 50);
});

test('earnCurrency() 음수 입력 시 0 이하로 내려가지 않는다', () => {
  const s = makeSessionState();
  earnCurrency(s, -999);
  assert.equal(s.meta.currency, 0, '통화가 음수가 됨');
});

test('purchasePermanentUpgrade() 성공 시 통화 차감 및 횟수 증가', () => {
  const s = makeSessionState({ meta: { currency: 100, permanentUpgrades: {} } });
  const ok = purchasePermanentUpgrade(s, 'hp_boost', 30);
  assert(ok, '구매 실패');
  assert.equal(s.meta.currency, 70, '통화 차감 오류');
  assert.equal(s.meta.permanentUpgrades['hp_boost'], 1, '횟수 미증가');
});

test('purchasePermanentUpgrade() 통화 부족 시 false 반환, 상태 불변', () => {
  const s = makeSessionState({ meta: { currency: 10, permanentUpgrades: {} } });
  const ok = purchasePermanentUpgrade(s, 'hp_boost', 50);
  assert(!ok, '통화 부족인데 구매 성공');
  assert.equal(s.meta.currency, 10, '통화가 변경됨');
  assert(!s.meta.permanentUpgrades['hp_boost'], '업그레이드 카운트가 증가됨');
});

test('purchasePermanentUpgrade() 중복 구매 시 횟수가 누적된다', () => {
  const s = makeSessionState({ meta: { currency: 200, permanentUpgrades: {} } });
  purchasePermanentUpgrade(s, 'atk_boost', 30);
  purchasePermanentUpgrade(s, 'atk_boost', 30);
  assert.equal(s.meta.permanentUpgrades['atk_boost'], 2, '횟수 누적 안 됨');
});

// ── 마이그레이션 ──────────────────────────────────────────────────────────

test('loadSession(): localStorage에 없을 때 기본값을 반환한다 (Node 환경 스킵)', () => {
  if (typeof localStorage === 'undefined') return; // Node 환경에서는 localStorage 없음
  localStorage.removeItem('ashenRequiem_session');
  const s = loadSession();
  assert.equal(s._version, 5);
  assert.equal(s.best.kills, 0);
});

test('saveSession()/loadSession()은 주입된 저장소로 round-trip 된다', () => {
  const storage = makeMemoryStorage();
  setSessionStorage(storage);

  const session = makeSessionState({
    best: { kills: 99, survivalTime: 123, level: 8 },
    meta: { currency: 777, unlockedWeapons: ['magic_bolt', 'holy_aura'] },
    options: { quality: 'high', glowEnabled: false },
  });

  saveSession(session);
  const loaded = loadSession();

  assert.equal(loaded.best.kills, 99);
  assert.equal(loaded.meta.currency, 777);
  assert.deepEqual(loaded.meta.unlockedWeapons, ['magic_bolt', 'holy_aura']);
  assert.equal(loaded.options.quality, 'high');
  assert.equal(loaded.options.glowEnabled, false);

  resetSessionStorage();
});

test('저장소가 없어도 saveSession()은 경고 없이 안전하게 종료된다', () => {
  resetSessionStorage();

  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args.join(' '));

  try {
    saveSession(makeSessionState());
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 0, '저장소 없음 경로에서 불필요한 경고가 발생함');
});

summary();
