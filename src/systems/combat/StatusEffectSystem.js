import { getStatusEffectData } from '../../data/statusEffectData.js';
import { generateId } from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 부여 + 틱 처리
 *
 * FIX(bug): _tickEntity 에서 poison 데미지를 entity.hp 에 직접 적용하고
 *   events.deaths 에 직접 push 하던 방식을 제거.
 *   대신 events.hits 에 synthetic hit 을 push → DamageSystem 이 일관되게 처리.
 *   이렇게 하면 poison 킬도 DamageSystem → DeathSystem 경로를 통해
 *   킬 카운트 증가 / XP 드랍 / 사망 이펙트가 정상 발생한다.
 *
 * FIX(code): tick() 시그니처에서 spawnQueue 제거
 *   (poison 데미지 텍스트는 DamageSystem 이 생성하므로 불필요)
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

  /**
   * 상태이상 틱 처리
   *
   * FIX: spawnQueue 파라미터 제거.
   *      poison 틱 데미지는 events.hits 에 synthetic hit 으로 push.
   *      DamageSystem 이 HP 감소, 데미지 텍스트, 사망 판정을 일괄 처리.
   */
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

          // 이미 사망 처리 중이면 중단
          if (!entity.isAlive || entity.pendingDestroy) break;

          // FIX: 직접 HP 감소 + events.deaths.push 제거.
          //      대신 events.hits 에 push → DamageSystem 이 처리.
          events.hits.push({
            attackerId: 'poison',
            targetId:   entity.id,
            target:     entity,
            damage:     effect.magnitude,
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

  _applyEffect(target, effectId) {
    const def = getStatusEffectData(effectId);
    if (!def) return;

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

  _removeEffect(entity, effect, index) {
    if (effect.type === 'slow' && effect._savedMoveSpeed !== undefined) {
      entity.moveSpeed = effect._savedMoveSpeed;
    }
    if (effect.type === 'stun') {
      entity.stunned = false;
    }
    entity.statusEffects.splice(index, 1);
  },
};
