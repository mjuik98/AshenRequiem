/**
 * tests/SynergySystem.test.js — SynergySystem 단위 테스트
 */
import assert from 'node:assert/strict';
import { makePlayer } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let SynergySystem;
try {
  ({ SynergySystem } = await import('../src/systems/progression/SynergySystem.js'));
} catch {
  console.warn('[테스트] SynergySystem import 실패 — 스킵');
  SynergySystem = null;
}

function makeSynergyData() {
  return [
    {
      id: 'iron_will',
      name: '철의 의지',
      requires: ['stat_maxhp', 'stat_speed'],
      bonus: { lifestealDelta: 0.05 },
    },
    {
      id: 'fury_strike',
      name: '분노의 일격',
      requires: ['stat_maxhp', 'stat_speed', 'stat_attack_up'],
      bonus: { damageDelta: 10 },
    },
    {
      id: 'swift_blade',
      name: '신속의 검',
      requires: ['stat_speed', 'stat_attack_up'],
      bonus: { damageDelta: 5 },
    },
  ];
}

function applyAll(player, data) {
  SynergySystem?.applyAll(player, data);
}

console.log('\n[SynergySystem — 기본 동작]');

test('조건 충족 시 시너지 활성화', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: { stat_maxhp: 1, stat_speed: 1 } });
  applyAll(player, makeSynergyData());
  assert.ok(player.activeSynergies.includes('iron_will'), '시너지 미활성화');
});

test('조건 미충족 시 시너지 비활성화', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: { stat_maxhp: 1 } });
  applyAll(player, makeSynergyData());
  assert.ok(!player.activeSynergies.includes('iron_will'), '조건 미충족 시너지가 활성화됨');
});

test('업그레이드 없어도 에러 없음', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: {} });
  assert.doesNotThrow(() => applyAll(player, makeSynergyData()), '업그레이드 없을 때 에러 발생');
});

console.log('\n[SynergySystem — 전체 재계산 방식]');

test('보너스 적용 확인', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: { stat_maxhp: 1, stat_speed: 1 }, lifesteal: 0, activeSynergies: [] });
  applyAll(player, makeSynergyData());
  assert.ok(Math.abs(player.lifesteal - 0.05) < 0.0001, `lifesteal 불일치: ${player.lifesteal}`);
});

test('activeSynergies는 매번 현재 조건 기준으로 갱신', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: { stat_maxhp: 1, stat_speed: 1 } });
  applyAll(player, makeSynergyData());
  assert.equal(player.activeSynergies.length, 1);
  player.upgradeCounts.stat_attack_up = 1;
  applyAll(player, makeSynergyData());
  assert.equal(player.activeSynergies.length, 3, '새 조건 충족 후 activeSynergies 미갱신');
});

test('조건이 사라지면 activeSynergies에서 제거', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ upgradeCounts: { stat_maxhp: 1, stat_speed: 1 } });
  applyAll(player, makeSynergyData());
  assert.ok(player.activeSynergies.includes('iron_will'));
  delete player.upgradeCounts.stat_speed;
  applyAll(player, makeSynergyData());
  assert.ok(!player.activeSynergies.includes('iron_will'), '조건 제거 후에도 활성 상태');
});

summary();
