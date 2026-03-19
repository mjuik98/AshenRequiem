import { getXpForLevel } from '../../data/constants.js';
import { transitionPlayMode, PlayMode } from '../../state/PlayMode.js';

/**
 * LevelSystem — 레벨업 판정
 *
 * FIX(P3-8): world.playMode 직접 변경 → transitionPlayMode() 사용
 *
 * Before:
 *   world.playMode = 'levelup';  // 전이 규칙 검증 없음, 책임 분산
 *
 * After:
 *   transitionPlayMode(world, PlayMode.LEVELUP);
 *   → PlayMode.js의 전이 규칙 검증 포함
 *   → 허용되지 않은 전이 시 경고 (예: 'dead' 상태에서 레벨업 시도)
 *
 * NOTE: 한 프레임에 여러 레벨치 XP가 들어와도 레벨업은 1회만 발생.
 *   playMode = 'levelup' → PlayScene.update() early return → 다음 레벨업은
 *   업그레이드 선택 후 playMode = 'playing' 복귀 다음 프레임에 처리 (의도된 동작).
 */
export const LevelSystem = {
  update({ world }) {
    const player = world.player;
    if (!player?.isAlive) return;
    if (world.playMode !== PlayMode.PLAYING) return;

    const xpNeeded = getXpForLevel(player.level);
    if (player.xp >= xpNeeded) {
      player.xp   -= xpNeeded;
      player.level++;
      transitionPlayMode(world, PlayMode.LEVELUP);
      if (world.events && world.events.levelUpRequested) {
        world.events.levelUpRequested.push({ player });
      }
    }
  },
};
