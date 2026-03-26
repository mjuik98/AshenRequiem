import { ELITE_BEHAVIOR } from '../../data/constants.js';

/**
 * EliteBehaviorSystem — 엘리트 / 보스 chargeEffect 상태 정리 전담
 *
 * CHANGE(P1-③): systems/movement/ → systems/combat/ 로 이동
 *   - movement/ 폴더는 순수 위치 이동만 담당
 *   - 투사체 spawn이 포함된 이 시스템은 combat/ 책임
 *
 * CLEANUP: 데드 메서드 제거 (레지스트리 위임 완료 후 잔류 코드)
 *   Before: _chaseMove / _updateDash / _updateCircleDash 가 클래스에 남아 있었으나
 *           update() 루프에서 한 번도 호출되지 않음.
 *           dash / circle_dash 행동은 enemyBehaviorRegistry (dash.js / circleDash.js)
 *           로 완전히 이관되어 EnemyMovementSystem에서 처리됨.
 *   After:  사용되지 않는 세 메서드 삭제 + DEFAULT_PROJ_CFG 상수 삭제
 *           (더 이상 이 파일에서 투사체를 직접 생성하지 않음)
 *
 * 현재 역할:
 *   - elite / boss 엔티티를 순회하며 stunned·knockback 상태일 때
 *     chargeEffect 플래그를 안전하게 해제하는 것만 담당한다.
 *   - 실제 이동·공격 로직은 enemyBehaviorRegistry → EnemyMovementSystem 에서 수행.
 */

export const EliteBehaviorSystem = {
  update({ world }) {
    const enemies = world.entities.enemies;
    const player = world.entities.player;
    if (!player?.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];

      // 비활성 엔티티 — chargeEffect만 확실히 해제
      if (!e.isAlive || e.pendingDestroy) {
        if (e.chargeEffect) e.chargeEffect = false;
        continue;
      }

      // 일반 적은 처리하지 않음
      if (!e.isElite && !e.isBoss) continue;

      // 스턴 / 넉백 중 → chargeEffect 해제
      if (e.stunned || e.knockbackTimer > 0) {
        if (e.chargeEffect) e.chargeEffect = false;
      }

      // 이동 / 공격 로직은 enemyBehaviorRegistry (dash.js / circleDash.js)
      // 가 EnemyMovementSystem을 통해 처리한다. 여기서는 추가 작업 없음.
    }
  },
};
