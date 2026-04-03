function resolveValue(valueOrFactory) {
  return typeof valueOrFactory === 'function' ? valueOrFactory() : valueOrFactory;
}

function findTarget(root, target, datasetKey) {
  if (!root?.contains?.(target)) return null;
  if (typeof target?.closest === 'function') {
    const matched = target.closest(`[data-${datasetKey.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}]`);
    if (matched && root.contains(matched)) return matched;
  }
  return Object.hasOwn(target?.dataset ?? {}, datasetKey) ? target : null;
}

function findActionTarget(root, target, action) {
  const matched = findTarget(root, target, 'action');
  return matched?.dataset?.action === action ? matched : null;
}

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
  if (!root?.addEventListener) return () => {};

  const onClick = (event) => {
    const target = event?.target ?? null;

    if (findActionTarget(root, target, 'cancel')) {
      onCancel?.();
      return;
    }

    if (findActionTarget(root, target, 'toggle-advanced')) {
      onToggleAdvanced?.();
      return;
    }

    if (findActionTarget(root, target, 'start')) {
      const selectedWeaponId = getSelectedWeaponId();
      const selectedAscensionLevel = getSelectedAscensionLevel();
      if (!resolveValue(canStart) || !selectedWeaponId) return;
      onStart?.(selectedWeaponId, {
        ascensionLevel: selectedAscensionLevel,
        startAccessoryId: getSelectedStartAccessoryId(),
        archetypeId: getSelectedArchetypeId(),
        riskRelicId: getSelectedRiskRelicId(),
        stageId: getSelectedStageId(),
        seedMode: getSelectedSeedMode(),
        seedText: getSelectedSeedText(),
      });
      return;
    }

    const weaponTarget = findTarget(root, target, 'weaponId');
    if (weaponTarget) {
      onSelectWeapon?.(weaponTarget.dataset.weaponId ?? null);
      return;
    }

    const ascensionTarget = findTarget(root, target, 'ascensionLevel');
    if (ascensionTarget) {
      onSelectAscension?.(Number.parseInt(ascensionTarget.dataset.ascensionLevel ?? '0', 10));
      return;
    }

    const accessoryTarget = findTarget(root, target, 'accessoryId');
    if (accessoryTarget) {
      const accessoryId = accessoryTarget.dataset.accessoryId;
      onSelectAccessory?.(accessoryId === 'none' ? null : accessoryId ?? null);
      return;
    }

    const archetypeTarget = findTarget(root, target, 'archetypeId');
    if (archetypeTarget) {
      onSelectArchetype?.(archetypeTarget.dataset.archetypeId ?? 'vanguard');
      return;
    }

    const riskRelicTarget = findTarget(root, target, 'riskRelicId');
    if (riskRelicTarget) {
      const riskRelicId = riskRelicTarget.dataset.riskRelicId;
      onSelectRiskRelic?.(riskRelicId === 'none' ? null : riskRelicId ?? null);
      return;
    }

    const stageTarget = findTarget(root, target, 'stageId');
    if (stageTarget) {
      onSelectStage?.(stageTarget.dataset.stageId ?? 'ash_plains');
      return;
    }

    const seedModeTarget = findTarget(root, target, 'seedMode');
    if (seedModeTarget) {
      onSelectSeedMode?.(seedModeTarget.dataset.seedMode ?? 'none');
    }
  };

  const onInput = (event) => {
    const target = findTarget(root, event?.target ?? null, 'seedText');
    if (!target) return;
    onChangeSeedText?.(target.value ?? '');
  };

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
  };
}
