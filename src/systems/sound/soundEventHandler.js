/**
 * src/systems/sound/soundEventHandler.js — 사운드 이벤트 핸들러 등록
 *
 * ── 고아 메서드 해결 ─────────────────────────────────────────────────────
 *
 * Before (SoundSystem.js의 processEvents):
 *   SoundSystem에 processEvents(events) 메서드가 존재하지만
 *   EventRegistry에 등록되지 않아 아무도 호출하지 않는 고아(orphan) 메서드였음.
 *   적 사망/피격/픽업 수집 사운드가 실제로는 재생되지 않는 침묵 버그.
 *
 * After (이 파일):
 *   EventRegistry.register() 패턴으로 각 이벤트 타입에 핸들러를 개별 등록.
 *   bossPhaseHandler.js 와 동일한 패턴으로 통일.
 *
 *   PipelineBuilder._registerEventHandlers()에서 호출:
 *     import { registerSoundEventHandlers } from '../systems/sound/soundEventHandler.js';
 *     registerSoundEventHandlers(this._services.soundSystem);
 *
 * 주의:
 *   EventRegistry는 동일 타입에 다수의 핸들러를 허용하므로
 *   중복 등록 방지를 위해 이 함수는 PlayContext 생성 시 1회만 호출해야 한다.
 *   PipelineBuilder._registerEventHandlers()가 이를 보장한다.
 */

import { register } from '../event/EventRegistry.js';

/**
 * 사운드 이벤트 핸들러를 EventRegistry에 등록한다.
 *
 * @param {import('./SoundSystem.js').SoundSystem | import('./NullSoundSystem.js').NullSoundSystem} soundSystem
 */
export function registerSoundEventHandlers(soundSystem) {
  if (!soundSystem) return;

  // 적 사망 사운드
  // deaths 이벤트는 배열이므로 processAll()이 각 항목을 개별 호출함.
  // 첫 번째 사망 이벤트에만 재생하도록 첫 호출에서 처리하면 충분.
  register('deaths', () => {
    soundSystem.play('death');
  });

  // 플레이어 피격 사운드
  register('hits', (event) => {
    if (event.target?.type === 'player') {
      soundSystem.play('damage');
    }
  });

  // 픽업 수집 사운드
  register('pickupCollected', () => {
    soundSystem.play('pickup');
  });

  // 레벨업 사운드 (PlayScene._showLevelUpUI에서 직접 호출하던 것을 이벤트로 통합)
  register('levelUpRequested', () => {
    soundSystem.play('levelup');
  });
}
