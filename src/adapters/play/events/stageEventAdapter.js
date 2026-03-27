export function registerStageEventHandler(services, registry) {
  if (!registry) return;

  registry.register('stageEventTriggered', (event, world) => {
    const effect = services.effectPool?.acquire({
      effectType: 'damageText',
      x: world.entities.player?.x ?? 0,
      y: (world.entities.player?.y ?? 0) - 36,
      text: event.announceText || event.stageName || event.gimmickId,
      color: event.accentColor ?? '#f2cf84',
      maxLifetime: 1.9,
    });

    if (effect) {
      world.entities.effects?.push(effect);
    }
  });
}
