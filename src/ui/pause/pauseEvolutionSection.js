import {
  buildRequirementReference,
  escapeHtml,
  getReferenceGlyphForRequirement,
  toArray,
} from './pauseLoadoutModel.js';

function renderMetaIcon(icon, toneClass = 'tone-neutral') {
  const glyph = escapeHtml(icon || '•');
  return `<span class="pv-loadout-meta-icon ${toneClass}" aria-hidden="true">${glyph}</span>`;
}

function renderRequirementChip(reference, player) {
  if (!reference) return '';
  const toneClass = reference.kind === 'weapon' ? 'tone-weapon' : 'tone-accessory';
  const icon = reference?.item?.icon ?? getReferenceGlyphForRequirement(reference?.kind);
  const name = reference?.item?.name ?? reference?.id ?? '요구 조건';
  const equipped = reference.kind === 'weapon'
    ? player?.weapons?.some((weapon) => weapon.id === reference.id)
    : player?.accessories?.some((accessory) => accessory.id === reference.id);
  return `
    <span class="pv-loadout-req-chip ${toneClass}${equipped ? ' equipped' : ''}" data-req-id="${escapeHtml(reference?.id ?? '')}">
      <span class="pv-loadout-req-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="pv-loadout-req-name">${escapeHtml(name)}</span>
    </span>
  `;
}

export function renderPauseEvolutionSection(selectedItem, player, data, indexes) {
  const recipes = toArray(data?.weaponEvolutionData);

  if (selectedItem?.kind === 'weapon') {
    const recipe = recipes.find((candidate) => candidate?.requires?.weaponId === selectedItem.id);
    if (!recipe) {
      return `
        <section class="pv-loadout-evolution variant-evolution">
          <h4 class="pv-loadout-section-title">진화</h4>
          <div class="pv-loadout-empty-msg">이 장비는 현재 확인 가능한 진화 정보가 없습니다.</div>
        </section>
      `;
    }

    const accessoryById = indexes?.accessoryById ?? new Map();
    const accessoryNames = toArray(recipe?.requires?.accessoryIds)
      .map((accessoryId) => accessoryById.get(accessoryId)?.name ?? accessoryId)
      .filter(Boolean)
      .join(', ');
    const resultWeapon = buildRequirementReference(recipe?.resultWeaponId, indexes);
    const resultWeaponName = resultWeapon?.item?.name ?? recipe?.resultWeaponId ?? '결과 무기';
    const requirementRefs = toArray(recipe?.requires?.accessoryIds)
      .map((accessoryId) => buildRequirementReference(accessoryId, indexes))
      .filter(Boolean);
    const isDone = player?.evolvedWeapons?.has(recipe?.id);

    return `
      <section class="pv-loadout-evolution variant-evolution">
        <h4 class="pv-loadout-section-title">진화</h4>
        <div class="pv-loadout-evolution-row${isDone ? ' done' : ''}">
          <div class="pv-loadout-evolution-head">
            <div class="pv-loadout-meta-title">
              ${renderMetaIcon('✶', 'tone-evolution')}
              <span class="pv-loadout-evolution-name">${escapeHtml(isDone ? '진화 완료' : '진화 조건')}</span>
            </div>
            <span class="pv-loadout-evolution-result">
              ${renderMetaIcon(resultWeapon?.item?.icon ?? getReferenceGlyphForRequirement('weapon'), 'tone-evolution')}
              <span class="pv-loadout-evolution-state">${escapeHtml(resultWeaponName)}</span>
            </span>
          </div>
          <div class="pv-loadout-evolution-desc">${escapeHtml(accessoryNames || '추가 장신구 필요')}</div>
          ${requirementRefs.length > 0 ? `<div class="pv-loadout-req-chips">${requirementRefs.map((reference) => renderRequirementChip(reference, player)).join('')}</div>` : ''}
        </div>
      </section>
    `;
  }

  if (selectedItem?.kind === 'accessory') {
    const matchedRecipes = recipes.filter((candidate) => toArray(candidate?.requires?.accessoryIds).includes(selectedItem.id));
    if (matchedRecipes.length === 0) {
      return `
        <section class="pv-loadout-evolution variant-evolution">
          <h4 class="pv-loadout-section-title">진화</h4>
          <div class="pv-loadout-empty-msg">이 장비는 현재 확인 가능한 진화 정보가 없습니다.</div>
        </section>
      `;
    }

    const recipeHtml = matchedRecipes.map((recipe) => {
      const weaponReference = buildRequirementReference(recipe?.requires?.weaponId, indexes);
      const resultWeapon = buildRequirementReference(recipe?.resultWeaponId, indexes);
      const weaponName = weaponReference?.item?.name ?? recipe?.requires?.weaponId ?? '무기';
      const resultWeaponName = resultWeapon?.item?.name ?? recipe?.resultWeaponId ?? '결과 무기';
      const isDone = player?.evolvedWeapons?.has(recipe?.id);
      return `
        <div class="pv-loadout-evolution-row${isDone ? ' done' : ''}">
          <div class="pv-loadout-evolution-head">
            <div class="pv-loadout-meta-title">
              ${renderMetaIcon('✶', 'tone-evolution')}
              <span class="pv-loadout-evolution-name">${escapeHtml(isDone ? '진화 완료' : '진화 조건')}</span>
            </div>
            <span class="pv-loadout-evolution-result">
              ${renderMetaIcon(resultWeapon?.item?.icon ?? getReferenceGlyphForRequirement('weapon'), 'tone-evolution')}
              <span class="pv-loadout-evolution-state">${escapeHtml(resultWeaponName)}</span>
            </span>
          </div>
          <div class="pv-loadout-evolution-desc">${escapeHtml(weaponName)}</div>
          ${weaponReference ? `<div class="pv-loadout-req-chips">${renderRequirementChip(weaponReference, player)}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="pv-loadout-evolution variant-evolution">
        <h4 class="pv-loadout-section-title">진화</h4>
        <div class="pv-loadout-evolution-list">${recipeHtml}</div>
      </section>
    `;
  }

  return `
    <section class="pv-loadout-evolution variant-evolution">
      <h4 class="pv-loadout-section-title">진화</h4>
      <div class="pv-loadout-empty-msg">이 장비는 현재 확인 가능한 진화 정보가 없습니다.</div>
    </section>
  `;
}
