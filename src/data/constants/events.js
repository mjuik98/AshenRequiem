/**
 * src/data/constants/events.js — 이벤트 타입 목록 (단일 진실의 원천)
 *
 * REFACTOR: constants.js God File 분리
 *   EVENT_TYPES 영역 추출
 *
 * NOTE: EventRegistry.js 에도 동일한 배열이 있었음.
 *       이 파일이 단일 소스이므로, EventRegistry.js 는 여기서 import 하도록 점진적 마이그레이션 예정.
 */

export const EVENT_TYPES = [
  'hits',
  'deaths',
  'pickupCollected',
  'levelUpRequested',
  'statusApplied',
  'bossPhaseChanged',
  'spawnRequested',
];
