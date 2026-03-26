export function registerBossAnnouncementHandler(services, registry) {
  if (!services?.bossAnnouncementView || !registry) return;

  registry.register('bossSpawned', (event) => {
    services.bossAnnouncementView.show(event.bossName ?? 'BOSS');
  });
}
