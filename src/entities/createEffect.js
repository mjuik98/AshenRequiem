import { generateId } from '../utils/ids.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

/**
 * createEffect — 이펙트 엔티티 생성
 *
 * PATCH:
 *   [refactor] resetEffect 함수 export — PlayScene 내 _resetEffect 대체.
 */
export function createEffect(config) {
  return {
    id: generateId(),
    type: 'effect',
    x: config.x || 0,
    y: config.y || 0,
    effectType:  config.effectType  || 'burst',
    color:       config.color       || '#ff5722',
    text:        config.text        || '',
    radius:      config.radius      || 15,
    lifetime: 0,
    maxLifetime: config.duration || EFFECT_DEFAULTS.duration,
    isAlive: true,
    pendingDestroy: false,
  };
}

/**
 * resetEffect — ObjectPool 리셋 함수 (export)
 */
export function resetEffect(obj, cfg) {
  obj.id = generateId();
  obj.type = 'effect';
  obj.x = cfg.x || 0;
  obj.y = cfg.y || 0;
  obj.effectType  = cfg.effectType  || 'burst';
  obj.color       = cfg.color       || '#ff5722';
  obj.text        = cfg.text        || '';
  obj.radius      = cfg.radius      || 15;
  obj.lifetime    = 0;
  obj.maxLifetime = cfg.duration || EFFECT_DEFAULTS.duration;
  obj.isAlive     = true;
  obj.pendingDestroy = false;
}
