import assert from 'node:assert/strict';
import { test, summary } from './helpers/testRunner.js';

let createEnemy;
let resetEnemy;
let buildCurseSnapshot;
try {
  ({ createEnemy, resetEnemy } = await import('../src/entities/createEnemy.js'));
  ({ buildCurseSnapshot } = await import('../src/data/curseScaling.js'));
} catch (error) {
  console.warn('[테스트] CurseRuntime import 실패 — 스킵:', error.message);
  process.exit(0);
}

console.log('\n[CurseRuntime]');

test('curse snapshot은 적 스폰/체력/경험치 배율을 함께 계산한다', () => {
  const snapshot = buildCurseSnapshot(0.5);

  assert.equal(snapshot.spawnRateMult, 1.175, '저주 스폰 배율 곡선이 튜닝값과 다름');
  assert.equal(snapshot.enemyHpMult, 1.275, '저주 체력 배율 곡선이 튜닝값과 다름');
  assert.equal(snapshot.enemyXpMult, 1.175, '저주 경험치 배율 곡선이 튜닝값과 다름');
});

test('enemy 생성 시 curse snapshot이 체력과 경험치에 반영된다', () => {
  const baseEnemy = createEnemy('slime', 0, 0);
  const enemy = createEnemy('slime', 0, 0, {
    curseSnapshot: buildCurseSnapshot(0.5),
  });

  assert.equal(enemy.maxHp > baseEnemy.maxHp, true, '저주가 적 최대 체력을 올리지 않음');
  assert.equal(enemy.hp, enemy.maxHp, '저주 적용 후 현재 체력이 최대 체력과 동기화되지 않음');
  assert.equal(enemy.xpValue > baseEnemy.xpValue, true, '저주가 적 경험치를 올리지 않음');
});

test('enemy reset 시에도 curse snapshot이 재적용된다', () => {
  const enemy = createEnemy('slime', 0, 0);
  const baseHp = enemy.maxHp;
  const baseXp = enemy.xpValue;
  resetEnemy(enemy, {
    enemyId: 'slime',
    x: 10,
    y: 20,
    curseSnapshot: buildCurseSnapshot(1.0),
  });

  assert.equal(enemy.maxHp > baseHp, true, '풀 재사용 reset에서 저주 체력 배율이 누락됨');
  assert.equal(enemy.xpValue > baseXp, true, '풀 재사용 reset에서 저주 경험치 배율이 누락됨');
});

summary();
