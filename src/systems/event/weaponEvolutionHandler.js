/**
 * src/systems/event/weaponEvolutionHandler.js — 무기 진화 연출 이벤트 핸들러
 *
 * weaponEvolved 이벤트를 받아 WeaponEvolutionAnnounceView를 트리거한다.
 *
 * PipelineBuilder._registerEventHandlers()에서 등록:
 *   registerWeaponEvolutionHandler(services, registry);
 */

/**
 * @param {object} services  services.weaponEvolutionView 필요
 * @param {import('./EventRegistry.js').EventRegistry} registry
 */
export function registerWeaponEvolutionHandler(services, registry) {
  if (!services?.weaponEvolutionView || !registry) return;

  registry.register('weaponEvolved', (event) => {
    services.weaponEvolutionView.show(
      event.announceText ?? `${event.weaponName}으로 진화했다!`,
      event.weaponName   ?? 'EVOLVED WEAPON',
    );
  });
}
