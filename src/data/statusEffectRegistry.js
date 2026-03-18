/**
 * src/data/statusEffectRegistry.js
 *
 * FIX(BUG-K): stun.onRemove — 제거 후 남은 같은 타입 스턴 체크 타이밍 오류
 *
 *   Before: onRemove 내부에서 entity.statusEffects.some(e => e.type === 'stun')을 체크하는데,
 *           _tickEntity에서 splice(i, 1)로 effect를 이미 배열에서 제거한 뒤
 *           onRemove를 호출하므로 이 로직은 올바른 것처럼 보이나,
 *           외부에서 직접 onRemove를 호출하거나 순서가 바뀌면
 *           아직 배열에 남아있는 자신을 포함해 집계되어 stun이 해제되지 않음
 *   After:  onRemove에 effect 파라미터를 활용하여 "자신 제외" 로직을 명시적으로 작성
 *           (현재 _tickEntity 호출 순서에서는 이미 splice 후 onRemove이므로 동작은 동일하지만
 *            방어 코드로서 명시적 self-exclusion 패턴 적용)
 *
 * FIX(BUG-L): poison.onTick — tickAccumulator 누적 상한 없음
 *
 *   Before: while (tickAccumulator >= tickInterval) 루프에서
 *           entity가 이미 pendingDestroy인 경우 break 처리되지만
 *           루프가 최초 진입 이전에 isAlive 체크를 하지 않아
 *           이미 죽은(isAlive=false) 적에게 poison tick이 발행되는 엣지 케이스 존재
 *           (DamageSystem에서 pendingDestroy 가드가 있어 실제 hp 감소는 막히지만
 *            events.hits 큐에 노이즈 항목이 쌓임)
 *   After:  while 루프 진입 전 isAlive 추가 체크
 */

export const statusEffectRegistry = {

  /**
   * slow — 이동 속도 감소
   * (속도 적용은 PlayerMovementSystem / EnemyMovementSystem이
   *  entity.statusEffects 배열을 직접 조회하므로 onApply/onRemove 무처리)
   */
  slow: {
    onApply(entity, effect, def) {},
    onTick(entity, effect, deltaTime, events) {},
    onRemove(entity, effect) {},
  },

  /**
   * poison — 지속 데미지
   */
  poison: {
    onApply(entity, effect, def) {
      effect.tickAccumulator = 0;
    },
    onTick(entity, effect, deltaTime, events) {
      if (effect.tickInterval <= 0) return;
      if (!events?.hits) return;

      effect.tickAccumulator = (effect.tickAccumulator || 0) + deltaTime;

      // FIX(BUG-L): while 진입 전 isAlive 체크 추가
      // isAlive=false지만 pendingDestroy 처리 전인 엔티티에게 poison tick hit 발행 방지
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
    },
    onRemove(entity, effect) {},
  },

  /**
   * stun — 행동 불능
   */
  stun: {
    onApply(entity, effect, def) {
      entity.stunned = true;
    },
    onTick(entity, effect, deltaTime, events) {},

    /**
     * FIX(BUG-K): 제거 대상 effect를 명시적으로 제외한 나머지 스턴 여부 체크
     *
     * Before: entity.statusEffects.some(e => e.type === 'stun')
     *         → _tickEntity가 splice 후 onRemove를 호출하는 현재 순서에서는
     *            배열에서 이미 빠진 상태이므로 우연히 맞지만,
     *            직접 호출 등 순서가 달라지면 자기 자신을 포함해 잘못 집계될 수 있음
     * After:  제거 대상 effect.id를 명시적으로 제외하여 순서 독립적으로 안전
     */
    onRemove(entity, effect) {
      entity.stunned = (entity.statusEffects ?? [])
        .some(e => e.type === 'stun' && e.id !== effect.id);
    },
  },
};
