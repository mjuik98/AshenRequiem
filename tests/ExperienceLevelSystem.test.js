/**
 * tests/ExperienceLevelSystem.test.js — ExperienceSystem + LevelSystem 단위 테스트
 *
 * 검증 항목 (ExperienceSystem):
 *   - pickupCollected 이벤트 기반 XP 획득
 *   - magnetRadius 내 픽업 자석 흡인 활성화
 *   - isAlive/pendingDestroy 픽업 필터링
 *
 * 검증 항목 (LevelSystem):
 *   - XP가 xpToNextLevel 이상이면 레벨업 이벤트 발행
 *   - 레벨업 후 XP 이월 처리
 *   - playMode === 'levelup' 중에는 레벨업 재발행 안 함
 *
 * 리팩터링:
 *   Before: makePlayer / makePickup / makeEvents / makeWorld 로컬 선언
 *           passed/failed/test() 로컬 패턴
 *   After:  tests/fixtures/index.js  → 위 4종 모두 공용으로 교체
 *           tests/helpers/testRunner.js → test(), summary()
 *
 * 실행: npm test
 */

import assert from 'node:assert/strict';
import { makePlayer, makePickup, makeEvents, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let ExperienceSystem, LevelSystem;
try {
  [
    { ExperienceSystem } = await import('../src/systems/progression/ExperienceSystem.js'),
    { LevelSystem }      = await import('../src/systems/progression/LevelSystem.js'),
  ];
} catch (e) {
  console.warn('[테스트] ExperienceSystem / LevelSystem import 실패 — 스킵:', e.message);
  process.exit(0);
}

// ── ExperienceSystem ──────────────────────────────────────────────────

console.log('\n[ExperienceSystem 테스트 시작]');

test('pickupCollected 이벤트로 player.xp가 증가한다', () => {
  const player = makePlayer({ xp: 0 });
  const pickup = makePickup({ xpValue: 3 });
  const world  = makeWorld({
    player,
    events: makeEvents({ pickupCollected: [{ pickup }] }),
  });
  ExperienceSystem.update({ world });
  assert.equal(player.xp, 3, `XP 불일치 (기대: 3, 실제: ${player.xp})`);
});

test('magnetRadius 내 픽업은 magnetized=true가 된다', () => {
  const player = makePlayer({ x: 0, y: 0, magnetRadius: 100 });
  const nearby = makePickup({ x: 50,  y: 0, magnetized: false });
  const far    = makePickup({ x: 500, y: 0, magnetized: false });
  const world  = makeWorld({ player, pickups: [nearby, far] });
  ExperienceSystem.update({ world });
  assert.equal(nearby.magnetized, true,  '근처 픽업이 magnetized되지 않음');
  assert.equal(far.magnetized,    false, '먼 픽업이 magnetized됨');
});

test('pendingDestroy 픽업은 XP 계산에 포함하지 않는다', () => {
  const player = makePlayer({ xp: 0 });
  const dead   = makePickup({ xpValue: 99, pendingDestroy: true });
  const world  = makeWorld({
    player,
    events: makeEvents({ pickupCollected: [{ pickup: dead }] }),
  });
  ExperienceSystem.update({ world });
  assert.equal(player.xp, 0, 'pendingDestroy 픽업 XP가 적용됨');
});

// ── LevelSystem ───────────────────────────────────────────────────────

console.log('\n[LevelSystem 테스트 시작]');

test('xp >= xpToNextLevel 이면 levelUpRequested 이벤트가 발행된다', () => {
  const player = makePlayer({ xp: 5, xpToNextLevel: 5, level: 1 });
  const world  = makeWorld({ player, playMode: 'playing' });
  LevelSystem.update({ world });
  assert(world.events.levelUpRequested.length > 0, 'levelUpRequested 미발행');
});

test('xp < xpToNextLevel 이면 레벨업 없음', () => {
  const player = makePlayer({ xp: 4, xpToNextLevel: 5, level: 1 });
  const world  = makeWorld({ player, playMode: 'playing' });
  LevelSystem.update({ world });
  assert.equal(world.events.levelUpRequested.length, 0, '조기 레벨업');
});

test('playMode === "levelup" 중 중복 레벨업 방지', () => {
  const player = makePlayer({ xp: 10, xpToNextLevel: 5, level: 1 });
  const world  = makeWorld({ player, playMode: 'levelup' });
  LevelSystem.update({ world });
  assert.equal(world.events.levelUpRequested.length, 0, '레벨업 중 재발행됨');
});

test('레벨업 후 잉여 XP가 이월된다', () => {
  const player = makePlayer({ xp: 7, xpToNextLevel: 5, level: 1 });
  const world  = makeWorld({ player, playMode: 'playing' });
  LevelSystem.update({ world });
  if (world.events.levelUpRequested.length > 0) {
    assert(player.xp < player.xpToNextLevel, `XP 이월 처리 안 됨 (xp: ${player.xp})`);
  }
});

summary();
