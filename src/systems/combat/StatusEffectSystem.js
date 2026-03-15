import { getStatusEffectData } from '../../data/statusEffectData.js';
import { generateId } from '../../utils/ids.js';

/**
 * StatusEffectSystem — 상태이상 적용 및 틱 처리
 *
 * applyFromHits — events.hits를 읽어 투사체 statusEffectId 기반으로 효과 적용
 * tick          — 모든 엔티티의 활성 상태이상을 1프레임 처리
 *
 * 계약:
 *   입력: events.hits, enemies[], player, deltaTime, spawnQueue
 *   쓰기: entity.statusEffects[], entity.moveSpeed(slow), entity.stunned(stun),
 *         entity.hp(poison), events.deaths(독사망)
 *   출력: spawnQueue에 데미지 텍스트 이펙트
 */
export const StatusEffectSystem = {

  /**
   * 이번 프레임 hits에서 상태이상 적용
   */
  applyFromHits({ hits }) {
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const proj = hit.projectile;
      if (!proj || !proj.statusEffectId) continue;

      // 발동 확률 체크
      if (Math.random() > (proj.statusEffectChance ?? 1.0)) continue;

      const target = hit.target;
      // ⑥ pendingDestroy 명시 체크 추가 (DamageSystem이 isAlive와 함께 설정하지만 의도 명확화)
      if (!target || !target.isAlive || target.pendingDestroy || !target.statusEffects) continue;

      this._applyEffect(target, proj.statusEffectId);
    }
  },

  /**
   * 활성 상태이상 틱 처리 (독 데미지, 지속시간 소진, 만료 제거)
   */
  tick({ enemies, player, deltaTime, events, spawnQueue }) {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      // ① 이미 사망 처리된 적은 틱 스킵
      if (!enemy.isAlive || enemy.pendingDestroy) continue;
      this._tickEntity(enemy, deltaTime, events, spawnQueue);
    }
    if (player && player.isAlive && !player.pendingDestroy) {
      this._tickEntity(player, deltaTime, events, spawnQueue);
    }
  },

  // ─── 내부 메서드 ───

  _tickEntity(entity, deltaTime, events, spawnQueue) {
    if (!entity.statusEffects || entity.statusEffects.length === 0) return;

    for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
      const effect = entity.statusEffects[i];
      effect.remaining -= deltaTime;

      // 독 틱 처리
      if (effect.type === 'poison' && effect.tickInterval > 0) {
        effect.tickAccumulator += deltaTime;

        while (effect.tickAccumulator >= effect.tickInterval) {
          effect.tickAccumulator -= effect.tickInterval;

          if (!entity.isAlive) break;

          entity.hp -= effect.magnitude;

          // 독 데미지 텍스트
          spawnQueue.push({
            type: 'effect',
            config: {
              x: entity.x,
              y: entity.y - entity.radius,
              effectType: 'damageText',
              text: `-${effect.magnitude}`,
              color: '#aed581',
              duration: 0.4,
            },
          });

          // 독으로 사망
          if (entity.hp <= 0 && entity.isAlive) {
            entity.hp = 0;
            entity.isAlive = false;
            entity.pendingDestroy = true;
            events.deaths.push({
              entityId: entity.id,
              entity,
              killedBy: 'poison',
            });
          }
        }
      }

      // ② 독 사망으로 이미 pendingDestroy가 설정된 경우 _removeEffect를 건너뜀
      //    (사망한 엔티티는 flush 단계에서 배열째 제거되므로 splice 불필요)
      if (effect.remaining <= 0 && !entity.pendingDestroy) {
        this._removeEffect(entity, effect, i);
      }
    }
  },

  _applyEffect(target, effectId) {
    const def = getStatusEffectData(effectId);
    if (!def) return;

    // 동일 타입 효과가 있으면 시간만 갱신 (스택 없음)
    const existing = target.statusEffects.find(e => e.type === def.type);
    if (existing) {
      existing.remaining = def.duration;
      // ⑦ 슬로우 갱신 시: 현재 moveSpeed가 업그레이드 등으로 변경됐을 수 있으므로
      //    슬로우가 이미 적용된 상태(즉 moveSpeed는 이미 줄어 있음)에서 _savedMoveSpeed를
      //    업데이트할 필요는 없음. 단, 만료→재적용이 아닌 갱신 케이스이므로
      //    _savedMoveSpeed는 최초 적용 시점의 원본 값을 계속 유지하는 것이 올바름.
      //    → 추가 처리 없이 remaining 갱신만으로 충분.
      return;
    }

    const effect = {
      id: generateId(),
      type: def.type,
      remaining: def.duration,
      magnitude: def.magnitude,
      tickInterval: def.tickInterval || 0,
      tickAccumulator: 0,
      color: def.color,
    };

    // 슬로우: moveSpeed 직접 변경 후 원본 저장
    if (def.type === 'slow') {
      effect._savedMoveSpeed = target.moveSpeed;
      target.moveSpeed = Math.max(10, Math.floor(target.moveSpeed * def.magnitude));
    }

    // 스턴: stunned 플래그
    if (def.type === 'stun') {
      target.stunned = true;
    }

    target.statusEffects.push(effect);
  },

  _removeEffect(entity, effect, index) {
    // 슬로우 복구
    if (effect.type === 'slow' && effect._savedMoveSpeed !== undefined) {
      entity.moveSpeed = effect._savedMoveSpeed;
    }
    // 스턴 해제
    if (effect.type === 'stun') {
      entity.stunned = false;
    }
    entity.statusEffects.splice(index, 1);
  },
};
