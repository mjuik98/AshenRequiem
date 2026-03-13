import { generateId } from '../utils/ids.js';
import { PICKUP_DEFAULTS } from '../data/constants.js';

/**
 * createPickup — 드랍 아이템 (XP 보석 등) 생성
 */
export function createPickup(x, y, xpValue) {
  return {
    id: generateId(),
    type: 'pickup',
    x,
    y,
    xpValue: xpValue || PICKUP_DEFAULTS.xpValue,
    radius: PICKUP_DEFAULTS.radius,
    color: PICKUP_DEFAULTS.color,
    /** 흡수 중인지 */
    magnetized: false,
    isAlive: true,
    pendingDestroy: false,
  };
}
