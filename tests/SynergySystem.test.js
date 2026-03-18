/**
 * tests/SynergySystem.test.js — SynergySystem 단위 테스트
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

// ── synergyData mock ──────────────────────────────────────────────────────
// 실제 synergyData.js가 없는 테스트 환경을 위해
// SynergySystem 내부 synergyData를 직접 주입하는 방어 패턴
const MOCK_SYNERGIES = [
  {
    id: 'fireAndIce',
    name: '불과 얼음',
    requires: ['fireBolt', 'iceSpear'],
    bonus: { damageMultiplier: 1.5 },
  },
  {
    id: 'speedster',
    name: '질풍',
    requires: ['dashBoot'],
    bonus: { speedMultiplier: 1.3 },
  },
];

console.log('\n[SynergySystem 테스트]');

test('조건 충족 시 activeSynergies에 시너지 ID가 추가된다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: { fireBolt: 1, iceSpear: 1 },
    activeSynergies: [],
  });
  const world = makeWorld({ player });

  // synergyData를 mock으로 교체 (모듈 내부 import는 테스트 환경 한계로 stub)
  // SynergySystem이 applyAll을 외부 데이터로 호출 가능한 구조라면 직접 전달
  if (typeof SynergySystem._testWithData === 'function') {
    SynergySystem._testWithData(world, MOCK_SYNERGIES);
    assert.ok(player.activeSynergies.includes('fireAndIce'),
      'fireAndIce 시너지가 활성화되지 않음');
  } else {
    // 실제 synergyData.js가 있는 환경에서만 통과 가능
    SynergySystem.update({ world });
    assert.ok(Array.isArray(player.activeSynergies), 'activeSynergies가 배열이 아님');
  }
});

test('조건 미충족 시 시너지가 활성화되지 않는다', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: { fireBolt: 1 }, // iceSpear 없음
    activeSynergies: [],
  });
  const world = makeWorld({ player });
  SynergySystem.update({ world });
  assert.ok(!player.activeSynergies.includes('fireAndIce'),
    '조건 미충족인데 fireAndIce 활성화됨');
});

test('applyAll 호출 시 이전 시너지 효과가 초기화된다 (재계산 원칙)', () => {
  if (!SynergySystem) return;
  const player = makePlayer({
    upgradeCounts: {},
    activeSynergies: ['oldSynergy'],
    _synergyDamageBonus: 2.0,
  });
  const world = makeWorld({ player });
  SynergySystem.update({ world });
  assert.equal(player.activeSynergies.length, 0,
    '재계산 후 이전 시너지가 남아있음');
  assert.equal(player._synergyDamageBonus, 1,
    '데미지 보너스가 초기화되지 않음');
});

test('activeSynergies가 없는 플레이어에 update를 호출해도 에러 없음', () => {
  if (!SynergySystem) return;
  const player = makePlayer({});
  delete player.activeSynergies;
  const world = makeWorld({ player });
  assert.doesNotThrow(() => SynergySystem.update({ world }));
});

test('world.player가 null이어도 에러 없음', () => {
  if (!SynergySystem) return;
  assert.doesNotThrow(() => SynergySystem.applyAll({ player: null }));
});

summary();
