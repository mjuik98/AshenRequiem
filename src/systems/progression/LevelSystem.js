import { getXpForLevel } from '../../data/constants.js';
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
