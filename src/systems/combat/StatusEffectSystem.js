/**
 * src/systems/combat/StatusEffectSystem.js — 상태이상 부여 + 틱 처리
 *
 * BUGFIX(BUG-3): 중복 상태이상 방지 로직 오동작 수정
 *
 *   재현 시나리오:
 *     같은 프레임에 투사체 2발이 동일 적에게 'slow' 히트
 *     → 1번째 _applyEffect: entity.statusEffects가 비어있음
 *                           → 중복 없음 판정 → events.statusApplied 큐에만 push
 *     → 2번째 _applyEffect: entity.statusEffects 여전히 비어있음
 *                           → 중복 없음 판정 → 큐에 또 push (중복!)
 *     → EventRegistry 핸들러에서 slow가 두 번 적용
 *
 *   수정 전략:
 *     effect를 entity.statusEffects에 즉시 직접 push + onApply 즉시 호출
 *     → 중복 검사가 항상 실제 커밋 상태 기준으로 동작
 *     → events.statusApplied는 이벤트 알림 전용 큐잉으로만 사용
 *
 *   안전성:
 *     applyFromHits()는 hits[] 배열을 순회하며
 *     entity.statusEffects[]는 순회 대상이 아니므로
 *     순회 중 직접 push가 "순회 중 삭제" 금지 패턴에 해당하지 않음.
 */

import { getStatusEffectData }  from '../../data/statusEffectData.js';
import { statusEffectRegistry }  from '../../data/statusEffectRegistry.js';
import { generateId }            from '../../utils/ids.js';
import { isLive }                from '../../utils/entityUtils.js';
import { chance }                from '../../utils/random.js';
import { logRuntimeWarn } from '../../utils/runtimeLogger.js';

export const StatusEffectSystem = {
  update({ world }) {
    const enemies = world.entities.enemies;
    const player = world.entities.player;
    const deltaTime = world.runtime.deltaTime;
    const events = world.queues.events;
    const rng = world.runtime.rng;
    if (events.hits?.length > 0) {
      this.applyFromHits({ hits: events.hits, events, rng, player, enemies });
    }
    this.tick({ enemies, player, deltaTime, events });
  },

  /**
   * hits 배열에서 statusEffectId를 가진 히트 이벤트를 처리해
   * 대상 entity에 상태이상을 직접 부여한다.
   *
   * @param {{ hits: object[], events?: object, player?: object, enemies?: object[], rng?: object }} param
   */
  applyFromHits({ hits, events, rng, player, enemies = [] }) {
    const initialHitCount = hits.length;
    for (let i = 0; i < initialHitCount; i++) {
      const hit  = hits[i];
      const proj = hit.projectile;
      if (!proj?.statusEffectId && !proj?.impactBurst) continue;

      const target = hit.target;
      if (!isLive(target) || !target.statusEffects) continue;

      if (proj.statusEffectId && chance(proj.statusEffectChance ?? 1.0, rng)) {
        this._applyEffect(target, proj.statusEffectId, events);
      }
      if (proj.impactBurst && hit.attackerId === player?.id) {
        this._applyImpactBurst({ hit, hits, events, rng, enemies });
      }
    }
  },

  /**
   * 모든 엔티티의 상태이상 남은 시간을 감소시키고
   * 만료된 상태이상을 제거한다.
   *
   * @param {{ enemies: object[], player: object, deltaTime: number, events: object }} param
   */
  tick({ enemies, player, deltaTime, events }) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!isLive(e)) continue;
      this._tickEntity(e, deltaTime, events);
    }
    if (isLive(player)) {
      this._tickEntity(player, deltaTime, events);
    }
  },

  _tickEntity(entity, deltaTime, events) {
    if (!entity.statusEffects?.length) return;

    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect  = entity.statusEffects[i];
      const handler = statusEffectRegistry[effect.type];

      if (handler?.onTick) {
        handler.onTick(entity, effect, deltaTime, events);
      }

      effect.remaining -= deltaTime;

      if (effect.remaining <= 0 && !entity.pendingDestroy) {
        this._removeEffect(entity, effect, i);
      }
    }
  },

  /**
   * entity.statusEffects에 직접 커밋한다.
   *
   * BUGFIX(BUG-3): 기존에는 events.statusApplied에만 push하고
   *   entity.statusEffects는 그대로 두었기 때문에,
   *   같은 프레임에 동일 타입이 두 번 히트하면 중복 검사를 통과했음.
   *
   *   수정: entity.statusEffects에 즉시 push → 중복 검사가 실제 상태 기준으로 동작.
   *         events.statusApplied는 알림 전용.
   *
   * @param {object}      entity
   * @param {string}      effectId
   * @param {object|null} events
   */
  _applyEffect(entity, effectId, events) {
    const def = getStatusEffectData(effectId);
    if (!def) {
      logRuntimeWarn('StatusEffectSystem', `알 수 없는 effectId: ${effectId}`);
      return;
    }

    // FIX(BUG-3): entity.statusEffects를 직접 조회해 중복 검사
    // Before: events.statusApplied 큐 기준 → 프레임 내 중복 허용
    // After:  entity.statusEffects 기준   → 실제 상태 기준으로 즉시 반영
    const existing = entity.statusEffects.find(e => e.type === def.type);
    if (existing) {
      // 같은 타입이 이미 있으면 남은 시간만 갱신 (중복 부여 X)
      existing.remaining = Math.max(existing.remaining, def.duration ?? 2.0);
      return;
    }

    const effect = {
      id:              generateId(),
      type:            def.type,
      remaining:       def.duration     ?? 2.0,
      magnitude:       def.magnitude    ?? 0.3,
      tickInterval:    def.tickInterval ?? null,
      tickAccumulator: 0,
      color:           def.color        ?? '#aaaaaa',
    };

    // FIX(BUG-3): entity에 직접 커밋
    entity.statusEffects.push(effect);

    // onApply 즉시 호출 (예: slow → moveSpeed 감소)
    const handler = statusEffectRegistry[def.type];
    if (handler?.onApply) {
      handler.onApply(entity, effect);
    }

    // events.statusApplied는 알림 목적으로만 사용
    if (events?.statusApplied) {
      events.statusApplied.push({ entity, effect });
    }
  },

  _removeEffect(entity, effect, index) {
    const handler = statusEffectRegistry[effect.type];
    if (handler?.onRemove) {
      handler.onRemove(entity, effect);
    }
    entity.statusEffects.splice(index, 1);
  },

  _applyImpactBurst({ hit, hits, events, rng, enemies }) {
    const burst = hit?.projectile?.impactBurst;
    const sourceTarget = hit?.target;
    if (!burst || !isLive(sourceTarget)) return;

    const radius = burst.radius ?? 0;
    const damage = burst.damage ?? 0;
    if (radius <= 0) return;
    const radiusSq = radius * radius;
    const primaryTargetId = hit?.targetId ?? sourceTarget?.id ?? null;

    for (let i = 0; i < enemies.length; i += 1) {
      const candidate = enemies[i];
      if (!isLive(candidate)) continue;
      if (burst.excludePrimaryTarget && primaryTargetId && candidate.id === primaryTargetId) continue;

      const dx = (candidate.x ?? 0) - (sourceTarget.x ?? 0);
      const dy = (candidate.y ?? 0) - (sourceTarget.y ?? 0);
      if ((dx * dx) + (dy * dy) > radiusSq) continue;

      if (burst.statusEffectId && candidate.statusEffects && chance(burst.statusEffectChance ?? 1.0, rng)) {
        this._applyEffect(candidate, burst.statusEffectId, events);
      }

      if (damage > 0) {
        hits.push({
          attackerId: hit.attackerId,
          targetId: candidate.id,
          target: candidate,
          damage,
          projectileId: null,
          projectile: {
            ownerId: hit.projectile?.ownerId ?? hit.attackerId ?? null,
            weapon: hit.projectile?.weapon ?? null,
            color: hit.projectile?.color ?? null,
            radius: hit.projectile?.radius ?? null,
            hitCount: 0,
            hitTargets: new Set(),
            impactEffectType: null,
            impactBurst: null,
            statusEffectId: null,
            statusEffectChance: 0,
          },
        });
      }
    }
  },
};
