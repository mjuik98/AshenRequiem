export const PlayerMovementSystem = {
  update({ input, player, deltaTime }) {
    if (!player || !player.isAlive) return;
    const dir = input.getDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      player.x += dir.x * player.moveSpeed * deltaTime;
      player.y += dir.y * player.moveSpeed * deltaTime;
      player.facingX = dir.x; player.facingY = dir.y;
    }
    if (player.invincibleTimer > 0) {
      player.invincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);
    }
  },
};
