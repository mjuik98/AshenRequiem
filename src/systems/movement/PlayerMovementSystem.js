/**
 * PlayerMovementSystem — 플레이어 이동 처리
 *
 * 입력: input (방향벡터), player, deltaTime
 * 읽기: 위치, 이동 속도, 입력 방향
 * 쓰기: 플레이어 위치, 방향
 */
export const PlayerMovementSystem = {
  update({ input, player, deltaTime }) {
    if (!player || !player.isAlive) return;

    const dir = input.getDirection();

    if (dir.x !== 0 || dir.y !== 0) {
      player.x += dir.x * player.moveSpeed * deltaTime;
      player.y += dir.y * player.moveSpeed * deltaTime;

      // 방향 업데이트
      player.facingX = dir.x;
      player.facingY = dir.y;
    }

    // 무적 타이머 갱신
    if (player.invincibleTimer > 0) {
      player.invincibleTimer -= deltaTime;
      if (player.invincibleTimer < 0) player.invincibleTimer = 0;
    }
  },
};
