/**
 * src/systems/progression/ExperienceSystem.js — 픽업 자기력 흡수 + XP 적용
 *
 * FIX(BUG-PICKUP-DOUBLE): 동일 픽업의 pickupCollected 이벤트 이중 push 방지
 *
 *   Before (버그):
 *     ExperienceSystem이 자석 이동 중 플레이어와 겹치면
 *     events.pickupCollected.push(...) 를 직접 호출함.
 *     같은 프레임에 CollisionSystem도 동일 픽업을 감지해
 *     events.pickupCollected.push(...) 를 호출할 수 있음.
 *
 *     결과:
 *       - 동일 픽업이 pickupCollected 큐에 2회 등록
 *       - XP 중복은 두 번째 처리 시 pk.isAlive=false 가드로 차단됨 (안전)
 *       - BUT: pickupCollected 이벤트 리스너(사운드, 이펙트 등)가 2번 발동
 *
 *   After (수정):
 *     ExperienceSystem의 자석 이동 catch 구간에서 push 하기 전
 *     pk.pendingDestroy 체크를 추가하여 CollisionSystem이 이미 처리한 픽업은 스킵.
 *     ExperienceSystem의 XP 적용 루프에서 pk.isAlive/pendingDestroy 가드는 유지.
 *
 *     순서 보장:
 *       CollisionSystem(60) → ExperienceSystem(90)
 *       CollisionSystem이 먼저 pickupCollected를 push하면
 *       ExperienceSystem XP 적용 루프에서 pk.isAlive=false, pk.pendingDestroy=true 세팅.
 *       이후 ExperienceSystem 자석 루프의 catch 구간은
 *       !pk.isAlive || pk.pendingDestroy 로 skip → 이중 push 없음.
 *
 * PERF: normalize(sub(...)) 임시 객체 제거 → 인라인 계산 (기존 유지)
 */
import { distanceSq }      from '../../math/Vector2.js';
import { PICKUP_DEFAULTS } from '../../data/constants.js';

export const ExperienceSystem = {
  update({ world: { events, player, pickups, deltaTime } }) {
    if (!player?.isAlive) return;

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const speed       = PICKUP_DEFAULTS.magnetSpeed * deltaTime;

    // ── 1단계: XP 적용 + 픽업 비활성화 ──────────────────────────────
    // CollisionSystem(60)이 먼저 pickupCollected에 push한 항목을 처리.
    // 여기서 먼저 처리해야 자석 루프(2단계)의 중복 방지 가드가 동작함.
    const collected = events.pickupCollected;
    for (let i = 0; i < collected.length; i++) {
      const pk = collected[i].pickup;
      // isAlive/pendingDestroy 중복 처리 방지 가드 (기존 유지)
      if (!pk.isAlive || pk.pendingDestroy) continue;
      player.xp        += pk.xpValue ?? 0;
      pk.isAlive        = false;
      pk.pendingDestroy = true;
    }

    // ── 2단계: 자석 이동 + 자체 pick up ────────────────────────────
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      // FIX(BUG-PICKUP-DOUBLE): 이미 수집/처리된 픽업은 자석 로직 전체 스킵
      if (!pk.isAlive || pk.pendingDestroy) continue;

      if (!pk.magnetized && distanceSq(player, pk) <= magnetRadSq) {
        pk.magnetized = true;
      }

      if (pk.magnetized) {
        // PERF: 인라인 계산 (임시 객체 없음)
        const dx      = player.x - pk.x;
        const dy      = player.y - pk.y;
        const distSq2 = dx * dx + dy * dy;
        const len     = Math.sqrt(distSq2) || 1;
        pk.x += (dx / len) * speed;
        pk.y += (dy / len) * speed;

        const catchRadSq = (player.radius + pk.radius) * (player.radius + pk.radius);
        if (distSq2 < catchRadSq) {
          // FIX(BUG-PICKUP-DOUBLE): CollisionSystem이 이미 처리했으면 skip
          // (isAlive=false, pendingDestroy=true로 이미 세팅됨 → 위의 continue에서 걸림)
          // 여기까지 왔다면 CollisionSystem은 이 픽업을 처리하지 않은 것 → 안전하게 push
          events.pickupCollected.push({ pickup: pk, playerId: player.id });
          // 즉시 XP 적용 + 비활성화 (이중 push 방지를 위해 pendingDestroy 선행 세팅)
          player.xp        += pk.xpValue ?? 0;
          pk.isAlive        = false;
          pk.pendingDestroy = true;
        }
      }
    }
  },
};
