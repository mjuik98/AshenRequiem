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

    // ── Phase 2: 슬롯 시스템 (Patch) ────────────────────────────────────────────────
    // magic_bolt 1개 이미 장착. slot_weapon 업그레이드로 최대 4까지 확장.
    maxWeaponSlots:       2,
    // 초기 장신구 슬롯=0. slot_accessory 업그레이드로 최대 2.
    maxAccessorySlots:    0,

    // ── Phase 2: 다중 투사체 (Patch) ────────────────────────────────────────────────
    // scattered_shot 장신구 등으로 누산.
    bonusProjectileCount: 0,

    // ── Phase 2: 크리티컬 히트 (Patch) ─────────────────────────────────────────────
    critChance:      0.05,  // 기본 5%
    critMultiplier:  2.0,   // 기본 200%

    // ── Phase 2: 장신구 및 데미지 배율 ──────────────────────────────
    accessories:      [],
    globalDamageMult: 1,

    // ── Phase 2: 무기 진화 추적 (Patch) ────────────────────────────────────────────
    evolvedWeapons:   new Set(),

    // ── Phase 4: 신규 능력치 배율 (Existing) ──────────────────────────────────────
    /** 무기 쿨다운 배율 — 1.0 기본, 값이 낮을수록 쿨다운 단축 (최솟값 0.1) */
    cooldownMult:        1.0,
    /** 투사체 속도 배율 — 1.0 기본, 값이 높을수록 빠른 투사체 */
    projectileSpeedMult: 1.0,
    /** 투사체 크기(범위) 배율 — 1.0 기본, 값이 높을수록 큰 투사체 */
    projectileSizeMult:  1.0,
    /** 경험치 획득 배율 — 1.0 기본, 값이 높을수록 많은 XP 획득 */
    xpMult:              1.0,

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

