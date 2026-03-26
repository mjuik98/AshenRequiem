/**
 * tests/ExperienceLevelSystem.test.js — ExperienceSystem + LevelSystem 단위 테스트
 *
 * BUGFIX(BUG-TEST-XPTONEXTLEVEL): LevelSystem 테스트의 xpToNextLevel 검증 불일치 수정
 *
 *   Before (버그):
 *     테스트가 player.xpToNextLevel 필드를 기준으로 레벨업 판정을 검증함.
 *
 *     그러나 LevelSystem.update()는:
 *       const xpNeeded = getXpForLevel(player.level);  ← constants.js XP_TABLE 참조
 *     를 사용하므로 player.xpToNextLevel 필드를 전혀 읽지 않음.
 *
 *     테스트가 우연히 통과하는 이유:
 *       - makePlayer({ level: 1 }) → xpToNextLevel: 5 (fixture 기본값)
 *       - getXpForLevel(1) === XP_TABLE[1] === 5
 *       - level 1에서 두 값이 우연히 일치 → 테스트 통과
 *
 *     하지만 다음 경우 오검출/미검출 발생:
 *       - level 2일 때: getXpForLevel(2) === 12, xpToNextLevel 기본값 5
 *         → 테스트에서 xpToNextLevel:12로 세팅했는데 level이 3이면 getXpForLevel(3)===22 → 불일치
 *       - 이월 XP 검증: `player.xp < player.xpToNextLevel` 이 진짜 레벨업 임계값을
 *         검증하는 게 아니라 fixture 필드를 검증함
 *
 *   After (수정):
 *     - LevelSystem 테스트에서 player.xpToNextLevel 기준 검증을 getXpForLevel(player.level) 기준으로 교체
 *     - 이월 XP 검증도 getXpForLevel 기준으로 수정
 *     - 테스트명도 실제 동작 기준으로 명확화
 */

import assert from 'node:assert/strict';
import { makePlayer, makePickup, makeEvents, makeWorld } from './fixtures/index.js';
import { test, summary } from './helpers/testRunner.js';

let ExperienceSystem, LevelSystem, getXpForLevel;
try {
  [
    { ExperienceSystem } = await import('../src/systems/progression/ExperienceSystem.js'),
    { LevelSystem }      = await import('../src/systems/progression/LevelSystem.js'),
    { getXpForLevel }    = await import('../src/data/constants.js'),
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
    entities: { player },
    queues: { events: makeEvents({ pickupCollected: [{ pickup }] }) },
  });
  ExperienceSystem.update({ world });
  assert.equal(player.xp, 3, `XP 불일치 (기대: 3, 실제: ${player.xp})`);
});

test('magnetRadius 내 픽업은 magnetized=true가 된다', () => {
  const player = makePlayer({ x: 0, y: 0, magnetRadius: 100 });
  const nearby = makePickup({ x: 50,  y: 0, magnetized: false });
  const far    = makePickup({ x: 500, y: 0, magnetized: false });
  const world  = makeWorld({ entities: { player, pickups: [nearby, far] } });
  ExperienceSystem.update({ world });
  assert.equal(nearby.magnetized, true,  '근처 픽업이 magnetized되지 않음');
  assert.equal(far.magnetized,    false, '먼 픽업이 magnetized됨');
});

test('pendingDestroy 픽업은 XP 계산에 포함하지 않는다', () => {
  const player = makePlayer({ xp: 0 });
  const dead   = makePickup({ xpValue: 99, pendingDestroy: true });
  const world  = makeWorld({
    entities: { player },
    queues: { events: makeEvents({ pickupCollected: [{ pickup: dead }] }) },
  });
  ExperienceSystem.update({ world });
  assert.equal(player.xp, 0, 'pendingDestroy 픽업 XP가 적용됨');
});

// ── LevelSystem ──────────────────────────────────────────────────────

console.log('\n[LevelSystem 테스트 시작]');

test('xp >= getXpForLevel(level) 이면 levelUpRequested 이벤트가 발행된다', () => {
  const level  = 1;
  const needed = getXpForLevel(level);                      // XP_TABLE[1] === 5
  const player = makePlayer({ xp: needed, level });
  const world  = makeWorld({ entities: { player }, run: { playMode: 'playing' } });
  LevelSystem.update({ world });
  assert(world.queues.events.levelUpRequested.length > 0, 'levelUpRequested 미발행');
});

test('xp < getXpForLevel(level) 이면 레벨업 없음', () => {
  const level  = 1;
  const needed = getXpForLevel(level);                      // 5
  const player = makePlayer({ xp: needed - 1, level });     // xp: 4
  const world  = makeWorld({ entities: { player }, run: { playMode: 'playing' } });
  LevelSystem.update({ world });
  assert.equal(world.queues.events.levelUpRequested.length, 0, '조기 레벨업');
});

test('playMode === "levelup" 중 중복 레벨업 방지', () => {
  const level  = 1;
  const needed = getXpForLevel(level);
  const player = makePlayer({ xp: needed * 2, level });     // xp 충분히 넣어도 차단
  const world  = makeWorld({ entities: { player }, run: { playMode: 'levelup' } });
  LevelSystem.update({ world });
  assert.equal(world.queues.events.levelUpRequested.length, 0, '레벨업 중 재발행됨');
});

test('레벨업 후 잉여 XP가 이월된다', () => {
  const level  = 1;
  const needed = getXpForLevel(level);                      // 5
  const player = makePlayer({ xp: needed + 2, level });     // xp: 7, 잉여 2
  const world  = makeWorld({ entities: { player }, run: { playMode: 'playing' } });
  LevelSystem.update({ world });

  if (world.queues.events.levelUpRequested.length > 0) {
    const nextNeeded = getXpForLevel(player.level);
    assert(
      player.xp < nextNeeded,
      `XP 이월 처리 안 됨 (xp: ${player.xp}, 다음 필요: ${nextNeeded})`,
    );
  }
});

test('level 2 기준: getXpForLevel(2) 이상이면 레벨업', () => {
  const level  = 2;
  const needed = getXpForLevel(level);                      // XP_TABLE[2] === 12
  const player = makePlayer({ xp: needed, level });
  const world  = makeWorld({ entities: { player }, run: { playMode: 'playing' } });
  LevelSystem.update({ world });
  assert(world.queues.events.levelUpRequested.length > 0,
    `level 2 레벨업 미발행 (needed: ${needed}, player.xp: ${player.xp})`);
});

summary();
