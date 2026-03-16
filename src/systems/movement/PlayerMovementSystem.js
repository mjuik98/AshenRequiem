/** PlayerMovementSystem — 플레이어 이동 + 무적 타이머 감소 */
export const PlayerMovementSystem = {
  update({ input, player, deltaTime }) {
    if (!player?.isAlive) return;

    const dir = input.getDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      const slow = player.statusEffects?.find(e => e.type === 'slow');
      const speedMult = slow ? (1 - slow.magnitude) : 1;

      player.x += dir.x * player.moveSpeed * speedMult * deltaTime;
      player.y += dir.y * player.moveSpeed * speedMult * deltaTime;
      player.facingX = dir.x;
      player.facingY = dir.y;
    }

    if (player.invincibleTimer > 0) {
      player.invincibleTimer = Math.max(0, player.invincibleTimer - deltaTime);
    }
  },
};
