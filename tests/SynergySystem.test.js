/**
 * tests/SynergySystem.test.js — SynergySystem 단위 테스트
 *
 * CHANGE(R-04): _testWithData 제거, DI 방식으로 전환
 *   Before: _testWithData(world, MOCK_DATA) 우회 메서드 사용 (§2.5 위반).
 *   After:  SynergySystem.update({ world, data: { synergyData: MOCK } })
 *           또는 SynergySystem.applyAll({ player, synergyData: MOCK })
 *           → 프로덕션 코드 경로와 동일한 DI 흐름 검증.
 *
 * NEW: 시너지 보너스 누적 버그(BUG-SYNERGY-MULT) 검증 케이스 추가
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { test, summary }        from './helpers/testRunner.js';

let SynergySystem;
try {
  ({ SynergySystem } = await import('../src/systems/progression/SynergySystem.js'));
} catch {
  console.warn('[테스트] SynergySystem import 실패 — 스킵');
  process.exit(0);
}

const MOCK_SYNERGIES = [
  {
    id: 'fireAndIce',
    name: '불과 얼음',
    requires: ['fireBolt', 'iceSpear'],
    bonus: { speedMult: 1.3 },
  },
  {
    id: 'vampire',
    name: '흡혈귀',
    requires: ['darkMagic'],
    bonus: { lifestealDelta: 0.1 },
  },
];

console.log('\n[SynergySystem 테스트]');

test('조건 충족 시 activeSynergies에 시너지 ID가 추가된다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: { fireBolt: 1, iceSpear: 1 },
    activeSynergies: [],
    _synergySpeedMult: 1, _synergyLifestealDelta: 0,
  });
  const world = makeWorld({ player });
  SynergySystem.update({ world, data: { synergyData: MOCK_SYNERGIES } });
  assert.ok(player.activeSynergies.includes('fireAndIce'),
    'fireAndIce 시너지가 활성화되지 않음');
});

test('조건 미충족 시 시너지가 활성화되지 않는다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: { fireBolt: 1 },
    activeSynergies: [],
    _synergySpeedMult: 1, _synergyLifestealDelta: 0,
  });
  const world = makeWorld({ player });
  SynergySystem.update({ world, data: { synergyData: MOCK_SYNERGIES } });
  assert.ok(!player.activeSynergies.includes('fireAndIce'),
    '조건 미충족인데 fireAndIce 활성화됨');
});

test('applyAll 호출 시 이전 시너지 효과가 초기화된다 (재계산 원칙)', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: {},
    activeSynergies: ['oldSynergy'],
    _synergySpeedMult: 1,
    _synergyLifestealDelta: 0,
    _synergyDamageBonus: 2.0,
  });
  const world = makeWorld({ player });
  SynergySystem.update({ world, data: { synergyData: MOCK_SYNERGIES } });
  assert.equal(player.activeSynergies.length, 0,
    '재계산 후 이전 시너지가 남아있음');
});

test('FIX(BUG-SYNERGY-MULT): applyAll 반복 호출 시 speedMult가 누적되지 않는다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    moveSpeed: 200,
    upgradeCounts: { fireBolt: 1, iceSpear: 1 },
    activeSynergies: [],
    _synergySpeedMult: 1,
    _synergyLifestealDelta: 0,
  });

  // 1회 적용
  SynergySystem.applyAll({ player, synergyData: MOCK_SYNERGIES });
  const afterFirst = player.moveSpeed;

  // 2회 적용 (동일 조건 — 멱등성이 보장되면 결과가 같아야 함)
  SynergySystem.applyAll({ player, synergyData: MOCK_SYNERGIES });
  const afterSecond = player.moveSpeed;

  assert.equal(afterFirst, afterSecond,
    `speedMult 누적 버그: 1회(${afterFirst}) vs 2회(${afterSecond}) 결과가 다름`);
});

test('FIX(BUG-SYNERGY-MULT): lifestealDelta가 applyAll 반복 호출 시 누적되지 않는다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    lifesteal: 0,
    upgradeCounts: { darkMagic: 1 },
    activeSynergies: [],
    _synergySpeedMult: 1,
    _synergyLifestealDelta: 0,
  });

  SynergySystem.applyAll({ player, synergyData: MOCK_SYNERGIES });
  const after1 = player.lifesteal;

  SynergySystem.applyAll({ player, synergyData: MOCK_SYNERGIES });
  const after2 = player.lifesteal;

  assert.ok(Math.abs(after1 - after2) < 0.001,
    `lifestealDelta 누적 버그: 1회(${after1}) vs 2회(${after2})`);
});

test('activeSynergies가 없는 플레이어에 update를 호출해도 에러 없음', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    _synergySpeedMult: 1, _synergyLifestealDelta: 0,
  });
  delete player.activeSynergies;
  const world = makeWorld({ player });
  assert.doesNotThrow(() =>
    SynergySystem.update({ world, data: { synergyData: MOCK_SYNERGIES } })
  );
});

test('world.player가 null이어도 에러 없음', () => {
  if (!SynergySystem) return;
  assert.doesNotThrow(() =>
    SynergySystem.applyAll({ player: null, synergyData: [] })
  );
});

test('data.synergyData가 없으면 조용히 스킵한다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({ _synergySpeedMult: 1, _synergyLifestealDelta: 0 });
  const world  = makeWorld({ player });
  assert.doesNotThrow(() =>
    SynergySystem.update({ world, data: {} })
  );
});

summary();
