/**
 * src/systems/combat/DeathSystem.js — 사망 후처리
 *
 * FIX(BUG-XP-NAN): entity.xpValue 미설정 시 NaN XP 전파 방지
 *
 *   Before (버그):
 *     spawnQueue.push({ type: 'pickup', config: { ..., xpValue: entity.xpValue } });
 *
 *     entity.xpValue가 undefined이면:
 *       → PickupEntity.xpValue = undefined
 *       → ExperienceSystem: player.xp += undefined
 *       → player.xp = NaN
 *       → 이후 모든 XP 연산(레벨업 판정, HUD 표시 등) 전부 NaN
 *       → NaN은 어떤 비교에서도 false이므로 레벨업이 영구적으로 불가
 *
 *   After (수정):
 *     xpValue: entity.xpValue ?? 0
 *
 *   추가 안전장치: deathSpawn의 count/enemyId가 미설정된 경우 스킵 가드 추가
 *
 * 입력: events.deaths
 * 출력: spawnQueue (XP 픽업, 사망 이펙트, deathSpawn), worldState.playMode 변경
 */
import { EFFECT_DEFAULTS } from '../../data/constants.js';

export const DeathSystem = {
  update({ world }) {
    const { events, spawnQueue } = world;
    const worldState = world;

    for (let i = 0; i < events.deaths.length; i++) {
      const { entity } = events.deaths[i];

      if (entity.type === 'enemy') {
        worldState.killCount++;

        // deathSpawn (슬라임 분열 등)
        // FIX: count와 enemyId 유효성 가드 추가
        if (entity.deathSpawn) {
          const { enemyId, count } = entity.deathSpawn;
          if (enemyId && count > 0) {
            for (let d = 0; d < count; d++) {
              const angle = (d / count) * Math.PI * 2;
              spawnQueue.push({
                type: 'enemy',
                config: {
                  enemyId,
                  x: entity.x + Math.cos(angle) * (entity.radius + 10),
                  y: entity.y + Math.sin(angle) * (entity.radius + 10),
                },
              });
            }
          }
        }

        // FIX(BUG-XP-NAN): xpValue ?? 0 — undefined이면 0으로 대체
        // entity.xpValue가 정의되지 않은 적에서 NaN이 player.xp로 전파되는 것을 차단
        spawnQueue.push({
          type: 'pickup',
          config: {
            x:       entity.x,
            y:       entity.y,
            xpValue: entity.xpValue ?? 0,
          },
        });

        // 사망 이펙트
        spawnQueue.push({
          type: 'effect',
          config: {
            x:          entity.x,
            y:          entity.y,
            effectType: 'burst',
            color:      entity.color,
            radius:     entity.radius * 1.5,
            duration:   EFFECT_DEFAULTS.burstDuration,
          },
        });
      }

      if (entity.type === 'player') {
        worldState.playMode = 'dead';
      }
    }
  },
};
