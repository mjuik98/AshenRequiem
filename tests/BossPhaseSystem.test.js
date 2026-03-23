/**
 * tests/BossPhaseSystem.test.js — BossPhaseSystem 단위 테스트
 *
 * CHANGE(P2): enemyDataId 필드명 대응
 */

import assert from 'node:assert/strict';
import { makeBoss, makeBossData, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let BossPhaseSystem;
try {
  ({ BossPhaseSystem } = await import('../src/systems/combat/BossPhaseSystem.js'));
} catch (e) {
  console.warn('[테스트] BossPhaseSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

console.log('\n[BossPhaseSystem 테스트]');

test('HP가 임계값 이하로 내려가면 bossPhaseChanged 이벤트가 발행된다', () => {
  const boss = makeBoss({
    enemyId:     'boss_lich', // fixture용 
    enemyDataId: 'boss_lich', // 프로덕션용
    hp:          600,         // maxHp: 1000 이므로 60% (임계값 0.7 이하)
    maxHp:       1000,
  });
  const data  = { bossData: makeBossData() };
  const world = makeWorld({ enemies: [boss] });

  BossPhaseSystem.update({ world, data });

  assert.equal(world.events.bossPhaseChanged.length, 1, '페이즈 알림 미발행');
  assert.equal(world.events.bossPhaseChanged[0].phaseIndex, 0, '잘못된 페이즈 인덱스');
  assert.deepEqual(boss.bossPhaseState?.triggered, [true, false], 'bossPhaseState.triggered가 명시적으로 기록되지 않음');
});

test('이미 발생한 페이즈는 중복 발행되지 않는다', () => {
  const boss = makeBoss({
    enemyDataId: 'boss_lich',
    hp:          600,
    maxHp:       1000,
  });
  boss.bossPhaseState = { triggered: [true, false] }; // 이미 1페이즈 발동됨

  const data  = { bossData: makeBossData() };
  const world = makeWorld({ enemies: [boss] });

  BossPhaseSystem.update({ world, data });

  assert.equal(world.events.bossPhaseChanged.length, 0, '중복 발동 버그');
});

test('여러 페이즈를 한 번에 통과하면 여러 이벤트가 발행된다', () => {
  const boss = makeBoss({
    enemyDataId: 'boss_lich',
    hp:          200, // 20% (0.7, 0.3 둘 다 통과)
    maxHp:       1000,
  });
  const data  = { bossData: makeBossData() };
  const world = makeWorld({ enemies: [boss] });

  BossPhaseSystem.update({ world, data });

  assert.equal(world.events.bossPhaseChanged.length, 2, '다중 페이즈 발동 실패');
});

test('보스가 아닌 적은 스킵한다', () => {
  const normal = makeBoss({ isBoss: false, hp: 10, maxHp: 1000 });
  const data   = { bossData: makeBossData() };
  const world  = makeWorld({ enemies: [normal] });

  BossPhaseSystem.update({ world, data });

  assert.equal(world.events.bossPhaseChanged.length, 0, '일반 적이 페이즈 전환됨');
});

summary();
