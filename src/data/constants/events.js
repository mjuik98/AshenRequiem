/**
 * src/data/constants/events.js — 이벤트 타입 목록 (단일 진실의 원천)
 *
 * payload shape는 eventContracts.js가 소유하고, 이 모듈은 타입 목록만 재노출한다.
 */

import {
  PLAY_EVENT_CONTRACTS,
  PLAY_EVENT_TYPES,
  getPlayEventContract,
} from './eventContracts.js';

export const EVENT_TYPES = PLAY_EVENT_TYPES;
export { PLAY_EVENT_CONTRACTS, getPlayEventContract };
