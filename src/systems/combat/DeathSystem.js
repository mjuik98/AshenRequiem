import { EFFECT_DEFAULTS }                      from '../../data/constants.js';
import { transitionPlayMode, PlayMode }          from '../../state/PlayMode.js';
import { spawnPickup, spawnEffect, spawnEnemy }  from '../../state/spawnRequest.js';

/**
 * src/systems/combat/DeathSystem.js — 사망 후처리
 *
 * REFACTOR (R-14): DeathSystem → Session 직접 접근 제거
 * REFACTOR (R-15): spawnQueue 요청 시 SpawnRequest 팩토리 사용
 *
 * FIX(P3-8): world.playMode 직접 변경 → transitionPlayMode() 사용
 * FIX(BUG-XP-NAN): entity.xpValue 미설정 시 NaN XP 전파 방지
 *
 * CHANGE: currencyMult 적용 — player.currencyMult 배율을 골드 보상에 곱함
 *   _calcCurrencyReward(entity, player) 시그니처 변경 (player 인수 추가)
 *
 * CHANGE: 보스 처치 시 경험치 아이템 대량 드랍 (뱀서 스타일)
 *   보스는 xpValue가 60이므로 큰 경험치 젬을 여러 개 사방으로 뿌림.
 *   각 젬은 기존 픽업과 동일하게 magnetRadius로 흡수 가능.
 */
export const DeathSystem = {
  update({ world }) {
    const { events, spawnQueue } = world;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        world.killCount++;

        // R-14: currencyEarned 이벤트 발행 (PipelineBuilder 핸들러가 처리)
        // CHANGE: player.currencyMult 배율 적용
        if (world.events.currencyEarned) {
          const reward = _calcCurrencyReward(entity, world.player);
          world.events.currencyEarned.push({ amount: reward });
        }

        // deathSpawn (슬라임 분열 등)
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
          if (enemyId && count > 0) {
            for (let d = 0; d < count; d++) {
              const angle = (d / count) * Math.PI * 2;
              spawnQueue.push(spawnEnemy({
                enemyId,
                x: entity.x + Math.cos(angle) * (entity.radius + 10),
                y: entity.y + Math.sin(angle) * (entity.radius + 10),
              }));
            }
          }
        }

        const xpVal = entity.xpValue ?? 0;

        if (entity.isBoss) {
          // ── 보스 처치: 경험치 젬 대량 드랍 (뱀서 스타일) ─────────────────────
          // 큰 젬 4개 + 중간 젬 여러 개를 방사형으로 흩뿌림
          _spawnBossXpDrop(spawnQueue, entity, xpVal);
        } else {
          // ── 일반 / 엘리트: 기존 단일 젬 드랍 ──────────────────────────────────
          spawnQueue.push(spawnPickup({
            x:       entity.x,
            y:       entity.y,
            xpValue: xpVal,
            config:  { color: _getXpGemColor(xpVal) },
          }));
        }

        // 사망 이펙트
        spawnQueue.push(spawnEffect({
          x:          entity.x,
          y:          entity.y,
          effectType: 'burst',
          config: {
            color:    entity.color,
            radius:   entity.radius * 1.5,
            duration: EFFECT_DEFAULTS.burstDuration,
          }
        }));
      }

      if (entity.type === 'player') {
        transitionPlayMode(world, PlayMode.DEAD);
      }
    }
  },
};

/**
 * 보스 처치 시 경험치 젬을 방사형으로 대량 드랍한다.
 *
 * 구성:
 *   - 큰 젬(xpValue 높음) 4개: 상하좌우로 넓게 흩어짐
 *   - 중간 젬 8개: 방사형 균등 배치
 *   - 잔여 XP: 작은 젬들로 랜덤 배치
 *
 * @param {object[]} spawnQueue
 * @param {object}   boss
 * @param {number}   totalXp
 */
function _spawnBossXpDrop(spawnQueue, boss, totalXp) {
  const BIG_GEM_XP    = 12;   // 큰 젬 1개당 XP
  const MED_GEM_XP    = 5;    // 중간 젬 1개당 XP
  const BIG_COUNT     = 4;
  const MED_COUNT     = 8;

  let remaining = totalXp;

  // 큰 젬 4개 (상하좌우 대각선)
  for (let i = 0; i < BIG_COUNT && remaining > 0; i++) {
    const angle   = (i / BIG_COUNT) * Math.PI * 2 + Math.PI / 4;
    const scatter = 60 + Math.random() * 40;
    const gemXp   = Math.min(BIG_GEM_XP, remaining);
    remaining    -= gemXp;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 14 },   // 큰 빨간 젬
    }));
  }

  // 중간 젬 8개 방사형
  for (let i = 0; i < MED_COUNT && remaining > 0; i++) {
    const angle   = (i / MED_COUNT) * Math.PI * 2;
    const scatter = 30 + Math.random() * 50;
    const gemXp   = Math.min(MED_GEM_XP, remaining);
    remaining    -= gemXp;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 10 },
    }));
  }

  // 나머지 XP → 작은 젬들로 분산
  while (remaining > 0) {
    const gemXp  = Math.min(3, remaining);
    remaining   -= gemXp;
    const angle   = Math.random() * Math.PI * 2;
    const scatter = 20 + Math.random() * 80;
    spawnQueue.push(spawnPickup({
      x:       boss.x + Math.cos(angle) * scatter,
      y:       boss.y + Math.sin(angle) * scatter,
      xpValue: gemXp,
      config:  { color: '#ef5350', radius: 8 },
    }));
  }
}

/**
 * xpValue 기반으로 경험치 젬 색상을 반환한다.
 */
function _getXpGemColor(xpValue) {
  if (xpValue <= 3)  return '#64b5f6';
  if (xpValue <= 10) return '#66bb6a';
  return '#ef5350';
}

/**
 * CHANGE: player.currencyMult 배율 적용
 *
 * @param {object}      enemy
 * @param {object|null} player
 * @returns {number}
 */
export function _calcCurrencyReward(enemy, player) {
  const base = enemy.currencyValue ?? 1;
  const mult = player?.currencyMult ?? 1;
  if (enemy.isBoss)  return Math.round(base * 20 * mult);
  if (enemy.isElite) return Math.round(base * 5  * mult);
  return Math.round(base * mult);
}
