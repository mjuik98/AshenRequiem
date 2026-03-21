function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatSeconds(value, digits = 1) {
  return Number.isFinite(value) ? `${value.toFixed(digits)}s` : '—';
}

export function formatWeaponSynergyBonus(bonus) {
  if (!bonus) return '';
  if (bonus.speedMult) return `속도 ×${bonus.speedMult}`;
  if (bonus.lifestealDelta) return `흡혈 +${Math.round(bonus.lifestealDelta * 100)}%`;
  if (bonus.damageDelta) return `데미지 +${bonus.damageDelta}`;
  if (bonus.pierceDelta) return `관통 +${bonus.pierceDelta}`;
  if (bonus.cooldownMult) return `CD ×${bonus.cooldownMult}`;
  if (bonus.orbitRadiusDelta) return `궤도 +${bonus.orbitRadiusDelta}px`;
  return '';
}

export function buildPauseWeaponTooltipContent({
  weaponId,
  player,
  data,
  indexes,
}) {
  const weapon = player.weapons?.find((candidate) => candidate.id === weaponId);
  if (!weapon) return '';

  const evoData = data?.weaponEvolutionData ?? [];
  const accessoryById = indexes?.accessoryById ?? new Map();
  const bonusProjs = player.bonusProjectileCount ?? 0;
  const totalProj = (weapon.projectileCount ?? 1) + Math.floor(bonusProjs);

  const evoRecipe = evoData.find((recipe) => recipe.requires?.weaponId === weaponId);
  const statBits = [
    weapon.damage != null ? `데미지 ${weapon.damage}` : null,
    weapon.cooldown != null ? `쿨다운 ${formatSeconds(weapon.cooldown, 2)}` : null,
    totalProj > 1 ? `투사체 ${totalProj}` : null,
  ].filter(Boolean);
  const statusLabel = weapon.statusEffectId
    ? (() => {
        const label = { slow: '슬로우', poison: '독', stun: '스턴' }[weapon.statusEffectId] ?? weapon.statusEffectId;
        const pct = Math.round((weapon.statusEffectChance ?? 1) * 100);
        return `${label} ${pct}%`;
      })()
    : null;
  const evoHint = evoRecipe
    ? (() => {
        const names = (evoRecipe.requires?.accessoryIds ?? []).map((id) => accessoryById.get(id)?.name ?? id).join(', ');
        return names ? `진화 연결 ${names}` : '진화 연결 있음';
      })()
    : null;
  const metaLines = [statBits.join(' · '), statusLabel, evoHint]
    .filter(Boolean)
    .map((line) => `<div class="pvt-meta">${line}</div>`)
    .join('');

  return `
    <div class="pvt-header">${escapeHtml(weapon.name ?? weapon.id ?? '무기')} <span class="pvt-lv">Lv.${weapon.level ?? 1}</span></div>
    ${metaLines}
    <div class="pvt-note">핵심 설명은 상세 패널에서 확인하세요.</div>
  `;
}

export function buildPauseAccessoryTooltipContent({
  accessoryId,
  player,
  data,
  indexes,
}) {
  const accessory = player.accessories?.find((candidate) => candidate.id === accessoryId);
  if (!accessory) return '';

  const evoData = data?.weaponEvolutionData ?? [];
  const weaponById = indexes?.weaponById ?? new Map();
  const evoRecipes = evoData.filter((recipe) => recipe.requires?.accessoryIds?.includes(accessoryId));
  const rarityLabel = accessory.rarity === 'rare' ? '희귀' : '일반';
  const evolutionSummary = evoRecipes.length > 0
    ? evoRecipes.map((recipe) => {
        const weaponName = weaponById.get(recipe.requires?.weaponId)?.name ?? recipe.requires?.weaponId ?? '무기';
        return `${weaponName} 연결`;
      }).join(' · ')
    : null;

  return `
    <div class="pvt-header">${escapeHtml(accessory.name ?? accessory.id ?? '장신구')} <span class="pvt-rarity pvt-rarity-${escapeHtml(accessory.rarity ?? 'common')}">${rarityLabel}</span></div>
    <div class="pvt-meta">Lv.${escapeHtml(String(accessory.level ?? 1))}${accessory.rarity === 'rare' ? ' · 희귀' : ''}</div>
    ${evolutionSummary ? `<div class="pvt-meta">${escapeHtml(evolutionSummary)}</div>` : ''}
    <div class="pvt-note">핵심 설명은 상세 패널에서 확인하세요.</div>
  `;
}
