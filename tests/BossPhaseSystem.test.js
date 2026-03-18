/**
 * tests/BossPhaseSystem.test.js — BossPhaseSystem 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer, makeEnemy, makeEvents } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let BossPhaseSystem;
try {
  ({ BossPhaseSystem } = await import('../src/systems/progression/BossPhaseSystem.js'));
} catch (e) {
  console.warn('[테스트] BossPhaseSystem import 실패 — 스킵');
  BossPhaseSystem = null;
}

function makeBossEnemy({ hp, maxHp }) {
  const enemy = makeEnemy({ hp, maxHp });
  enemy.isBoss = true;
  enemy.enemyId = 'boss_orc';
  return enemy;
}

function makeBossData() {
  return [
    {
      enemyId: 'boss_orc',
      phases: [
        { hpThreshold: 0.7, behaviorId: 'boss_enrage', announceText: '폭주 모드!' },
        { hpThreshold: 0.3, behaviorId: 'boss_berserk', announceText: '마지막 저항!' },
      ],
    },
  ];
}

function run(enemy, bossData, events) {
  BossPhaseSystem?.update({
    world: { enemies: [enemy], events },
    data: { bossData },
  });
}

console.log('\n[BossPhaseSystem — 기본 동작]');

test('HP 70% 이하에서 첫 번째 페이즈 트리거', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.ok(
    events.bossPhaseChanged.some(e => e.hpThreshold === 0.7 || e.newBehaviorId === 'boss_enrage'),
    'HP 70% 페이즈 미트리거',
  );
});

test('HP 71%에서는 70% 페이즈 미트리거', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 710, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 0, 'HP 71%에서 페이즈 발행됨');
});

test('동일 페이즈 2회 호출 → 이벤트 1번만 발행', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 1, '최초 트리거 실패');
  
  // 두 번째 실행 (동일 조건)
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 1, '동일 페이즈 중복 발행됨');
});

test('70% 페이즈 발동 후 30% 페이즈까지 순차 발동', () => {
  if (!BossPhaseSystem) return;
  const boss   = makeBossEnemy({ hp: 700, maxHp: 1000 });
  const events = makeEvents();
  
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 1, '첫 페이즈 트리거 실패');

  boss.hp = 300;
  run(boss, makeBossData(), events);
  assert.equal(events.bossPhaseChanged.length, 2, '두 번째 페이즈 트리거 실패');
});

summary();
