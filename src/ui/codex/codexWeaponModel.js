import { isCodexWeaponUnlocked } from './codexRecords.js';

export const CODEX_WEAPON_TYPE_LABEL = {
  targetProjectile: '직선 투사체',
  areaBurst: '범위 폭발',
  orbit: '궤도형',
  boomerang: '부메랑',
  chainLightning: '연쇄 번개',
  omnidirectional: '전방위',
  laserBeam: '광선',
  groundZone: '장판',
  ricochetProjectile: '도약 투사체',
};

export const CODEX_WEAPON_EMOJI = {
  targetProjectile: '🔵',
  orbit: '⚡',
  areaBurst: '✨',
  boomerang: '🪃',
  chainLightning: '⚡',
  omnidirectional: '🌀',
  laserBeam: '☄',
  groundZone: '◉',
  ricochetProjectile: '✦',
};

const WEAPON_STATUS_LABELS = {
  all: '전체',
  discovered: '발견',
  locked: '미발견',
};

function buildRecipeText(recipe, weaponData = []) {
  const baseWeaponId = recipe?.requires?.weaponId ?? '';
  const baseWeaponName = weaponData.find((weapon) => weapon?.id === baseWeaponId)?.name ?? '기본 무기';
  return `${baseWeaponName} Lv.MAX + 장신구`;
}

function buildWeaponDiscoveryHint({ weapon, unlocked, recipe, weaponData = [], accessoryData = [] }) {
  if (unlocked) {
    return weapon?.isEvolved
      ? '진화 무기는 런 중 실제로 진화시키면 도감에 유지됩니다.'
      : '기본 무기는 런 중 한 번이라도 획득하면 도감에 유지됩니다.';
  }

  if (!weapon?.isEvolved) {
    return '런 중 한 번이라도 획득하면 도감에 기록됩니다.';
  }

  const baseWeaponName = weaponData.find((entry) => entry?.id === recipe?.requires?.weaponId)?.name ?? '기본 무기';
  const accessoryNames = (recipe?.requires?.accessoryIds ?? [])
    .map((accessoryId) => accessoryData.find((entry) => entry?.id === accessoryId)?.name ?? accessoryId);
  const accessoryText = accessoryNames.length > 0 ? `와 ${accessoryNames.join(', ')}` : '';
  return `${baseWeaponName}${accessoryText}를 갖춘 뒤 런 중 진화시키면 기록됩니다.`;
}

export function partitionCodexWeapons(weaponData = []) {
  return {
    baseWeapons: weaponData.filter((weapon) => !weapon.isEvolved),
    evolvedWeapons: weaponData.filter((weapon) => weapon.isEvolved),
  };
}

export function buildCodexWeaponCardModel({
  weapon,
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  selectedWeaponId = null,
}) {
  const unlocked = isCodexWeaponUnlocked(weapon, session);
  const recipe = weaponEvolutionData.find((entry) => (
    entry.resultWeaponId === weapon.id
    || entry?.requires?.weaponId === weapon.id
  ));
  const dmgPct = Math.min(100, (weapon.damage ?? 0) * 5);
  const cdPct = Math.round((1 - (((weapon.cooldown ?? 0.5) - 0.5) / 3.5)) * 100);
  const recipeAccessories = (recipe?.requires?.accessoryIds ?? []).map((accessoryId) => {
    const accessory = accessoryData.find((entry) => entry?.id === accessoryId);
    return {
      id: accessoryId,
      name: accessory?.name ?? accessoryId,
      icon: accessory?.icon ?? '◈',
    };
  });

  return {
    id: weapon.id,
    name: weapon.name,
    unlocked,
    isSelected: selectedWeaponId === weapon.id,
    isEvolved: weapon.isEvolved === true,
    icon: CODEX_WEAPON_EMOJI[weapon.behaviorId] ?? '⚔',
    typeLabel: CODEX_WEAPON_TYPE_LABEL[weapon.behaviorId] ?? weapon.behaviorId,
    dmgPct,
    cdPct,
    recipeText: recipe ? buildRecipeText(recipe, weaponData) : '',
    recipeAccessories,
    discoveryHint: buildWeaponDiscoveryHint({
      weapon,
      unlocked,
      recipe,
      weaponData,
      accessoryData,
    }),
  };
}

export function buildCodexWeaponCollectionModel({
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  search = '',
  typeFilter = 'all',
  statusFilter = 'all',
  selectedWeaponId = null,
}) {
  const normalizedSearch = String(search ?? '').trim().toLowerCase();
  const cards = weaponData
    .map((weapon) => buildCodexWeaponCardModel({
      weapon,
      weaponData,
      session,
      weaponEvolutionData,
      accessoryData,
      selectedWeaponId,
    }))
    .filter((card) => {
      const matchesSearch = !normalizedSearch
        || card.name.toLowerCase().includes(normalizedSearch)
        || card.id.toLowerCase().includes(normalizedSearch)
        || card.typeLabel.toLowerCase().includes(normalizedSearch);
      const kind = card.isEvolved ? 'evolved' : 'base';
      const matchesType = typeFilter === 'all' || typeFilter === kind;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'discovered' && card.unlocked)
        || (statusFilter === 'locked' && !card.unlocked);
      return matchesSearch && matchesType && matchesStatus;
    });

  const resolvedSelected = cards.find((card) => card.id === selectedWeaponId)
    ?? cards.find((card) => card.unlocked)
    ?? cards[0]
    ?? null;
  const entries = cards.map((card) => ({
    ...card,
    isSelected: resolvedSelected?.id === card.id,
  }));
  const discoveredEntries = entries.filter((card) => card.unlocked);
  const lockedEntries = entries.filter((card) => !card.unlocked);

  return {
    entries,
    discoveredEntries,
    lockedEntries,
    search,
    typeFilter,
    statusFilter,
    summary: {
      visibleCount: entries.length,
      discoveredCount: discoveredEntries.length,
      lockedCount: lockedEntries.length,
      selectedId: resolvedSelected?.id ?? null,
      statusLabel: WEAPON_STATUS_LABELS[statusFilter] ?? WEAPON_STATUS_LABELS.all,
      typeLabel: typeFilter === 'evolved' ? '진화' : typeFilter === 'base' ? '기본' : '전체',
    },
  };
}

export function buildCodexWeaponDetailModel({
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  selectedWeaponId = null,
}) {
  const selectedWeapon = weaponData.find((weapon) => weapon?.id === selectedWeaponId)
    ?? weaponData[0]
    ?? null;
  if (!selectedWeapon) return null;

  const card = buildCodexWeaponCardModel({
    weapon: selectedWeapon,
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId: selectedWeapon.id,
  });

  return {
    ...card,
    name: card.unlocked ? selectedWeapon.name : '???',
    description: card.unlocked
      ? selectedWeapon.description ?? ''
      : '아직 발견하지 못한 무기입니다. 아래 힌트를 보고 다음 런에서 해금해 보세요.',
    maxLevel: selectedWeapon.maxLevel ?? 1,
    summaryChips: [
      card.unlocked ? '발견 완료' : '미발견',
      card.isEvolved ? '진화 무기' : '기본 무기',
      `Lv.${selectedWeapon.maxLevel ?? 1}`,
    ],
    detailStats: [
      { label: '공격력', value: String(selectedWeapon.damage ?? 0) },
      { label: '공격속도', value: `${card.cdPct}%` },
      { label: '분류', value: card.typeLabel },
      { label: '최대 레벨', value: `Lv.${selectedWeapon.maxLevel ?? 1}` },
    ],
    discoveryHint: card.discoveryHint,
  };
}
