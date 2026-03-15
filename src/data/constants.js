export const PLAYER_DEFAULTS = {
  hp: 100, maxHp: 100, moveSpeed: 200, radius: 16, magnetRadius: 60, color: '#4fc3f7',
};
export const XP_TABLE = [0,5,12,22,35,50,70,95,125,160,200];
export function getXpForLevel(level) {
  if (level < XP_TABLE.length) return XP_TABLE[level];
  return XP_TABLE[XP_TABLE.length - 1] + (level - XP_TABLE.length + 1) * 50;
}
export const PICKUP_DEFAULTS = { xpValue: 1, radius: 6, color: '#66bb6a', magnetSpeed: 400 };
export const EFFECT_DEFAULTS = { duration: 0.4 };
