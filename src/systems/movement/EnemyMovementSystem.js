import { normalize, sub } from '../../math/Vector2.js';

/**
 * EnemyMovementSystem — 적 추적 이동
 *
 * 입력: player, enemies, deltaTime
 * 읽기: 플레이어 위치, 적 위치, 적 속도
 * 쓰기: 적 위치
 */
export const EnemyMovementSystem = {
  update({ player, enemies, deltaTime }) {
    if (!player || !player.isAlive) return;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isAlive || enemy.pendingDestroy) continue;
      
      // 스턴 중이면 이동 스킵
      if (enemy.stunned) continue;

      const dir = normalize(sub(
        { x: player.x, y: player.y },
        { x: enemy.x, y: enemy.y }
      ));

      enemy.x += dir.x * enemy.moveSpeed * deltaTime;
      enemy.y += dir.y * enemy.moveSpeed * deltaTime;

      // 피격 플래시 감소
      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= deltaTime;
        if (enemy.hitFlashTimer < 0) enemy.hitFlashTimer = 0;
      }
    }
  },
};
