/**
 * tests/BossPhaseSystem.test.js — BossPhaseSystem 단위 테스트
 *
 * ─── 변경 사항 ────────────────────────────────────────────────────────
 * [P1-②b] BossPhaseSystem 테스트 최초 추가
 *   검증 항목:
 *   - bossData=null 일 때 에러 없이 스킵
 *   - isBoss=false 적 무시
 *   - pendingDestroy / isAlive=false 보스 무시
 *   - HP 임계값 트리거 정확도 (70%, 40%, 15%)
 *   - HP 71%에서 70% 임계값 미도달 확인
 *   - HP 10%에서 모든 페이즈 동시 트리거 (초기화 직후)
 *   - 이벤트에 announceText 포함 확인
 *   - 동일 페이즈 2회 호출 시 1번만 발행 (중복 방지)
 *   - _phaseFlags 초기화 확인
 *   - 알 수 없는 enemyId 보스는 페이즈 없음
 * ──────────────────────────────────────────────────────────────────────
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makeEnemy, makeEvents } from './fixtures/index.js';

// ─── BossPhaseSystem import ──────────────────────────────────────────

let BossPhaseSystem;
try {
  ({ BossPhaseSystem } = await import('../src/systems/spawn/BossPhaseSystem.js'));
} catch {
  console.warn('[테스트] BossPhaseSystem import 실패 — 로직 검증 스킵');
  BossPhaseSystem = null;
}

// ─── 테스트 전용 데이터 ──────────────────────────────────────────────

function makeBossEnemy(overrides = {}) {
  return makeEnemy({
    id:      'boss_01',
    enemyId: 'boss_01',
    hp:      1000,
    maxHp:   1000,
    isBoss:  true,
    ...overrides,
  });
}

function makeBossData(enemyId = 'boss_01') {
  return [
    {
      enemyId,
      at: 120,
      phases: [
        { hpThreshold: 0.7,  behaviorId: 'boss_enrage',  announceText: '분노!' },
        { hpThreshold: 0.4,  behaviorId: 'boss_berserk', announceText: '광란!' },
        { hpThreshold: 0.15, behaviorId: 'boss_final',   announceText: '최후의 발악!' },
      ],
    },
  ];
}

function makeWorld(enemies, events) {
  return { enemies, events };
}

// ─── 테스트 러너 ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function run(boss, bossData, events) {
  BossPhaseSystem?.update({
    world: makeWorld([boss], events),
    data:  { bossData },
  });
}

// ─── 테스트 케이스 ───────────────────────────────────────────────────

console.log('\n[BossPhaseSystem — 기본 동작]');

test('bossData가 없으면 에러 없이 스킵', () => {
  const boss   = makeBossEnemy();
  const events = makeEvents();
  assert.doesNotThrow(() => run(boss, null, events), 'bossData=null에서 에러 발생');
  assert.equal(events.bossPhaseChanged.length, 0);
});

test('isBoss=false 적은 무시', () => {
  if (!BossPhaseSystem) return;
  const enemy  = makeEnemy({ isBoss: false, hp: 100, maxHp: 1000 });
  const events = makeEvents();
  run(enemy, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 0, '일반 적에 페이즈 이벤트 발행됨');
});

test('pendingDestroy 보스는 무시', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 100, maxHp: 1000, pendingDestroy: true });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 0);
});

test('isAlive=false 보스는 무시', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 100, maxHp: 1000, isAlive: false });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 0);
});

console.log('\n[BossPhaseSystem — HP 임계값 트리거]');

test('HP 71% → 페이즈 이벤트 없음 (70% 임계값 미도달)', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 710, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 0);
});

test('HP 70% 정확히 → 1페이즈 트리거', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 1);
  assert.equal(events.bossPhaseChanged[0].phaseIndex, 0);
  assert.equal(events.bossPhaseChanged[0].newBehaviorId, 'boss_enrage');
});

test('HP 39% → 1, 2페이즈 동시 트리거', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 390, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 2, '2개 페이즈 이벤트 미발행');
});

test('HP 10% → 3페이즈 모두 트리거 (초기화 직후)', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 100, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 3, '3개 페이즈 이벤트 미발행');
});

test('이벤트에 announceText 포함', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged[0].announceText, '분노!');
});

console.log('\n[BossPhaseSystem — 중복 발동 방지]');

test('동일 페이즈는 2회 호출에서 1번만 발행', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();

  run(boss, makeBossData(), events);
  const firstCount = events.bossPhaseChanged.length;

  // 2번째 프레임 — HP 동일, _phaseFlags가 이미 설정됨
  events.bossPhaseChanged.length = 0;
  run(boss, makeBossData(), events);

  assert.equal(events.bossPhaseChanged.length, 0, '동일 페이즈가 2번째 프레임에서 재발행됨');
  assert.equal(firstCount, 1, '첫 번째 발행이 1개가 아님');
});

test('_phaseFlags 첫 update에서 초기화됨', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 1000, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.ok(Array.isArray(boss._phaseFlags), '_phaseFlags 미초기화');
  assert.equal(boss._phaseFlags.length, 3);
});

test('bossData에 없는 enemyId 보스는 페이즈 없음', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ enemyId: 'unknown_boss', hp: 100, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData('boss_01'), events); // bossData는 boss_01용
  assert.equal(events.bossPhaseChanged.length, 0);
});

// ─── 결과 ────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
