/**
 * src/behaviors/enemyBehaviors/dash.js — 돌진 행동 패턴
 *
 * [FIX P0-1] dash behaviorId를 enemyBehaviorRegistry에 등록하기 위한 독립 모듈.
 *
 * Before:
 *   EliteBehaviorSystem이 behaviorId === 'dash' 를 내부에서 직접 분기 처리.
 *   → enemyBehaviorRegistry에 'dash'가 없어 npm run validate 경고 4건 발생.
 *   → EnemyMovementSystem이 엘리트를 처리할 때 chase fallback으로 동작해
 *     EliteBehaviorSystem과 이중 이동이 발생하는 잠재적 버그 존재.
 *
 * After:
 *   이 파일을 enemyBehaviorRegistry에 등록.
 *   EnemyMovementSystem: 엘리트(isElite || isBoss)는 레지스트리에서 동작 함수를 가져와 실행.
 *   EliteBehaviorSystem: 엘리트를 skip하거나 제거 (중복 방지).
 *
 * behaviorState 구조 (createEnemy 또는 resetEnemy에서 초기화):
 *   { phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 }
 *
 * 컨텍스트 시그니처 (EnemyMovementSystem에서 전달):
 *   (enemy, { player, enemies, deltaTime, spawnQueue })
 */

import { ELITE_BEHAVIOR } from '../../data/constants.js';

const WINDUP_DURATION  = 0.70; // 차징 연출 시간 (s)
const DASH_DURATION    = 0.32; // 실제 돌진 지속 시간 (s)
const IDLE_RESET_TIMER = 2.20; // 돌진 후 재쿨다운 (s)

/**
 * 돌진 행동 — idle → windup → dashing 3단계 FSM.
 *
 * idle:    플레이어 방향으로 보통 속도 추적, 타이머 소진 시 windup 진입.
 * windup:  chargeEffect=true, 실제 이동 없음. 시각적 예고.
 * dashing: DASH_SPEED로 고정 방향 돌진, 지속 시간 후 idle 복귀.
 *
 * @param {object} enemy
 * @param {{ player: object, deltaTime: number }} ctx
 */
export function dash(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  // behaviorState가 없으면 안전하게 초기화 (ObjectPool 재사용 방어)
  if (!enemy.behaviorState) {
    enemy.behaviorState = { phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 };
  }

  const s  = enemy.behaviorState;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;

  if (s.phase === 'idle') {
    // 플레이어 방향 추적
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    enemy.x += (dx / dist) * enemy.moveSpeed * deltaTime;
    enemy.y += (dy / dist) * enemy.moveSpeed * deltaTime;

    s.timer -= deltaTime;
    if (s.timer <= 0) {
      // 현재 플레이어 방향으로 돌진 벡터 확정
      const d       = Math.sqrt(dx * dx + dy * dy) || 1;
      s.dashDirX    = dx / d;
      s.dashDirY    = dy / d;
      s.phase       = 'windup';
      s.timer       = WINDUP_DURATION;
    }

  } else if (s.phase === 'windup') {
    enemy.chargeEffect = true;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      enemy.chargeEffect = false;
      s.phase            = 'dashing';
      s.timer            = DASH_DURATION;
    }

  } else if (s.phase === 'dashing') {
    enemy.x += s.dashDirX * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
    enemy.y += s.dashDirY * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      s.phase = 'idle';
      s.timer = IDLE_RESET_TIMER;
    }
  }
}
