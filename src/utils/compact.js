/**
 * src/utils/compact.js — 엔티티 생사 판정 (legacy wrapper)
 * 
 * REFACTOR (R-16): entityUtils.js를 re-export 하여 단일 진실의 원천 유지
 */
export { isLive, isDead, getLiveEnemies } from './entityUtils.js';
