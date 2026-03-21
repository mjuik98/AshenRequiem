import { buildAccessoryLevelDesc } from '../../data/accessoryData.js';

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
  const relatedSynergies = indexes?.synergiesByWeaponId?.get(weaponId) ?? [];
  const activeSynergyIds = new Set(player.activeSynergies ?? []);
  const bonusProjs = player.bonusProjectileCount ?? 0;
  const totalProj = (weapon.projectileCount ?? 1) + Math.floor(bonusProjs);

  const stats = [
    ['데미지', weapon.damage],
    ['쿨다운', formatSeconds(weapon.cooldown, 2)],
    ['관통', weapon.pierce != null && !['orbit', 'areaBurst'].includes(weapon.behaviorId) ? weapon.pierce : null],
    ['투사체', totalProj > 1 ? totalProj : null],
    ['사거리', weapon.range != null ? `${Math.round(weapon.range)}px` : null],
    ['오라 반경', weapon.orbitRadius != null ? `${Math.round(weapon.orbitRadius)}px` : null],
  ].filter(([, value]) => value != null && value !== '');

  const statsHtml = stats.map(([key, value]) =>
    `<div class="pvt-row"><span class="pvt-key">${escapeHtml(key)}</span><span class="pvt-val">${escapeHtml(String(value))}</span></div>`
  ).join('');

  const statusHtml = weapon.statusEffectId
    ? (() => {
        const label = { slow: '슬로우', poison: '독', stun: '스턴' }[weapon.statusEffectId] ?? weapon.statusEffectId;
        const pct = Math.round((weapon.statusEffectChance ?? 1) * 100);
        return `<div class="pvt-row"><span class="pvt-key">상태이상</span><span class="pvt-val pvt-status">${escapeHtml(label)} ${pct}%</span></div>`;
      })()
    : '';

  const synergyHtml = relatedSynergies.map((synergy) => {
    const active = activeSynergyIds.has(synergy.id);
    return `<div class="pvt-synergy${active ? ' pvt-synergy-active' : ''}">
      <span class="pvt-syn-icon">${active ? '✦' : '◇'}</span>
      <div><div class="pvt-syn-name">${escapeHtml(synergy.name ?? synergy.id)}</div><div class="pvt-syn-desc">${escapeHtml(synergy.description ?? '')}</div></div>
    </div>`;
  }).join('');

  const evoRecipe = evoData.find((recipe) => recipe.requires?.weaponId === weaponId);
  const evolutionHtml = evoRecipe
    ? (() => {
        const done = player.evolvedWeapons?.has(evoRecipe.id);
        const names = (evoRecipe.requires?.accessoryIds ?? []).map((id) => accessoryById.get(id)?.name ?? id).join(', ');
        return `<div class="pvt-divider"></div>
          <div class="pvt-evo${done ? ' pvt-evo-done' : ''}">
            <span class="pvt-evo-icon">${done ? '✓' : '✨'}</span>
            <div>
              <div class="pvt-evo-name">${done ? '진화 완료' : '진화 조건'}</div>
              <div class="pvt-evo-desc">Lv.MAX${names ? ` + ${escapeHtml(names)}` : ''} 보유 시 진화</div>
            </div>
          </div>`;
      })()
    : '';

  const synergySection = relatedSynergies.length > 0
    ? `<div class="pvt-divider"></div>${synergyHtml}`
    : '';

  const synergyBonus = relatedSynergies
    .map((synergy) => formatWeaponSynergyBonus(synergy.bonus))
    .filter(Boolean);

  const synergyBonusHtml = synergyBonus.length > 0
    ? `<div class="pvt-sr-only">${escapeHtml(synergyBonus.join(', '))}</div>`
    : '';

  return `
    <div class="pvt-header">${escapeHtml(weapon.name ?? weapon.id ?? '무기')} <span class="pvt-lv">Lv.${weapon.level ?? 1}</span></div>
    ${statsHtml}${statusHtml}
    ${synergySection}
    ${evolutionHtml}
    ${synergyBonusHtml}
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
  const definition = indexes?.accessoryById?.get(accessoryId);
  const levelLines = definition ? buildAccessoryLevelDesc(definition) : [];
  const effectsHtml = levelLines
    .map((line) => `<div class="pvt-level-row">${escapeHtml(line)}</div>`)
    .join('');

  const evoRecipes = evoData.filter((recipe) => recipe.requires?.accessoryIds?.includes(accessoryId));
  const evoHtml = evoRecipes.map((recipe) => {
    const done = player.evolvedWeapons?.has(recipe.id);
    const weaponName = weaponById.get(recipe.requires?.weaponId)?.name ?? recipe.requires?.weaponId ?? '무기';
    return `<div class="pvt-evo${done ? ' pvt-evo-done' : ''}">
      <span class="pvt-evo-icon">${done ? '✓' : '✨'}</span>
      <div>
        <div class="pvt-evo-name">${done ? '진화 완료' : '진화 조건'}</div>
        <div class="pvt-evo-desc">${escapeHtml(weaponName)} Lv.MAX 달성 시 진화 가능</div>
      </div>
    </div>`;
  }).join('');

  const rarityLabel = accessory.rarity === 'rare' ? '희귀' : '일반';

  return `
    <div class="pvt-header">${escapeHtml(accessory.name ?? accessory.id ?? '장신구')} <span class="pvt-rarity pvt-rarity-${escapeHtml(accessory.rarity ?? 'common')}">${rarityLabel}</span></div>
    ${effectsHtml}
    ${evoRecipes.length > 0 ? `<div class="pvt-divider"></div>${evoHtml}` : ''}
  `;
}
