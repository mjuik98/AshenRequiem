/**
 * src/systems/sound/soundEventHandler.js — 사운드 이벤트 핸들러 등록
 *
 * REFACTOR: 모듈 레벨 register() → 인스턴스 registry 파라미터 수신
 *
 * Before:
 *   import { register } from '../event/EventRegistry.js'; // 모듈 레벨 싱글턴
 *   register('deaths', handler);
 *   → PlayScene 재시작마다 핸들러 누적 → 사운드 중복 재생
 *
 * After:
 *   registerSoundEventHandlers(soundSystem, registry)
 *   → registry 인스턴스에 등록 → dispose() 시 자동 정리
 *
 * 주의:
 *   PlayContext 생성 시 1회만 호출 (PipelineBuilder._registerEventHandlers()).
 *   동일 registry 인스턴스에 중복 호출 금지.
 */

/**
 * 사운드 이벤트 핸들러를 EventRegistry 인스턴스에 등록한다.
 *
 * @param {import('./SoundSystem.js').SoundSystem | import('./NullSoundSystem.js').NullSoundSystem} soundSystem
 * @param {import('../event/EventRegistry.js').EventRegistry} registry
 */
export function registerSoundEventHandlers(soundSystem, registry) {
  if (!soundSystem || !registry) return;
  let lastDeathSfxAt = -Infinity;
  let lastPickupSfxAt = -Infinity;
  const deathSfxCooldown = 0.08;
  const pickupSfxCooldown = 0.05;

  // 적 사망 사운드 (deaths 배열의 각 항목마다 호출됨)
  registry.register('deaths', (event, world) => {
    if (event.entity?.type !== 'enemy') return;

    const now = world?.elapsedTime ?? 0;
    if ((now - lastDeathSfxAt) < deathSfxCooldown && !event.entity?.isBoss) return;

    lastDeathSfxAt = now;
    soundSystem.play('death');
  });

  // 플레이어 피격 사운드
  registry.register('hits', (event) => {
    if (event.target?.type === 'player') {
      soundSystem.play('damage');
    }
  });

  // 픽업 수집 사운드
  registry.register('pickupCollected', (_, world) => {
    const now = world?.elapsedTime ?? 0;
    if ((now - lastPickupSfxAt) < pickupSfxCooldown) return;

    lastPickupSfxAt = now;
    soundSystem.play('pickup');
  });

  // 레벨업 사운드
  registry.register('levelUpRequested', () => {
    soundSystem.play('levelup');
  });
}
