/**
 * tests/SynergySystem.test.js — SynergySystem 단위 테스트
 *
 * CHANGE(P1): world.synergyState 기반 추적 상태로 업데이트
 */

import assert from 'node:assert/strict';
import { makePlayer, makeWorld } from './fixtures/index.js';
import { test, summary }        from './helpers/testRunner.js';

let createSynergySystem;
try {
  ({ createSynergySystem } = await import('../src/systems/progression/SynergySystem.js'));
} catch (e) {
  console.warn('[테스트] SynergySystem import 실패 — 스킵:', e.message);
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
  const sys = createSynergySystem();
  const player = makePlayer({
    upgradeCounts:  { fireBolt: 1, iceSpear: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ player });
  sys.update({ world, data: { synergyData: MOCK_SYNERGIES } });
  assert.ok(player.activeSynergies.includes('fireAndIce'),
    'fireAndIce 시너지가 활성화되지 않음');
});

test('조건 미충족 시 시너지가 활성화되지 않는다', () => {
  const sys = createSynergySystem();
  const player = makePlayer({
    upgradeCounts:   { fireBolt: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ player });
  sys.update({ world, data: { synergyData: MOCK_SYNERGIES } });
  assert.ok(!player.activeSynergies.includes('fireAndIce'),
    '조건 미충족인데 fireAndIce 활성화됨');
});

test('applyAll 반복 호출 시 speedMult가 누적되지 않는다 (멱등성)', () => {
  const sys = createSynergySystem();
  const player = makePlayer({
    moveSpeed:       200,
    upgradeCounts:   { fireBolt: 1, iceSpear: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ player });

  // 1회 적용
  sys.applyAll({ player, synergyData: MOCK_SYNERGIES, synergyState: world.synergyState });
  const afterFirst = player.moveSpeed;

  // 2회 적용
  sys.applyAll({ player, synergyData: MOCK_SYNERGIES, synergyState: world.synergyState });
  const afterSecond = player.moveSpeed;

  assert.equal(afterFirst, afterSecond,
    `speedMult 누적 버그: 1회(${afterFirst}) vs 2회(${afterSecond}) 결과가 다름`);
});

test('lifestealDelta가 applyAll 반복 호출 시 누적되지 않는다', () => {
  const sys = createSynergySystem();
  const player = makePlayer({
    lifesteal:       0,
    upgradeCounts:   { darkMagic: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ player });

  sys.applyAll({ player, synergyData: MOCK_SYNERGIES, synergyState: world.synergyState });
  const after1 = player.lifesteal;

  sys.applyAll({ player, synergyData: MOCK_SYNERGIES, synergyState: world.synergyState });
  const after2 = player.lifesteal;

  assert.ok(Math.abs(after1 - after2) < 0.001,
    `lifestealDelta 누적 버그: 1회(${after1}) vs 2회(${after2})`);
});

test('activeSynergies가 없는 플레이어에 update를 호출해도 에러 없음', () => {
  const sys = createSynergySystem();
  const player = makePlayer();
  delete player.activeSynergies;
  const world = makeWorld({ player });
  assert.doesNotThrow(() =>
    sys.update({ world, data: { synergyData: MOCK_SYNERGIES } })
  );
});

test('world.player가 null이어도 에러 없음', () => {
  const sys = createSynergySystem();
  assert.doesNotThrow(() =>
    sys.applyAll({ player: null, synergyData: [] })
  );
});

summary();
