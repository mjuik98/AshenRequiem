/**
 * src/behaviors/weaponBehaviors/orbit.js
 *
 * 역할:
 *   플레이어 주위를 회전하는 투사체 생성.
 *   orbitCount 개수만큼 균등 배치.
 *
 * 계약:
 *   입력: { weapon, player, spawnQueue }
 *   출력: spawnQueue에 orbit 타입 투사체 요청 추가
 */

import { spawnProjectile } from '../../domain/play/state/spawnRequest.js';
import { buildOrbitBehaviorState } from '../../entities/projectileBehaviorState.js';
import { getProjectileLifetimeMult } from './weaponBehaviorUtils.js';

/**
 * orbit 무기 동작 실행.
 *
 * @param {{
 *   weapon:     object,
 *   player:     object,
 *   spawnQueue: object[],
 * }} ctx
 * @returns {true}
 */
export function orbit({ weapon, player, spawnQueue }) {
  const bonus = player?.bonusProjectileCount ?? 0;
  const count = (weapon.orbitCount ?? 3) + Math.floor(bonus);
  const radius = weapon.orbitRadius ?? 72;
  const speed  = weapon.orbitSpeed  ?? 2.8;
  const lifetimeMult = getProjectileLifetimeMult(player);
  // 쿨다운보다 살짝 길게 살아있어서 빈 프레임 없이 연속 회전
  const lifetime   = weapon.cooldown * 1.02 * lifetimeMult;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    spawnQueue.push(spawnProjectile({
      x: player.x + Math.cos(angle) * radius,
      y: player.y + Math.sin(angle) * radius,
      config: {
        x: player.x + Math.cos(angle) * radius,
        y: player.y + Math.sin(angle) * radius,
        dirX: 0,
        dirY: 0,
        speed:       0,
        damage:      weapon.damage,
        radius:      weapon.radius ?? 9,
        color:       weapon.projectileColor,
        pierce:      weapon.pierce ?? 999,
        maxRange:    0,
        behaviorId:  'orbit',
        projectileVisualId: weapon.projectileVisualId ?? null,
        impactEffectType: weapon.impactEffectType ?? null,
        impactEffectVisualId: weapon.impactEffectVisualId ?? weapon.impactEffectType ?? null,
        maxLifetime: lifetime,
        ownerId:     player.id,
        statusEffectId:     weapon.statusEffectId     ?? null,
        statusEffectChance: weapon.statusEffectChance ?? 1.0,
        orbitAngle:  angle,
        orbitRadius: radius,
        orbitSpeed:  speed,
        behaviorState: buildOrbitBehaviorState(angle),
      },
    }));
  }

  return true;
}
