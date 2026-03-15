/**
 * statusEffectData.js — 상태이상 정의
 *
 * type: 'slow' | 'poison' | 'stun'
 * magnitude: slow → moveSpeed 배율, poison → 틱당 데미지, stun → 미사용
 * tickInterval: 0 이면 틱 없음 (slow, stun)
 */
export const statusEffectData = {
  slow: {
    id: 'slow',
    type: 'slow',
    duration: 2.0,
    magnitude: 0.5,       // moveSpeed × 0.5
    tickInterval: 0,
    color: '#90caf9',     // 파란 링
  },
  poison: {
    id: 'poison',
    type: 'poison',
    duration: 3.0,
    magnitude: 1,         // 틱당 1 데미지
    tickInterval: 0.5,    // 0.5초마다 틱
    color: '#aed581',     // 초록 링
  },
  stun: {
    id: 'stun',
    type: 'stun',
    duration: 0.6,
    magnitude: 0,
    tickInterval: 0,
    color: '#fff176',     // 노란 링
  },
};

/** id로 상태이상 정의 조회 */
export function getStatusEffectData(id) {
  return statusEffectData[id] || null;
}
