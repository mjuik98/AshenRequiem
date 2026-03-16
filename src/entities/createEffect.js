import { generateId }    from '../utils/ids.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

/** createEffect — 시각 이펙트 엔티티 생성 */
export function createEffect(config) {
  return {
    id:             generateId(),
    type:           'effect',
    // FIX(bug): || → ?? (x/y가 0일 때 잘못된 값으로 대체되는 버그 방지)
    x:              config.x          ?? 0,
    y:              config.y          ?? 0,
    effectType:     config.effectType ?? 'burst',
    color:          config.color      ?? '#ff5722',
    text:           config.text       ?? '',
    radius:         config.radius     ?? 15,
    lifetime:       0,
    maxLifetime:    config.duration   ?? EFFECT_DEFAULTS.duration,
    isAlive:        true,
    pendingDestroy: false,
  };
}

/** resetEffect — ObjectPool 리셋 함수 */
export function resetEffect(obj, cfg) {
  obj.id          = generateId();
  obj.type        = 'effect';
  // FIX(bug): || → ?? (0 falsy 방지)
  obj.x           = cfg.x          ?? 0;
  obj.y           = cfg.y          ?? 0;
  obj.effectType  = cfg.effectType ?? 'burst';
  obj.color       = cfg.color      ?? '#ff5722';
  obj.text        = cfg.text       ?? '';
  obj.radius      = cfg.radius     ?? 15;
  obj.lifetime    = 0;
  obj.maxLifetime = cfg.duration   ?? EFFECT_DEFAULTS.duration;
  obj.isAlive        = true;
  obj.pendingDestroy = false;
}
