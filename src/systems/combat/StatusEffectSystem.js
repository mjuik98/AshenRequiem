import { getStatusEffectData }  from '../../data/statusEffectData.js';
import { statusEffectRegistry }  from '../../data/statusEffectRegistry.js';
import { generateId }            from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 부여 + 틱 처리
 *
 * BUGFIX:
 *   BUG-3: _applyEffect()에서 effect를 events.statusApplied 큐에만 넣고
 *          entity.statusEffects에는 커밋하지 않아 중복 검사가 실제 상태를 못 읽는 문제.
 *
 *   재현 시나리오:
 *     같은 프레임에 투사체 2발이 동일 적에게 'slow' 히트
 *     → 첫 번째 _applyEffect 호출: statusEffects 비어있음 → 중복 없음 판정 → 큐에 push
 *     → 두 번째 _applyEffect 호출: statusEffects 아직 비어있음 → 중복 없음 판정 → 큐에 또 push
 *     → EventRegistry 핸들러에서 slow가 두 번 push → 중복 부여
 *
 *   수정 전략:
 *     effect를 entity.statusEffects에 즉시 직접 push + onApply 즉시 호출
 *     → 중복 검사가 항상 실제 커밋된 상태 기준으로 동작
 *     → EventRegistry statusApplied는 알림 전용 큐잉으로만 사용
 *
 *   안전성:
 *     applyFromHits()는 hits[] 배열을 순회하지 entity.statusEffects[]를 순회하지 않으므로
 *     순회 중 직접 push가 "순회 중 삭제" 금지 패턴에 해당하지 않음.
 */
export const StatusEffectSystem = {
  update({ world: { enemies, player, deltaTime, events } }) {
    if (events.hits?.length > 0) {
      this.applyFromHits({ hits: events.hits, events });
    }
    this.tick({ enemies, player, deltaTime, events });
  },

  applyFromHits({ hits, events }) {
    for (let i = 0; i < hits.length; i++) {
      const hit  = hits[i];
      const proj = hit.projectile;
      if (!proj?.statusEffectId) continue;
      if (Math.random() > (proj.statusEffectChance ?? 1.0)) continue;

      const target = hit.target;
      if (!target?.isAlive || target.pendingDestroy || !target.statusEffects) continue;

      this._applyEffect(target, proj.statusEffectId, events);
    }
  },

  tick({ enemies, player, deltaTime, events }) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      this._tickEntity(e, deltaTime, events);
    }
    if (player?.isAlive && !player.pendingDestroy) {
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

  _applyEffect(entity, effectId, events) {
    const def = getStatusEffectData(effectId);
    if (!def) {
      console.warn(`[StatusEffectSystem] 알 수 없는 effectId: ${effectId}`);
      return;
    }

    // FIX(BUG-3): 중복 검사를 entity.statusEffects 기준으로 수행
    // 이전 코드는 events.statusApplied 큐에만 push하고 entity.statusEffects는 건드리지 않았기 때문에
    // 같은 프레임에 동일 대상에게 동일 타입이 두 번 히트하면 중복 검사를 통과했었음.
    if (def.type === 'slow' || def.type === 'poison') {
      const existing = entity.statusEffects.find(e => e.type === def.type);
      if (existing) {
        // 남은 시간 갱신만 수행 (스택 불가 타입)
        existing.remaining = Math.max(existing.remaining, def.duration);
        return;
      }
    }

    const effect = {
      id:              generateId(),
      type:            def.type,
      remaining:       def.duration,
      magnitude:       def.magnitude,
      tickInterval:    def.tickInterval,
      tickAccumulator: 0,
      color:           def.color,
    };

    // FIX(BUG-3): entity.statusEffects에 즉시 직접 push
    // → 같은 프레임 내 두 번째 _applyEffect 호출 시 중복 검사가 실제 상태를 올바르게 읽음
    // applyFromHits()는 hits[] 순회 중이므로 entity.statusEffects 직접 변경은 안전함
    entity.statusEffects.push(effect);

    // onApply는 effect가 entity.statusEffects에 커밋된 직후 호출
    // (이전 코드에서 EventRegistry 핸들러가 push 후 onApply를 빠뜨려 stun이 작동하지 않던 문제 해결)
    const handler = statusEffectRegistry[def.type];
    if (handler?.onApply) {
      handler.onApply(entity, effect, def);
    }

    // 알림용 이벤트 큐잉 (사운드/UI 훅 전용 — 뮤테이션 용도로 사용 금지)
    if (events && Array.isArray(events.statusApplied)) {
      events.statusApplied.push({ target: entity, effect });
    }
  },

  _removeEffect(entity, effect, idx) {
    // PERF: O(1) swap-and-pop
    const lastIdx = entity.statusEffects.length - 1;
    if (idx < lastIdx) {
      entity.statusEffects[idx] = entity.statusEffects[lastIdx];
    }
    entity.statusEffects.pop();

    const handler = statusEffectRegistry[effect.type];
    if (handler?.onRemove) {
      handler.onRemove(entity, effect);
    }
  },
};
