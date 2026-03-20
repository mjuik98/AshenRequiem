/**
 * src/entities/createPlayer.js
 *
 * CHANGE (Phase 2): accessories[], globalDamageMult 필드 추가
 * CHANGE (Phase 3): session 파라미터 추가 → 영구 업그레이드 반영
 */
import { PLAYER_DEFAULTS }         from '../data/constants.js';
import { getWeaponDataById }       from '../data/weaponData.js';
import { generateId }              from '../utils/ids.js';
import { createSynergyState }      from '../state/createSynergyState.js';
import { applyPermanentUpgrades }  from '../data/permanentUpgradeData.js';

/**
 * 플레이어 엔티티 생성.
 *
 * @param {number}      [x=0]
 * @param {number}      [y=0]
 * @param {object|null} [session=null]  game.session — 영구 업그레이드 적용에 사용
 */
export function createPlayer(x = 0, y = 0, session = null) {
  const startWeapon = getWeaponDataById('magic_bolt');

  const player = {
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
    // ── Phase 2: 장신구 슬롯 (최대 2개) ──────────────────────────────
    accessories:      [],
    globalDamageMult: 1,   // 장신구/영구 업그레이드로 누산되는 데미지 배율
    isAlive:       true,
    pendingDestroy: false,
  };

  // ── Phase 3: 영구 업그레이드 반영 ──────────────────────────────────
  if (session?.meta?.permanentUpgrades) {
    applyPermanentUpgrades(player, session.meta.permanentUpgrades);

    // globalDamageMult가 변경됐으면 시작 무기에도 반영
    if (player.globalDamageMult !== 1) {
      player.weapons.forEach(w => {
        w.damage = Math.max(1, Math.round(w.damage * player.globalDamageMult));
      });
    }

    // maxHp 증가분을 hp에도 반영 (applyPermanentUpgrades에서 maxHp와 hp 함께 올림)
    player.hp = player.maxHp;
  }

  return player;
}
