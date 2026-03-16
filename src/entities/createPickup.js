import { generateId }    from '../utils/ids.js';
import { PICKUP_DEFAULTS } from '../data/constants.js';

/** createPickup — XP 픽업 엔티티 생성 */
export function createPickup(x, y, xpValue) {
  return {
    id:             generateId(),
    type:           'pickup',
    x, y,
    xpValue:        xpValue ?? PICKUP_DEFAULTS.xpValue,
    radius:         PICKUP_DEFAULTS.radius,
    color:          PICKUP_DEFAULTS.color,
    magnetized:     false,
    isAlive:        true,
    pendingDestroy: false,
  };
}
