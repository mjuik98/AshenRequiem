/**
 * src/systems/sound/NullSoundSystem.js
 *
 * ── 개선 P0: 단일 책임 복원 ───────────────────────────────────────────────
 *
 * Before (버그):
 *   파일 하단에 migrateSession(), CURRENT_STORAGE_VERSION 등
 *   SessionState 관련 코드가 혼재해 있었음.
 *   → 파일명과 책임이 불일치.
 *   → SessionState 마이그레이션 로직이 두 곳(legacy barrel 포함)에 존재.
 *
 * After (수정):
 *   NullSoundSystem 클래스만 존재. SessionState 코드는 전부
 *   src/state/session/sessionMigrations.js 로 이동됨 (단일 진실의 원천).
 *
 * 사용법 (PlayContext.create() 에서):
 *   import { NullSoundSystem } from '../systems/sound/NullSoundSystem.js';
 *   import { SoundSystem }     from '../systems/sound/SoundSystem.js';
 *
 *   ctx.services.soundSystem = options.soundEnabled
 *     ? new SoundSystem()
 *     : new NullSoundSystem();   // null 대신 NullObject 패턴 — null 체크 불필요
 *
 * 각 System에서 null 체크 없이 직접 호출 가능:
 *   services.soundSystem.play('sfx_hit');     // 비활성화 시 조용히 no-op
 *   services.soundSystem.playBgm('bgm_play'); // null 체크 불필요
 */
export class NullSoundSystem {
  /** @param {string} _id  에셋 id (무시) */
  play(_id) {}

  /** @param {string} _id */
  playBgm(_id) {}

  stopBgm() {}

  /** @param {number} _volume */
  setVolume(_volume) {}

  /** @param {boolean} _enabled */
  setEnabled(_enabled) {}

  get isEnabled() { return false; }
}
