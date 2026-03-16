import { getXpForLevel } from '../../data/constants.js';

/**
 * LevelSystem — 레벨업 판정
 *
 * NOTE: 한 프레임에 여러 레벨치 XP가 들어와도 레벨업은 1회만 발생.
 *   playMode = 'levelup' → PlayScene.update() early return → 다음 레벨업은
 *   업그레이드 선택 후 playMode = 'playing' 복귀 다음 프레임에 처리 (의도된 동작).
 */
export const LevelSystem = {
  update({ player, worldState }) {
    if (!player?.isAlive) return;
    if (worldState.playMode !== 'playing') return;

    const xpNeeded = getXpForLevel(player.level);
    if (player.xp >= xpNeeded) {
      player.xp -= xpNeeded;
      player.level++;
      worldState.playMode = 'levelup';
    }
  },
};
