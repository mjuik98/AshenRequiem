/**
 * src/systems/event/bossAnnouncementHandler.js — 보스 등장 연출 이벤트 핸들러
 *
 * bossSpawned 이벤트를 받아 BossAnnouncementView를 트리거한다.
 * PlayUI가 BossAnnouncementView를 소유하고, 서비스를 통해 참조한다.
 *
 * PipelineBuilder._registerEventHandlers()에서 등록:
 *   registerBossAnnouncementHandler(services, registry);
 */

/**
 * @param {object} services  services.bossAnnouncementView 필요
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
export function registerBossAnnouncementHandler(services, registry) {
  if (!services?.bossAnnouncementView || !registry) return;

  registry.register('bossSpawned', (event) => {
    services.bossAnnouncementView.show(event.bossName ?? 'BOSS');
  });
}
