/**
 * src/behaviors/enemyBehaviors/dash.js — 돌진 행동 패턴
 *
 * FIX(BUG-CHARGEEFFECT-STUN): windup 중 스턴 시 chargeEffect 1프레임 잔류 방지
 *
 *   Before (버그):
 *     dash.js는 windup 페이즈 진입 시 chargeEffect=true를 세팅.
 *     EnemyMovementSystem에서 stunned/knockback이면 behaviorFn 호출 자체를 skip.
 *     → 스턴 발생 시 chargeEffect 해제 코드가 실행될 기회가 없음.
 *     → chargeEffect가 true인 채로 1프레임(또는 그 이상) 잔류.
 *
 *   After (수정):
 *     EnemyMovementSystem이 stunned/knockback을 검사하여 continue하기 전에
 *     dash.js 내에서 chargeEffect를 관리.
 *     그러나 EnemyMovementSystem의 continue 이전에 dash.js가 호출되지 않으므로
 *     다른 방법이 필요: windup 페이즈 탈출 시(→dashing) chargeEffect=false를 명시,
 *     그리고 idle 페이즈에서도 chargeEffect=false를 보장.
 *
 *   EliteBehaviorSystem(35)이 최후 방어선으로 stunned 상태에서 chargeEffect를 정리함.
 *   이 파일의 수정은 "정상 상태 전환" 경로에서 chargeEffect가 올바르게 관리되도록 보장.
 */

import { ELITE_BEHAVIOR } from '../../data/constants.js';

const WINDUP_DURATION  = 0.70;
const DASH_DURATION    = 0.32;
const IDLE_RESET_TIMER = 2.20;

/**
 * 돌진 행동 — idle → windup → dashing 3단계 FSM.
 *
 * @param {object} enemy
 * @param {{ player: object, deltaTime: number }} ctx
 */
export function dash(enemy, { player, deltaTime }) {
  if (!player?.isAlive) return;

  if (!enemy.behaviorState) {
    enemy.behaviorState = { phase: 'idle', timer: 1.5, dashDirX: 0, dashDirY: 0 };
  }

  const s  = enemy.behaviorState;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;

  if (s.phase === 'idle') {
    // FIX: idle 상태에서 항상 chargeEffect=false 보장 (windup에서 idle로 복귀 시 포함)
    if (enemy.chargeEffect) enemy.chargeEffect = false;

    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    enemy.x += (dx / dist) * enemy.moveSpeed * deltaTime;
    enemy.y += (dy / dist) * enemy.moveSpeed * deltaTime;

    s.timer -= deltaTime;
    if (s.timer <= 0) {
      const d    = Math.sqrt(dx * dx + dy * dy) || 1;
      s.dashDirX = dx / d;
      s.dashDirY = dy / d;
      s.phase    = 'windup';
      s.timer    = WINDUP_DURATION;
    }

  } else if (s.phase === 'windup') {
    enemy.chargeEffect = true;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      // FIX: windup → dashing 전환 시 chargeEffect 명시적으로 해제
      enemy.chargeEffect = false;
      s.phase            = 'dashing';
      s.timer            = DASH_DURATION;
    }

  } else if (s.phase === 'dashing') {
    // FIX: dashing 상태에서도 chargeEffect=false 보장 (예외 경로 방어)
    if (enemy.chargeEffect) enemy.chargeEffect = false;

    enemy.x += s.dashDirX * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
    enemy.y += s.dashDirY * ELITE_BEHAVIOR.DASH_SPEED * deltaTime;
    s.timer -= deltaTime;
    if (s.timer <= 0) {
      s.phase = 'idle';
      s.timer = IDLE_RESET_TIMER;
    }
  }
}
