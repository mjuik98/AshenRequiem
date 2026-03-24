/**
 * src/systems/progression/ExperienceSystem.js — 픽업 자기력 흡수 + XP 적용
 *
 * FIX(1): 상자 chestCollected 중복 발행 수정
 *   Before: pickupCollected 루프 + 자석 루프 두 경로 모두에서 chestCollected를 push
 *           → 같은 프레임 내 두 번 발행 가능 → 보상 UI가 2배로 열림
 *   After:  chestCollected는 pickupCollected 루프에서만 발행.
 *           자석 루프는 직접 수집 시 pickupCollected에만 push하고
 *           XP/chest 처리는 pickupCollected 루프에 위임.
 *
 * FIX(2): 상자는 자석에 반응하지 않음 — 플레이어가 직접 밟아야 수집
 *   Before: 모든 픽업이 magnetRadius 이내면 magnetized = true
 *   After:  pickupType === 'chest'는 magnetize 및 자석 이동 대상에서 제외.
 *           CollisionSystem의 반경 체크는 그대로이므로 직접 밟으면 수집됨.
 */
import { distanceSq }       from '../../math/Vector2.js';
import { PICKUP_BEHAVIOR }  from '../../data/constants.js';

export const ExperienceSystem = {
  update({ world: { events, player, pickups, deltaTime } }) {
    if (!player?.isAlive) return;

    _mergeNearbyXpPickups(pickups);

    const magnetRadSq = player.magnetRadius * player.magnetRadius;
    const xpMult      = player.xpMult ?? 1.0;

    // ── 1단계: pickupCollected 처리 (XP / 상자 이벤트 발행) ─────────────
    // 이 루프에서만 chestCollected를 발행한다 — 중복 방지.
    const collected = events.pickupCollected;
    let processedCount = _processCollectedPickups({ collected, startIndex: 0, events, player, pickups, xpMult });

    // ── 2단계: 자석 이동 (상자는 제외) ───────────────────────────────────
    for (let i = 0; i < pickups.length; i++) {
      const pk = pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;

      // FIX(2): 상자는 자석 대상에서 완전 제외
      if (pk.pickupType === 'chest') continue;

      if (!pk.magnetized && distanceSq(player, pk) <= magnetRadSq) {
        pk.magnetized = true;
      }

      if (pk.magnetized) {
        const distSqBeforeMove = distanceSq(player, pk);
        const dx      = player.x - pk.x;
        const dy      = player.y - pk.y;
        const len     = Math.sqrt(distSqBeforeMove) || 1;
        const stepDistance = _getPickupMoveSpeed(pk, len) * deltaTime;
        pk.x += (dx / len) * stepDistance;
        pk.y += (dy / len) * stepDistance;

        const playerRadius = player.radius ?? 16;
        const pickupRadius = pk.radius ?? 8;
        const catchRadSq = (playerRadius + pickupRadius) * (playerRadius + pickupRadius);
        if (distanceSq(player, pk) < catchRadSq) {
          // FIX(1): pickupCollected에만 push → 위 루프에서 XP/chest 처리
          events.pickupCollected.push({ pickup: pk, playerId: player.id });
        }
      }
    }

    _processCollectedPickups({ collected, startIndex: processedCount, events, player, pickups, xpMult });
  },
};

function _processCollectedPickups({ collected, startIndex, events, player, pickups, xpMult }) {
  let index = startIndex;
  for (; index < collected.length; index++) {
    const pk = collected[index].pickup;
    if (!pk.isAlive || pk.pendingDestroy) continue;

    if (pk.pickupType === 'chest') {
      events.chestCollected?.push({
        pickupId: pk.id,
        pickup:   pk,
        playerId: player.id,
      });
    } else if (pk.pickupType === 'gold') {
      events.currencyEarned?.push({ amount: pk.currencyValue ?? 0 });
    } else if (pk.pickupType === 'heal') {
      const healValue = pk.healValue ?? 0;
      player.hp = Math.min(player.maxHp ?? player.hp, player.hp + healValue);
    } else if (pk.pickupType === 'ward') {
      player.invincibleTimer = Math.max(player.invincibleTimer ?? 0, pk.duration ?? 0);
    } else if (pk.pickupType === 'vacuum') {
      _markAllXpPickupsForVacuum(pickups);
    } else {
      player.xp += Math.ceil((pk.xpValue ?? 0) * xpMult);
    }

    pk.isAlive = false;
    pk.pendingDestroy = true;
  }

  return index;
}

function _markAllXpPickupsForVacuum(pickups) {
  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    if (!pickup?.isAlive || pickup.pendingDestroy) continue;
    if (_getPickupType(pickup) !== 'xp') continue;
    pickup.magnetized = true;
    pickup.vacuumPulled = true;
  }
}

function _getPickupMoveSpeed(pickup, distanceToPlayer) {
  if (pickup?.vacuumPulled) {
    return Math.min(720, Math.max(140, distanceToPlayer * 0.7));
  }
  return PICKUP_BEHAVIOR.magnetSpeed;
}

function _mergeNearbyXpPickups(pickups = []) {
  const liveXp = pickups.filter((pickup) => pickup?.isAlive && !pickup.pendingDestroy && _getPickupType(pickup) === 'xp' && !pickup.magnetized);
  if (liveXp.length < 24) return;

  const buckets = new Map();
  const cellSize = 24;

  for (let i = 0; i < liveXp.length; i++) {
    const pickup = liveXp[i];
    const cellX = Math.floor(pickup.x / cellSize);
    const cellY = Math.floor(pickup.y / cellSize);
    const key = `${cellX}:${cellY}`;
    const bucket = buckets.get(key);

    if (!bucket) {
      buckets.set(key, pickup);
      continue;
    }

    bucket.xpValue += pickup.xpValue ?? 0;
    bucket.radius = Math.min(16, 8 + Math.sqrt(bucket.xpValue ?? 1));
    bucket.color = _getMergedXpColor(bucket.xpValue ?? 0);
    pickup.isAlive = false;
    pickup.pendingDestroy = true;
  }
}

function _getMergedXpColor(xpValue) {
  if (xpValue <= 3) return '#64b5f6';
  if (xpValue <= 10) return '#66bb6a';
  return '#ef5350';
}

function _getPickupType(pickup) {
  return pickup?.pickupType ?? 'xp';
}
