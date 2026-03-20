import { PLAYER_DEFAULTS }     from '../data/constants.js';
import { getWeaponDataById }  from '../data/weaponData.js';
import { generateId }         from '../utils/ids.js';
import { createSynergyState } from '../state/createSynergyState.js';

/** createPlayer — 플레이어 엔티티 생성 */
export function createPlayer(x = 0, y = 0) {
  const startWeapon = getWeaponDataById('magic_bolt');
  return {
    id:            generateId(),
    type:          'player',
    x, y,
    hp:            PLAYER_DEFAULTS.hp,
    maxHp:         PLAYER_DEFAULTS.maxHp,
    moveSpeed:     PLAYER_DEFAULTS.moveSpeed,
    radius:        PLAYER_DEFAULTS.radius,
    magnetRadius:  PLAYER_DEFAULTS.magnetRadius,
    color:         PLAYER_DEFAULTS.color,
    facingX:       1, facingY: 0,
    xp:            0,
    level:         1,
    weapons:       startWeapon ? [{ ...startWeapon, currentCooldown: 0, level: 1 }] : [],
    invincibleTimer:    0,
    invincibleDuration: 0.5,
    lifesteal:     0,
    upgradeCounts: {},
    synergyState:  createSynergyState(),
    statusEffects: [],
    stunned:       false,
    isAlive:       true,
    pendingDestroy: false,
  };
}
