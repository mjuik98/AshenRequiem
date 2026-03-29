export function bindStartLoadoutInteractions(root, {
  canStart = false,
  getSelectedWeaponId = () => null,
  getSelectedAscensionLevel = () => 0,
  getSelectedStartAccessoryId = () => null,
  getSelectedArchetypeId = () => 'vanguard',
  getSelectedRiskRelicId = () => null,
  getSelectedStageId = () => 'ash_plains',
  getSelectedSeedMode = () => 'none',
  getSelectedSeedText = () => '',
  onToggleAdvanced,
  onSelectWeapon,
  onSelectAscension,
  onSelectAccessory,
  onSelectArchetype,
  onSelectRiskRelic,
  onSelectStage,
  onSelectSeedMode,
  onChangeSeedText,
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

  root?.querySelector('[data-action="toggle-advanced"]')?.addEventListener('click', () => {
    onToggleAdvanced?.();
  });

  root?.querySelectorAll('[data-ascension-level]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectAscension?.(Number.parseInt(button.dataset.ascensionLevel ?? '0', 10));
    });
  });

  root?.querySelectorAll('[data-accessory-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const accessoryId = button.dataset.accessoryId;
      onSelectAccessory?.(accessoryId === 'none' ? null : accessoryId ?? null);
    });
  });

  root?.querySelectorAll('[data-archetype-id]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectArchetype?.(button.dataset.archetypeId ?? 'vanguard');
    });
  });

  root?.querySelectorAll('[data-risk-relic-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const riskRelicId = button.dataset.riskRelicId;
      onSelectRiskRelic?.(riskRelicId === 'none' ? null : riskRelicId ?? null);
    });
  });

  root?.querySelectorAll('[data-stage-id]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectStage?.(button.dataset.stageId ?? 'ash_plains');
    });
  });

  root?.querySelectorAll('[data-seed-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      onSelectSeedMode?.(button.dataset.seedMode ?? 'none');
    });
  });

  root?.querySelector('[data-seed-text]')?.addEventListener('input', (event) => {
    onChangeSeedText?.(event?.target?.value ?? '');
  });

  root?.querySelector('[data-action="start"]')?.addEventListener('click', () => {
    const selectedWeaponId = getSelectedWeaponId();
    const selectedAscensionLevel = getSelectedAscensionLevel();
    if (!canStart || !selectedWeaponId) return;
    onStart?.(selectedWeaponId, {
      ascensionLevel: selectedAscensionLevel,
      startAccessoryId: getSelectedStartAccessoryId(),
      archetypeId: getSelectedArchetypeId(),
      riskRelicId: getSelectedRiskRelicId(),
      stageId: getSelectedStageId(),
      seedMode: getSelectedSeedMode(),
      seedText: getSelectedSeedText(),
    });
  });
}
