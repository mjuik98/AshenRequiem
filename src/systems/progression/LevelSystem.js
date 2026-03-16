import { getXpForLevel } from '../../data/constants.js';

/**
 * LevelSystem — 레벨업 판정
 *
 * 입력: player.xp, player.level
 * 쓰기: player.level, worldState.playMode ('levelup')
 *
 * NOTE(design): 한 프레임에 여러 레벨치 XP 가 들어와도 레벨업은 1회만 발생한다.
 *   playMode 가 'levelup' 으로 바뀌면 PlayScene.update() 가 early return 하므로
 *   다음 레벨업은 플레이어가 업그레이드를 선택해 playMode 가 'playing' 으로 복귀한 뒤
 *   다음 프레임에 다시 LevelSystem 이 실행되면서 처리된다.
 *   → 연속 레벨업은 레벨업 UI 해소 후 순차 처리 (의도된 동작).
 */
export const LevelSystem = {
  update({ player, worldState }) {
    if (!player || !player.isAlive) return;
    if (worldState.playMode !== 'playing') return;
    const xpNeeded = getXpForLevel(player.level);
    if (player.xp >= xpNeeded) {
      player.xp -= xpNeeded;
      player.level++;
      worldState.playMode = 'levelup';
    }
  },
};
