import { generateId } from '../utils/ids.js';
import { PLAYER_DEFAULTS } from '../data/constants.js';
import { getWeaponDataById } from '../data/weaponData.js';

/**
 * createPlayer — 플레이어 엔티티 생성
 */
export function createPlayer(x = 0, y = 0) {
  const startWeapon = getWeaponDataById('magic_bolt');

  return {
    id: generateId(),
    type: 'player',
    x,
    y,
    hp: PLAYER_DEFAULTS.hp,
    maxHp: PLAYER_DEFAULTS.maxHp,
    moveSpeed: PLAYER_DEFAULTS.moveSpeed,
    radius: PLAYER_DEFAULTS.radius,
    magnetRadius: PLAYER_DEFAULTS.magnetRadius,
    color: PLAYER_DEFAULTS.color,

    // 방향 (마지막 이동 방향)
    facingX: 1,
    facingY: 0,

    // 경험치 / 레벨
    xp: 0,
    level: 1,

    // 무기 목록 (런타임 복사본)
    weapons: startWeapon ? [{
      ...startWeapon,
      currentCooldown: 0,
      level: 1,
    }] : [],

    // 피격 무적 시간
    invincibleTimer: 0,
    invincibleDuration: 0.5,

    // 흡혈 비율 (0~0.5) — stat upgrade로 증가
    lifesteal: 0,

    // 상태이상
    statusEffects: [],
    stunned: false,

    isAlive: true,
    pendingDestroy: false,
  };
}
