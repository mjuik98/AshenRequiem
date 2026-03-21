/**
 * src/entities/createPlayer.js
 *
 * CHANGE (Phase 2): accessories[], globalDamageMult 필드 추가
 * CHANGE (Phase 3): session 파라미터 추가 → 영구 업그레이드 반영
 * CHANGE (Phase 4): 신규 능력치 필드 추가
 *   - cooldownMult        : 무기 쿨다운 배율 (1.0 = 기본, 낮을수록 쿨다운 단축)
 *   - projectileSpeedMult : 투사체 속도 배율 (1.0 = 기본, 높을수록 빠름)
 *   - projectileSizeMult  : 투사체 크기 배율 (1.0 = 기본, 높을수록 큼)
 *   - xpMult              : 경험치 획득 배율 (1.0 = 기본, 높을수록 많이 획득)
 *   - currencyMult        : 골드 획득 배율 (1.0 = 기본, 높을수록 많이 획득)
 *   - projectileLifetimeMult : 투사체 지속시간 배율 (1.0 = 기본, 높을수록 오래 유지)
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
  const unlockedWeapons = Array.isArray(session?.meta?.unlockedWeapons)
    ? [...session.meta.unlockedWeapons]
    : ['magic_bolt'];
  const unlockedAccessories = Array.isArray(session?.meta?.unlockedAccessories)
    ? [...session.meta.unlockedAccessories]
    : [];
  const selectedStartWeaponId = session?.meta?.selectedStartWeaponId;
  const startWeaponId = unlockedWeapons.includes(selectedStartWeaponId)
    ? selectedStartWeaponId
    : 'magic_bolt';
  const startWeapon = getWeaponDataById(startWeaponId) ?? getWeaponDataById('magic_bolt');

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
    unlockedWeapons,
    unlockedAccessories,
    invincibleTimer:    0,
    invincibleDuration: 0.5,
    lifesteal:     0,
    upgradeCounts: {},
    synergyState:  createSynergyState(),
    statusEffects: [],
    stunned:       false,

    // ── 슬롯 시스템 ─────────────────────────────────────────────────────────────────
    maxWeaponSlots:       3,
    maxAccessorySlots:    3,

    // ── Phase 2: 다중 투사체 ────────────────────────────────────────────────────────
    bonusProjectileCount: 0,

    // ── Phase 2: 크리티컬 히트 ─────────────────────────────────────────────────────
    critChance:      0.05,
    critMultiplier:  2.0,

    // ── Phase 2: 장신구 및 데미지 배율 ──────────────────────────────
    accessories:      [],
    globalDamageMult: 1,

    // ── Phase 2: 무기 진화 추적 ────────────────────────────────────────────────────
    evolvedWeapons:   new Set(),

    // ── Phase 4: 능력치 배율 ──────────────────────────────────────────────────────
    /** 무기 쿨다운 배율 — 1.0 기본, 값이 낮을수록 쿨다운 단축 (최솟값 0.1) */
    cooldownMult:        1.0,
    /** 투사체 속도 배율 — 1.0 기본 */
    projectileSpeedMult: 1.0,
    /** 투사체 크기(범위) 배율 — 1.0 기본 */
    projectileSizeMult:  1.0,
    /** 경험치 획득 배율 — 1.0 기본 */
    xpMult:              1.0,
    /** 골드 획득 배율 — 1.0 기본, 높을수록 처치 시 더 많은 골드 획득 */
    currencyMult:        1.0,
    /** 투사체 지속시간 배율 — 1.0 기본, 높을수록 투사체가 오래 유지됨 */
    projectileLifetimeMult: 1.0,

    isAlive:       true,
    pendingDestroy: false,

    // ── acquiredUpgrades ────────────────────────────────────────────────────────────
    acquiredUpgrades: new Set(),
    activeSynergies:  [],
  };

  // ── Phase 3: 영구 업그레이드 반영 ──────────────────────────────────
  if (session?.meta?.permanentUpgrades) {
    applyPermanentUpgrades(player, session.meta.permanentUpgrades);

    if (player.globalDamageMult !== 1) {
      player.weapons.forEach(w => {
        w.damage = Math.max(1, Math.round(w.damage * player.globalDamageMult));
      });
    }

    player.hp = player.maxHp;
  }

  return player;
}
