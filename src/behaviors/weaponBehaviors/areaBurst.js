/**
 * src/behaviors/weaponBehaviors/areaBurst.js
 *
 * BUGFIX:
 *   BUG-6: areaBurst 투사체가 플레이어를 따라가지 않는 버그 수정
 *
 *     Before (버그):
 *       발사된 areaBurst 투사체는 speed=0, 발사 시점의 x/y에 고정.
 *       holy_aura 등 오라형 무기는 플레이어가 이동하면 투사체가 뒤에 남음
 *       → 이동 중 플레이어 주변에 피해 공백 발생.
 *
 *     After (수정):
 *       weaponData의 orbitsPlayer 필드를 읽어 투사체 config에 포함.
 *       ProjectileSystem.js의 areaBurst 분기에서 매 프레임 player 위치에 동기화.
 *
 *     weaponData.js에서 오라형 무기(holy_aura, frost_nova)에
 *     orbitsPlayer: true를 추가해야 함.
 *
 * 발동 함수 시그니처:
 *   ({ weapon, player, enemies, spawnQueue, events? }) => boolean
 */

import { spawnProjectile } from '../../domain/play/state/spawnRequest.js';
import { getProjectileLifetimeMult } from './weaponBehaviorUtils.js';

/**
 * areaBurst 무기 동작 — 플레이어 중심 범위 투사체 생성
 *
 * @param {{ weapon: object, player: object, enemies: object[], spawnQueue: object[] }} ctx
 * @returns {true}
 */
export function areaBurst({ weapon, player, spawnQueue }) {
  const duration = (weapon.burstDuration ?? 0.85) * getProjectileLifetimeMult(player);

  spawnQueue.push(spawnProjectile({
    x: player.x,
    y: player.y,
    config: {
      x:          player.x,
      y:          player.y,
      dirX:       0,
      dirY:       0,
      speed:      0,
      damage:     weapon.damage,
      radius:     weapon.radius ?? weapon.range ?? 80,
      color:      weapon.projectileColor,
      pierce:     weapon.pierce ?? 999,
      maxRange:   0,
      behaviorId: 'areaBurst',
      projectileVisualId: weapon.projectileVisualId ?? null,
      impactEffectType: weapon.impactEffectType ?? null,
      impactEffectVisualId: weapon.impactEffectVisualId ?? weapon.impactEffectType ?? null,
      maxLifetime: duration,
      ownerId:    player.id,
      statusEffectId:     weapon.statusEffectId     ?? null,
      statusEffectChance: weapon.statusEffectChance ?? 0,
      // FIX(BUG-6): orbitsPlayer 플래그 전달
      // weaponData에서 orbitsPlayer: true인 무기(holy_aura 등)는
      // ProjectileSystem이 매 프레임 player 위치로 동기화함
      orbitsPlayer: weapon.orbitsPlayer ?? false,
    },
  }));

  return true;
}
