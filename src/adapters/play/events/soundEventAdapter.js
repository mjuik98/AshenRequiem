export function registerSoundEventHandlers(soundSystem, registry) {
  if (!soundSystem || !registry) return;
  let lastDeathSfxAt = -Infinity;
  let lastPickupSfxAt = -Infinity;
  const deathSfxCooldown = 0.08;
  const pickupSfxCooldown = 0.05;

  registry.register('deaths', (event, world) => {
    if (event.entity?.type !== 'enemy') return;

    const now = world?.run?.elapsedTime ?? world?.elapsedTime ?? 0;
    if ((now - lastDeathSfxAt) < deathSfxCooldown && !event.entity?.isBoss) return;

    lastDeathSfxAt = now;
    soundSystem.play('death');
  });

  registry.register('hits', (event) => {
    if (event.target?.type === 'player') {
      soundSystem.play('damage');
    }
  });

  registry.register('pickupCollected', (_, world) => {
    const now = world?.run?.elapsedTime ?? world?.elapsedTime ?? 0;
    if ((now - lastPickupSfxAt) < pickupSfxCooldown) return;

    lastPickupSfxAt = now;
    soundSystem.play('pickup');
  });

  registry.register('levelUpRequested', () => {
    soundSystem.play('levelup');
  });
}
