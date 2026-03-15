import { normalize, sub } from '../../math/Vector2.js';

/**
 * EliteBehaviorSystem — 엘리트/보스 전용 이동 패턴
 *
 * 계약:
 *   입력: enemies, player, deltaTime, spawnQueue
 *   읽기: enemy.behaviorId, enemy.behaviorState
 *   쓰기: enemy.x/y, enemy.behaviorState
 *   출력: spawnQueue (보스 투사체)
 *
 * 처리 대상: behaviorId === 'dash' | 'circle_dash'
 * EnemyMovementSystem의 hitFlashTimer/knockback 처리와 중복 없음
 */
export const EliteBehaviorSystem = {
  update({ enemies, player, deltaTime, spawnQueue }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.stunned) continue;
      // knockback 중에는 EliteBehavior도 스킵
      if (e.knockbackTimer > 0) continue;

      if (e.behaviorId === 'dash') {
        this._updateDash(e, player, deltaTime);
      } else if (e.behaviorId === 'circle_dash') {
        this._updateCircleDash(e, player, deltaTime, spawnQueue);
      }
    }
  },

  // ── dash: 추적 → 충전(멈춤) → 돌진 ─────────────────────────

  _updateDash(e, player, deltaTime) {
    const s = e.behaviorState;

    if (s.phase === 'idle') {
      // 추적 이동
      const dir = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
      e.x += dir.x * e.moveSpeed * deltaTime;
      e.y += dir.y * e.moveSpeed * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const toPlayer = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
        s.dashDirX = toPlayer.x;
        s.dashDirY = toPlayer.y;
        s.phase = 'windup';
        s.timer = 0.7;
      }

    } else if (s.phase === 'windup') {
      // 멈춤 + 예고 연출 (hitFlashTimer로 하얀 깜빡임)
      e.hitFlashTimer = 0.08;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        s.phase = 'dashing';
        s.timer = 0.32;
      }

    } else if (s.phase === 'dashing') {
      const DASH_SPEED = 520;
      e.x += s.dashDirX * DASH_SPEED * deltaTime;
      e.y += s.dashDirY * DASH_SPEED * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        s.phase = 'idle';
        s.timer = 2.2;
      }
    }
  },

  // ── circle_dash: 원형 이동 → 충전 → 돌진 + 4방향 투사체 ─────

  _updateCircleDash(e, player, deltaTime, spawnQueue) {
    const s = e.behaviorState;

    if (s.phase === 'circling') {
      // 플레이어 주위를 원형으로 이동
      s.orbitAngle += s.orbitSpeed * deltaTime;
      const tx = player.x + Math.cos(s.orbitAngle) * s.orbitRadius;
      const ty = player.y + Math.sin(s.orbitAngle) * s.orbitRadius;
      const dir = normalize(sub({ x: tx, y: ty }, { x: e.x, y: e.y }));
      e.x += dir.x * e.moveSpeed * deltaTime;
      e.y += dir.y * e.moveSpeed * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        const toPlayer = normalize(sub({ x: player.x, y: player.y }, { x: e.x, y: e.y }));
        s.dashDirX = toPlayer.x;
        s.dashDirY = toPlayer.y;
        s.phase = 'windup';
        s.timer = 0.55;
      }

    } else if (s.phase === 'windup') {
      e.hitFlashTimer = 0.08;
      s.timer -= deltaTime;
      if (s.timer <= 0) {
        // 돌진 시작 + 보스 투사체 4방향 발사
        if (spawnQueue && e.isBoss) {
          for (let d = 0; d < 4; d++) {
            const angle = s.orbitAngle + d * (Math.PI / 2);
            spawnQueue.push({
              type: 'projectile',
              config: {
                x: e.x, y: e.y,
                dirX: Math.cos(angle), dirY: Math.sin(angle),
                speed: 220,
                damage: e.damage,
                radius: 7,
                color: '#e040fb',
                pierce: 1,
                maxRange: 500,
                behaviorId: 'targetProjectile',
                ownerId: e.id,
                statusEffectId: null,
                statusEffectChance: 0,
              },
            });
          }
        }
        s.phase = 'dashing';
        s.timer = 0.42;
      }

    } else if (s.phase === 'dashing') {
      const DASH_SPEED = 600;
      e.x += s.dashDirX * DASH_SPEED * deltaTime;
      e.y += s.dashDirY * DASH_SPEED * deltaTime;

      s.timer -= deltaTime;
      if (s.timer <= 0) {
        s.phase = 'circling';
        s.timer = 2.8;
        // 원형 이동 시작 각도를 현재 위치 기준으로 리셋
        s.orbitAngle = Math.atan2(e.y - player.y, e.x - player.x);
      }
    }
  },
};
