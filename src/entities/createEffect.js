import { generateId } from '../utils/ids.js';
import { EFFECT_DEFAULTS } from '../data/constants.js';

/**
 * createEffect — 시각 이펙트 생성
 * @param {object} config
 */
export function createEffect(config) {
  return {
    id: generateId(),
    type: 'effect',
    x: config.x || 0,
    y: config.y || 0,
    effectType: config.effectType || 'burst', // 'burst' | 'damageText'
    color: config.color || '#ff5722',
    text: config.text || '',
    radius: config.radius || 15,
    lifetime: 0,
    maxLifetime: config.duration || EFFECT_DEFAULTS.duration,
    isAlive: true,
    pendingDestroy: false,
  };
}
