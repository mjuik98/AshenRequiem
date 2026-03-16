import { getStatusEffectData } from '../../data/statusEffectData.js';
import { generateId } from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 부여 + 틱 처리
 *
 * SAFETY(fix): _applyEffect — getStatusEffectData 반환값 null 방어 처리 강화.
 *   이전: if (!def) return; 만 있어 무음 실패 → 데이터 오타 디버깅이 어려움.
 *   이후: 개발 환경에서 console.warn 으로 unknown effectId 즉시 노출.
 *         getStatusEffectData 가 null 반환 시에도 TypeError 없이 안전하게 종료.
 *
 * FIX(bug): _tickEntity 에서 poison 데미지를 entity.hp 에 직접 적용하고
 *   events.deaths 에 직접 push 하던 방식을 제거.
 *   대신 events.hits 에 synthetic hit 을 push → DamageSystem 이 일관되게 처리.
 *
 * FIX(bug): _removeEffect stun 중첩 해제 버그 수정.
 *   splice 먼저 → 남아있는 stun 여부로 entity.stunned 재계산.
 *
 * 파이프라인 호출 순서 (PlayScene 참고):
 *   8. CollisionSystem      → events.hits (충돌 hit)
 *   9. applyFromHits        → 충돌 hit 으로 상태이상 부여
 *   9.5 tick               → poison hit 을 events.hits 에 추가
 *   9.7 DamageSystem        → 충돌 hit + poison hit 모두 처리
 *  10. DeathSystem
 */
export const StatusEffectSystem = {
  /** 충돌 hit 이벤트에서 상태이상 부여 */
  applyFromHits({ hits }) {
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const proj = hit.projectile;
      if (!proj || !proj.statusEffectId) continue;
      if (Math.random() > (proj.statusEffectChance ?? 1.0)) continue;
      const target = hit.target;
      if (!target || !target.isAlive || target.pendingDestroy || !target.statusEffects) continue;
      this._applyEffect(target, proj.statusEffectId);
    }
  },

  tick({ enemies, player, deltaTime, events }) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      this._tickEntity(e, deltaTime, events);
    }
    if (player && player.isAlive && !player.pendingDestroy) {
      this._tickEntity(player, deltaTime, events);
    }
  },

  _tickEntity(entity, deltaTime, events) {
    if (!entity.statusEffects || entity.statusEffects.length === 0) return;

    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect = entity.statusEffects[i];
      effect.remaining -= deltaTime;

      // ── poison: synthetic hit → DamageSystem 에 위임 ──────────
      if (effect.type === 'poison' && effect.tickInterval > 0) {
        effect.tickAccumulator += deltaTime;

        while (effect.tickAccumulator >= effect.tickInterval) {
          effect.tickAccumulator -= effect.tickInterval;

          if (!entity.isAlive || entity.pendingDestroy) break;

          events.hits.push({
            attackerId:   'poison',
            targetId:     entity.id,
            target:       entity,
            damage:       effect.magnitude,
            projectileId: null,
            projectile:   null,
          });
        }
      }

      // 수명 만료 → 효과 제거
      if (effect.remaining <= 0 && !entity.pendingDestroy) {
        this._removeEffect(entity, effect, i);
      }
    }
  },

  /**
   * SAFETY(fix): unknown effectId 에 대해 warn 로그 추가.
   *   weaponData 에 존재하지 않는 statusEffectId 오타가 있을 때
   *   조용히 실패하는 대신 콘솔에 즉시 노출한다.
   */
  _applyEffect(target, effectId) {
    const def = getStatusEffectData(effectId);
    if (!def) {
      if (typeof console !== 'undefined') {
        console.warn(`[StatusEffectSystem] 알 수 없는 effectId: "${effectId}" — statusEffectData 를 확인하세요.`);
      }
      return;
    }

    // 동일 타입이 이미 있으면 갱신(재적용)
    const existing = target.statusEffects.find(e => e.type === def.type);
    if (existing) {
      existing.remaining = def.duration;
      return;
    }

    const effect = {
      id:              generateId(),
      type:            def.type,
      remaining:       def.duration,
      magnitude:       def.magnitude,
      tickInterval:    def.tickInterval || 0,
      tickAccumulator: 0,
      color:           def.color,
    };

    if (def.type === 'slow') {
      effect._savedMoveSpeed = target.moveSpeed;
      target.moveSpeed = Math.max(10, Math.floor(target.moveSpeed * def.magnitude));
    }
    if (def.type === 'stun') {
      target.stunned = true;
    }

    target.statusEffects.push(effect);
  },

  /**
   * FIX(bug): stun 중첩 해제 버그 수정.
   *   splice 먼저 수행 후 남은 stun 여부로 entity.stunned 재계산.
   */
  _removeEffect(entity, effect, index) {
    if (effect.type === 'slow' && effect._savedMoveSpeed !== undefined) {
      entity.moveSpeed = effect._savedMoveSpeed;
    }

    entity.statusEffects.splice(index, 1);

    if (effect.type === 'stun') {
      entity.stunned = entity.statusEffects.some(e => e.type === 'stun');
    }
  },
};
