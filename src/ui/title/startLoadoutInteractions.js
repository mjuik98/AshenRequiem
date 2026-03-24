export function bindStartLoadoutInteractions(root, {
  canStart = false,
  getSelectedWeaponId = () => null,
  onSelectWeapon,
  onCancel,
  onStart,
} = {}) {
  root?.querySelectorAll('[data-weapon-id]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectWeapon?.(button.dataset.weaponId ?? null);
    });
  });

  root?.querySelectorAll('[data-action="cancel"]').forEach((button) => {
    button.addEventListener('click', () => {
      onCancel?.();
    });
  });

  root?.querySelector('[data-action="start"]')?.addEventListener('click', () => {
    const selectedWeaponId = getSelectedWeaponId();
    if (!canStart || !selectedWeaponId) return;
    onStart?.(selectedWeaponId);
  });
}
