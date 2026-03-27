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

function buildRecipeText(recipe, weaponData = []) {
  const baseWeaponId = recipe?.requires?.weaponId ?? '';
  const baseWeaponName = weaponData.find((weapon) => weapon?.id === baseWeaponId)?.name ?? '기본 무기';
  return `${baseWeaponName} Lv.MAX + 장신구`;
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
    description: selectedWeapon.description ?? '',
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
  };
}
