import { getXpForLevel } from '../../data/constants.js';
export const LevelSystem = {
  update({ player, world }) {
    if (!player || !player.isAlive) return;
    if (world.playMode !== 'playing') return;
    const xpNeeded = getXpForLevel(player.level);
    if (player.xp >= xpNeeded) { player.xp -= xpNeeded; player.level++; world.playMode = 'levelup'; }
  },
};
