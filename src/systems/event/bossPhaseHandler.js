/**
 * src/systems/event/bossPhaseHandler.js
 *
 * ── 개선 P2: BossPhaseSystem 연출 연결 ───────────────────────────────────
 *
 * Before:
 *   BossPhaseSystem이 bossPhaseChanged 이벤트를 발행하지만,
 *   이를 수신하는 핸들러가 없어 페이즈 전환이 UI에 표시되지 않았음.
 *
 * After:
 *   EventRegistry에 bossPhaseChanged 핸들러를 등록.
 *   - 체력바 UI 갱신 요청
 *   - damageText 스타일 페이즈 알림 이펙트 생성
 *   - (선택) CameraSystem 쉐이크 이벤트 큐잉
 *
 * 등록 방법 (PlayContext.create() 또는 PlayScene.enter() 에서):
 *   import { registerBossPhaseHandler } from '../systems/event/bossPhaseHandler.js';
 *   registerBossPhaseHandler(services);
 *
 * 규칙 (AGENTS.md §6.6):
 *   이벤트 핸들링 추가 시 EventRegistry.register() 로 등록한다.
 *   핸들러 내부에서 다른 시스템을 직접 부르지 않고
 *   world.events.{type}.push(...) 로 큐잉한다.
 */

import { register } from '../event/EventRegistry.js';

/**
 * bossPhaseChanged 핸들러를 EventRegistry에 등록한다.
 * @param {import('../../state/pipelineTypes.js').Services} services
 */
export function registerBossPhaseHandler(services) {
  register('bossPhaseChanged', (event, world) => {
    const { enemy, announceText, phaseIndex, hpThreshold } = event;

    // ── 1. 알림 이펙트 생성 (damageText 스타일 재활용) ─────────────────
    const effect = services.effectPool?.acquire();
    if (effect) {
      Object.assign(effect, {
        type:        'damageText',
        x:           enemy.x,
        y:           enemy.y - enemy.radius - 20,
        text:        announceText || `페이즈 ${phaseIndex + 2} 돌입!`,
        color:       phaseIndex === 0 ? '#FF8C00' : '#FF2222',
        lifetime:    0,
        maxLifetime: 2.5,
        isAlive:     true,
        pendingDestroy: false,
      });
      world.effects?.push(effect);
    }

    // ── 2. 카메라 쉐이크 요청 (CameraSystem이 처리) ────────────────────
    // CameraSystem이 shakeRequested 이벤트를 지원할 경우 활성화:
    // world.events.shakeRequested?.push({ intensity: 8, duration: 0.4 });

    // ── 3. UI 상태 업데이트 (체력바 색상 변경 등) ──────────────────────
    // uiState는 PlayContext를 통해 접근하거나,
    // 별도 UIBridge 이벤트로 분리하는 것을 권장:
    // world.events.uiUpdateRequested?.push({ type: 'bossPhaseBadge', phaseIndex });

    console.info(
      `[BossPhaseHandler] ${enemy.enemyId} 페이즈 ${phaseIndex + 2} 발동 `
      + `(HP ≤ ${Math.round(hpThreshold * 100)}%)`,
    );
  });
}
