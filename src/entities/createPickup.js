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

/**
 * resetPickup — ObjectPool 반환 후 픽업 재초기화
 *
 * @param {object} obj    - 풀에서 꺼낸 기존 픽업 객체
 * @param {object} config - 새 픽업 설정
 */
export function resetPickup(obj, config) {
  obj.id          = generateId();
  obj.type        = 'pickup';
  obj.x           = config.x          ?? 0;
  obj.y           = config.y          ?? 0;
  obj.xpValue     = config.xpValue    ?? PICKUP_DEFAULTS.xpValue;
  obj.color       = config.color      ?? PICKUP_DEFAULTS.color;
  obj.radius      = config.radius     ?? PICKUP_DEFAULTS.radius;
  obj.pickupType  = config.pickupType ?? 'xp';
  obj.isAlive     = true;
  obj.pendingDestroy = false;
  obj.collected   = false;
  obj.magnetized   = false;
  return obj;
}
