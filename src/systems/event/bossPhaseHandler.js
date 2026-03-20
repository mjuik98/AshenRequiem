/**
 * src/systems/event/bossPhaseHandler.js — 보스 페이즈 전환 연출 핸들러
 *
 * REFACTOR: 모듈 레벨 register() → 인스턴스 registry 파라미터 수신
 *
 * Before:
 *   import { register } from './EventRegistry.js'; // 모듈 레벨 싱글턴
 *   register('bossPhaseChanged', handler);
 *   → PlayScene 재시작마다 핸들러 누적
 *
 * After:
 *   registerBossPhaseHandler(services, registry) — registry 인스턴스 수신
 *   → PlayContext가 소유하는 EventRegistry 인스턴스에 등록
 *   → dispose() 시 자동 정리
 */

/**
 * bossPhaseChanged 핸들러를 EventRegistry 인스턴스에 등록한다.
 *
 * @param {import('../../state/pipelineTypes.js').Services} services
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
export function registerBossPhaseHandler(services, registry) {
  registry.register('bossPhaseChanged', (event, world) => {
    const { enemy, announceText, phaseIndex, hpThreshold } = event;

    // ── 1. 알림 이펙트 생성 (damageText 스타일 재활용) ─────────────────
    const effect = services.effectPool?.acquire();
    if (effect) {
      Object.assign(effect, {
        type:           'damageText',
        effectType:     'damageText',
        x:              enemy.x,
        y:              enemy.y - enemy.radius - 20,
        text:           announceText || `페이즈 ${phaseIndex + 2} 돌입!`,
        color:          phaseIndex === 0 ? '#FF8C00' : '#FF2222',
        lifetime:       0,
        maxLifetime:    2.5,
        isAlive:        true,
        pendingDestroy: false,
      });
      world.effects?.push(effect);
    }

    // ── 2. 카메라 쉐이크 요청 (CameraSystem이 처리) ────────────────────
    // world.events.shakeRequested?.push({ intensity: 8, duration: 0.4 });

    console.info(
      `[BossPhaseHandler] ${enemy.enemyDataId ?? enemy.enemyId} 페이즈 ${phaseIndex + 2} 발동 `
      + `(HP ≤ ${Math.round(hpThreshold * 100)}%)`,
    );
  });
}
