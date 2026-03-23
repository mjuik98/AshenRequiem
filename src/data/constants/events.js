/**
 * src/data/constants/events.js — 이벤트 타입 목록 (단일 진실의 원천)
 *
 * CHANGE: chestCollected 추가 — 상자 획득 이벤트
 */

export const EVENT_TYPES = [
  'hits',
  'deaths',
  'pickupCollected',
  'levelUpRequested',
  'statusApplied',
  'bossPhaseChanged',
  'bossSpawned',
  'spawnRequested',
  'currencyEarned',
  'weaponEvolved',
  'weaponAcquired',
  'accessoryAcquired',
  'chestCollected',   // ← NEW: 상자 획득 시 발행
];
