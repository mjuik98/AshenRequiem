/**
 * src/entities/validateEntity.js — 엔티티 계약 검증 유틸리티 (개발 모드)
 *
 * CHANGE(P2-D): 엔티티 계약 강화
 *   배경:
 *     charge.js, circle.js, swarm.js, keepDistance.js 등 여러 파일에서
 *     `enemy.speed → enemy.moveSpeed` 수정 이력이 반복됨.
 *     필드 명세가 느슨하여 타입 드리프트가 발생하기 쉬운 구조.
 *
 *   이 파일의 함수들은 엔티티 계약을 런타임에 검증하여
 *   잘못된 필드명, 누락된 필드, deprecated 필드를 조기에 감지한다.
 *
 * 사용법:
 *   createEnemy() / createPlayer() 등에서 개발 모드에만 호출:
 *     if (IS_DEV) assertEnemyContract(enemy);
 *
 *   또는 테스트에서 직접 호출하여 fixture 유효성 검사에 활용.
 *
 * 프로덕션 빌드에서는 호출하지 않아야 한다 (Vite tree-shaking 대상).
 */

import {
  logRuntimeError,
  logRuntimeWarn,
} from '../utils/runtimeLogger.js';

/** Vite DEV 환경 여부 (빌드 시 false로 tree-shake됨) */
const IS_DEV = typeof import.meta !== 'undefined'
  ? (import.meta.env?.DEV ?? false)
  : false;

// ── 필수 필드 계약 ────────────────────────────────────────────────────────────

const ENEMY_REQUIRED_FIELDS = [
  'id', 'type', 'x', 'y', 'hp', 'maxHp', 'moveSpeed',
  'radius', 'damage', 'xpValue', 'isAlive', 'pendingDestroy',
  'statusEffects', 'behaviorId',
];

const PLAYER_REQUIRED_FIELDS = [
  'id', 'type', 'x', 'y', 'hp', 'maxHp', 'moveSpeed',
  'radius', 'isAlive', 'pendingDestroy',
  'weapons', 'xp', 'level', 'lifesteal', 'upgradeCounts',
  'invincibleTimer', 'magnetRadius', 'statusEffects',
];

const PROJECTILE_REQUIRED_FIELDS = [
  'id', 'type', 'x', 'y', 'dirX', 'dirY', 'speed',
  'damage', 'radius', 'pierce', 'hitCount', 'hitTargets',
  'maxRange', 'distanceTraveled', 'isAlive', 'pendingDestroy', 'ownerId',
];

/** deprecated 필드 → 올바른 필드 매핑 */
const ENEMY_DEPRECATED_FIELDS = {
  speed:      'moveSpeed',  // 다수의 behavior 파일에서 수정된 이력
  maxHealth:  'maxHp',
  health:     'hp',
};

// ── 검증 함수 ─────────────────────────────────────────────────────────────────

/**
 * 적 엔티티 계약을 검증한다.
 * 필수 필드 누락 또는 deprecated 필드 사용 시 console에 경고.
 *
 * @param {object} enemy
 */
export function assertEnemyContract(enemy) {
  if (!IS_DEV) return;

  const label = `Enemy "${enemy.id ?? '?'}"`;

  for (const field of ENEMY_REQUIRED_FIELDS) {
    if (enemy[field] === undefined) {
      logRuntimeError('Contract', `${label}: 필수 필드 "${field}" 누락`);
    }
  }

  for (const [deprecated, correct] of Object.entries(ENEMY_DEPRECATED_FIELDS)) {
    if (deprecated in enemy) {
      logRuntimeWarn('Contract', `${label}: deprecated 필드 "${deprecated}" 사용. → "${correct}" 사용 권장`);
    }
  }

  if (enemy.hp !== undefined && enemy.maxHp !== undefined && enemy.hp > enemy.maxHp) {
    logRuntimeWarn('Contract', `${label}: hp(${enemy.hp}) > maxHp(${enemy.maxHp})`);
  }
}

/**
 * 플레이어 엔티티 계약을 검증한다.
 * @param {object} player
 */
export function assertPlayerContract(player) {
  if (!IS_DEV) return;

  const label = `Player "${player.id ?? '?'}"`;

  for (const field of PLAYER_REQUIRED_FIELDS) {
    if (player[field] === undefined) {
      logRuntimeError('Contract', `${label}: 필수 필드 "${field}" 누락`);
    }
  }
}

/**
 * 투사체 엔티티 계약을 검증한다.
 * @param {object} proj
 */
export function assertProjectileContract(proj) {
  if (!IS_DEV) return;

  const label = `Projectile "${proj.id ?? '?'}"`;

  for (const field of PROJECTILE_REQUIRED_FIELDS) {
    if (proj[field] === undefined) {
      logRuntimeError('Contract', `${label}: 필수 필드 "${field}" 누락`);
    }
  }

  if (proj.hitTargets !== undefined && !(proj.hitTargets instanceof Set)) {
    logRuntimeError('Contract', `${label}: hitTargets는 Set이어야 함 (실제: ${typeof proj.hitTargets})`);
  }
}

/**
 * 개발 모드에서 엔티티 계약 검증이 활성화되어 있는지 확인.
 * 테스트 환경에서 유효성 검사 호출 여부 판단에 사용.
 *
 * @returns {boolean}
 */
export function isContractValidationEnabled() {
  return IS_DEV;
}
