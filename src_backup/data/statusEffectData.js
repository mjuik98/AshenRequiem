/** statusEffectData.js — 상태이상 정의 */
export const statusEffectData = {
  slow:   { id: 'slow',   type: 'slow',   duration: 2.0, magnitude: 0.5, tickInterval: 0,   color: '#90caf9' },
  poison: { id: 'poison', type: 'poison', duration: 3.0, magnitude: 1,   tickInterval: 0.5, color: '#aed581' },
  stun:   { id: 'stun',   type: 'stun',   duration: 0.6, magnitude: 0,   tickInterval: 0,   color: '#fff176' },
};

export function getStatusEffectData(id) {
  return statusEffectData[id] ?? null;
}
