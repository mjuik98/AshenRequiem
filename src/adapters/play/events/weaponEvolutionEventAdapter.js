export function registerWeaponEvolutionHandler(services, registry) {
  if (!services?.weaponEvolutionView || !registry) return;

  registry.register('weaponEvolved', (event) => {
    services.weaponEvolutionView.show(
      event.announceText ?? `${event.weaponName}으로 진화했다!`,
      event.weaponName ?? 'EVOLVED WEAPON',
    );
  });
}
