function getEntryLabelById(entries = [], id = null, fallback = '기본') {
  return entries.find((entry) => entry?.id === id)?.name ?? fallback;
}

export function buildStartLoadoutAdvancedSummary({
  ascensionChoices = [],
  selectedAscensionLevel = 0,
  archetypes = [],
  selectedArchetypeId = 'vanguard',
  stages = [],
  selectedStageId = 'ash_plains',
} = {}) {
  const ascensionLabel = `A${selectedAscensionLevel}`;
  const archetypeLabel = getEntryLabelById(archetypes, selectedArchetypeId, 'Archetype');
  const stageLabel = getEntryLabelById(stages, selectedStageId, 'Stage');
  const pressureLabel = ascensionChoices.find((choice) => choice?.level === selectedAscensionLevel)?.pressureLabel ?? '';
  return [ascensionLabel, archetypeLabel, stageLabel, pressureLabel]
    .filter((part) => typeof part === 'string' && part.length > 0)
    .join(' · ');
}

export function buildStartLoadoutSeedLabel({
  seedMode = 'none',
  seedText = '',
  now = new Date(),
} = {}) {
  if (seedMode === 'daily') {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `daily-${year}-${month}-${day}`;
  }
  if (seedMode === 'custom' && seedText) {
    return seedText;
  }
  return '';
}

export function buildStartLoadoutSeedPreviewText({
  seedMode = 'none',
  seedText = '',
  seedLabel = '',
  now = new Date(),
} = {}) {
  const resolvedSeedLabel = seedLabel || buildStartLoadoutSeedLabel({
    seedMode,
    seedText,
    now,
  });
  if (resolvedSeedLabel) {
    return `Seed ${resolvedSeedLabel}`;
  }
  if (seedMode === 'daily') {
    return '오늘의 고정 시드로 플레이합니다.';
  }
  if (seedMode === 'custom') {
    return seedText
      ? `Seed ${seedText}`
      : '커스텀 시드를 입력하면 동일한 런을 재현합니다.';
  }
  return '랜덤 시드로 새로운 런을 생성합니다.';
}
