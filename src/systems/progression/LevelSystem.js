import { getXpForLevel } from '../../data/constants.js';

/**
 * LevelSystem — 레벨업 판정
 *
 * 입력: player XP / 현재 레벨
 * 읽기: 레벨 테이블
 * 쓰기: 플레이어 레벨, world.playMode
 * 출력: 레벨업 UI 오픈 요청
 */
export const LevelSystem = {
  update({ player, world }) {
    if (!player || !player.isAlive) return;
    if (world.playMode !== 'playing') return;

    const xpNeeded = getXpForLevel(player.level);

    if (player.xp >= xpNeeded) {
      player.xp -= xpNeeded;
      player.level++;
      world.playMode = 'levelup';
    }
  },
};
