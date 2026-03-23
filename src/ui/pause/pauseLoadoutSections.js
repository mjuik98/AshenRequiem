import { buildAccessoryLevelDesc } from '../../data/accessoryData.js';
import {
  buildPauseLoadoutItems,
  buildRequirementReference,
  escapeHtml,
  findSelectedItem,
  formatCompactNumber,
  formatSeconds,
  getBehaviorLabel,
  getDefaultPauseSelection,
  getItemDefinition,
  getKindLabel,
  getReferenceGlyphForRequirement,
  getRelatedItems,
  getSlotIcon,
  getStatusLabel,
  hasSynergyActive,
  isEvolutionReady,
  isReferenceEquipped,
  toArray,
} from './pauseLoadoutModel.js';

function renderMetaIcon(icon, toneClass = 'tone-neutral') {
  const glyph = escapeHtml(icon || '•');
  return `<span class="pv-loadout-meta-icon ${toneClass}" aria-hidden="true">${glyph}</span>`;
}

function renderRequirementChip(reference, player) {
  if (!reference) return '';
  const toneClass = reference.kind === 'weapon'
    ? 'tone-weapon'
    : reference.kind === 'accessory'
      ? 'tone-accessory'
      : 'tone-neutral';
  const icon = reference?.item?.icon ?? getReferenceGlyphForRequirement(reference?.kind);
  const name = reference?.item?.name ?? reference?.id ?? '요구 조건';
  const equippedClass = isReferenceEquipped(reference, player) ? ' equipped' : '';
  return `
    <span class="pv-loadout-req-chip ${toneClass}${equippedClass}" data-req-id="${escapeHtml(reference?.id ?? '')}">
      <span class="pv-loadout-req-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="pv-loadout-req-name">${escapeHtml(name)}</span>
    </span>
  `;
}

function renderLevelDots(level, maxLevel) {
  if (!level || !maxLevel) return '';

  const isMax = level >= maxLevel;
  let html = '<div class="pv-slot-dots">';
  for (let index = 1; index <= maxLevel; index += 1) {
    const filled = index <= level;
    html += `<div class="pv-slot-dot${filled ? (isMax ? ' filled max' : ' filled') : ''}"></div>`;
  }
  html += '</div>';
  return html;
}

function renderSectionHeader(label, icon, count, maxCount) {
  const iconClass = label === '무기' ? 'weapon' : label === '장신구' ? 'acc' : 'locked';
  return `
    <div class="pv-slot-section-header">
      <div class="pv-slot-section-title">
        <div class="pv-slot-section-icon ${iconClass}">${icon}</div>
        ${escapeHtml(label)}
      </div>
      <span class="pv-slot-section-count">${count} / ${maxCount}</span>
    </div>
  `;
}

function renderSlotCard(item, selectedItemKey, player, data, indexes) {
  const isSelected = item?.selectionKey === selectedItemKey;
  const evolutionReady = isEvolutionReady(item, player, data);
  const synergyActive = hasSynergyActive(item, player, indexes);
  const stateClasses = [];

  if (item?.kind === 'empty') stateClasses.push('state-empty');
  if (item?.kind === 'locked') stateClasses.push('state-locked');
  if (item?.source?.rarity === 'rare') stateClasses.push('state-rare');
  if (evolutionReady) stateClasses.push('state-evolution-ready');
  if (synergyActive) stateClasses.push('state-synergy-active');

  const typePill = item?.source?.behaviorId
    ? `<span class="pv-slot-type-pill">${escapeHtml(getBehaviorLabel(item.source.behaviorId))}</span>`
    : '';
  const levelText = item?.level != null
    ? `<span class="pv-slot-lv">Lv.${item.level}</span>`
    : '';
  const dots = item?.kind !== 'empty' && item?.kind !== 'locked'
    ? renderLevelDots(item?.level, item?.maxLevel)
    : '';
  const evolutionBadge = evolutionReady ? '<div class="pv-slot-evo-chip">진화 가능</div>' : '';
  const synergyDot = !evolutionReady && synergyActive ? '<div class="pv-slot-syn-dot"></div>' : '';
  const rightHtml = dots || evolutionBadge || synergyDot
    ? `<div class="pv-slot-right">${dots}${evolutionBadge}${synergyDot}</div>`
    : '';
  const iconBoxClass = item?.kind === 'weapon'
    ? 'weapon'
    : item?.kind === 'accessory'
      ? (item?.rarity === 'rare' ? 'rare-acc' : 'acc')
      : '';

  return `
    <button
      class="pv-slot-card ${stateClasses.join(' ')}${isSelected ? ' selected' : ''}"
      type="button"
      data-loadout="${escapeHtml(item?.kind ?? 'unknown')}"
      data-loadout-id="${escapeHtml(item?.id ?? '')}"
      data-loadout-key="${escapeHtml(item?.selectionKey ?? '')}"
      aria-pressed="${isSelected}"
      ${item?.kind === 'locked' ? 'disabled' : ''}
    >
      <div class="pv-slot-icon-box${iconBoxClass ? ` ${iconBoxClass}` : ''}">
        ${getSlotIcon(item, indexes)}
      </div>
      <div class="pv-slot-body">
        <div class="pv-slot-name">${escapeHtml(item?.name ?? getKindLabel(item?.kind))}</div>
        <div class="pv-slot-sub">${typePill}${levelText}</div>
      </div>
      ${rightHtml}
    </button>
  `;
}

function renderLinkedItems(selectedItem, player, data, indexes) {
  const relatedItems = getRelatedItems(selectedItem, player, data, indexes);
  const linkedItemsHtml = relatedItems.length > 0
    ? relatedItems.map((item) => `
        <span class="pv-loadout-chip${item.equipped ? ' equipped' : ''}">
          ${escapeHtml(item.name)}
          <span class="pv-loadout-chip-meta">${escapeHtml(item.equipped ? '보유' : '미보유')}</span>
        </span>
      `).join('')
    : `<div class="pv-loadout-empty-msg">${escapeHtml(
      selectedItem?.kind === 'weapon' || selectedItem?.kind === 'accessory'
        ? '이 장비와 직접 연결된 아이템이 없습니다.'
        : '장비를 획득하면 연결 가능한 조합이 여기에 표시됩니다.',
    )}</div>`;

  const hints = relatedItems.map((item) => ({
    title: item.name,
    text: [...item.reasons].join(' · '),
  }));
  const hintsHtml = hints.length > 0
    ? hints.map((hint) => `
        <div class="pv-loadout-link-row">
          <span class="pv-loadout-link-key">${escapeHtml(hint.title)}</span>
          <span class="pv-loadout-link-val">${escapeHtml(hint.text)}</span>
        </div>
      `).join('')
    : '';

  return `
    <section class="pv-loadout-linked-items variant-links">
      <h4 class="pv-loadout-section-title">연결 아이템</h4>
      <div class="pv-loadout-chip-row">
        ${linkedItemsHtml}
      </div>
      ${hintsHtml ? `<div class="pv-loadout-link-list">${hintsHtml}</div>` : ''}
    </section>
  `;
}

function renderSynergySection(selectedItem, player, indexes) {
  if (selectedItem?.kind !== 'weapon' && selectedItem?.kind !== 'accessory') {
    return `
      <section class="pv-loadout-synergy variant-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">현재 장비 조합으로 활성 가능한 시너지가 없습니다.</div>
      </section>
    `;
  }

  const sourceMap = selectedItem.kind === 'weapon'
    ? indexes?.synergiesByWeaponId
    : indexes?.synergiesByAccessoryId;
  const synergies = sourceMap?.get(selectedItem.id) ?? [];
  const activeSynergyIds = new Set(player?.activeSynergies ?? []);

  if (synergies.length === 0) {
    return `
      <section class="pv-loadout-synergy variant-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">현재 장비 조합으로 활성 가능한 시너지가 없습니다.</div>
      </section>
    `;
  }

  const synergyHtml = synergies.map((synergy) => {
    const isActive = activeSynergyIds.has(synergy?.id);
    const statusLabel = isActive ? '활성' : '비활성';
    const requirementRefs = toArray(synergy?.requires)
      .map((requirement) => buildRequirementReference(requirement, indexes))
      .filter(Boolean);
    const requirementChips = requirementRefs.length > 0
      ? `<div class="pv-loadout-req-chips">${requirementRefs.map((reference) => renderRequirementChip(reference, player)).join('')}</div>`
      : '';
    return `
      <div class="pv-loadout-synergy-row${isActive ? ' active' : ''}">
        <div class="pv-loadout-synergy-head">
          <div class="pv-loadout-meta-title">
            ${renderMetaIcon('✦', 'tone-synergy')}
            <span class="pv-loadout-synergy-name">${escapeHtml(synergy?.name ?? synergy?.id ?? '시너지')}</span>
          </div>
          <span class="pv-loadout-synergy-state">${statusLabel}</span>
        </div>
        <div class="pv-loadout-synergy-desc">${escapeHtml(synergy?.description ?? '')}</div>
        ${requirementChips}
      </div>
    `;
  }).join('');

  return `
    <section class="pv-loadout-synergy variant-synergy">
      <h4 class="pv-loadout-section-title">시너지</h4>
      <div class="pv-loadout-synergy-list">
        ${synergyHtml}
      </div>
    </section>
  `;
}

function renderEvolutionSection(selectedItem, player, data, indexes) {
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
    const isDone = player?.evolvedWeapons?.has(recipe?.id);
    const requirementRefs = toArray(recipe?.requires?.accessoryIds)
      .map((accessoryId) => buildRequirementReference(accessoryId, indexes))
      .filter(Boolean);

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
          <div class="pv-loadout-evolution-desc">
            ${escapeHtml(accessoryNames || '추가 장신구 필요')}
          </div>
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
          <div class="pv-loadout-evolution-desc">
            ${escapeHtml(weaponName)}
          </div>
          ${weaponReference ? `<div class="pv-loadout-req-chips">${renderRequirementChip(weaponReference, player)}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="pv-loadout-evolution variant-evolution">
        <h4 class="pv-loadout-section-title">진화</h4>
        <div class="pv-loadout-evolution-list">
          ${recipeHtml}
        </div>
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

function buildStatusRows(selectedItem, relationCount) {
  if (selectedItem?.kind === 'weapon') {
    return [
      ['현재 위력', selectedItem.source?.damage ?? '—'],
      ['현재 쿨다운', formatCompactNumber(selectedItem.source?.cooldown)],
      ['연결 수', relationCount],
    ];
  }

  if (selectedItem?.kind === 'accessory') {
    return [
      ['희귀도', selectedItem.source?.rarity ?? 'common'],
      ['연결 수', relationCount],
    ];
  }

  return [
    ['상태', getKindLabel(selectedItem?.kind)],
  ];
}

function renderStatusBlock(selectedItem, relationCount) {
  const rows = buildStatusRows(selectedItem, relationCount);
  const levelBlockHtml = selectedItem?.level != null && selectedItem?.maxLevel != null
    ? `
        <div class="pv-loadout-lv-block">
          <div class="pv-loadout-lv-row">
            <span>Lv.${selectedItem.level} / ${selectedItem.maxLevel}</span>
            <span class="pv-loadout-lv-pct">${Math.round((selectedItem.level / selectedItem.maxLevel) * 100)}%</span>
          </div>
          <div class="pv-loadout-lv-dots">
            ${Array.from({ length: selectedItem.maxLevel }, (_, index) => `<div class="pv-loadout-lv-dot${index < selectedItem.level ? ' filled' : ''}"></div>`).join('')}
          </div>
        </div>
      `
    : '';

  return `
    <div class="pv-loadout-power variant-status">
      <h4 class="pv-loadout-section-title">현재 상태</h4>
      <div class="pv-loadout-progress-block">
        <div class="pv-loadout-power-lines">
          ${rows.map(([label, value]) => `
            <div class="pv-loadout-power-row">
              <span class="pv-loadout-row-label">${escapeHtml(String(label))}</span>
              <span class="pv-loadout-row-value">${escapeHtml(String(value))}</span>
            </div>
          `).join('')}
        </div>
        ${levelBlockHtml}
      </div>
    </div>
  `;
}

function renderWeaponStatsSection(weapon) {
  const damage = weapon.damage ?? 0;
  const cooldown = weapon.cooldown ?? 1;
  const range = weapon.range ?? 0;
  const cooldownFill = Math.max(0, Math.min(100, Math.round((1 - (cooldown / 4)) * 100)));

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">스탯</h4>
      <div class="pv-stat-bar-row">
        <span class="pv-stat-bar-key">데미지</span>
        <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${Math.min(100, damage * 7)}%;background:#e06060"></div></div>
        <span class="pv-stat-bar-val">${damage}</span>
      </div>
      <div class="pv-stat-bar-row">
        <span class="pv-stat-bar-key">쿨다운</span>
        <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${cooldownFill}%;background:#7ecde8"></div></div>
        <span class="pv-stat-bar-val">${formatSeconds(cooldown)}</span>
      </div>
      ${range > 0 ? `
        <div class="pv-stat-bar-row">
          <span class="pv-stat-bar-key">사거리</span>
          <div class="pv-stat-bar-track"><div class="pv-stat-bar-fill" style="width:${Math.min(100, Math.round(range / 5))}%;background:#6dba72"></div></div>
          <span class="pv-stat-bar-val">${Math.round(range)}</span>
        </div>
      ` : ''}
      ${weapon.statusEffectId ? `
        <div class="pv-stat-bar-row">
          <span class="pv-stat-bar-key">상태이상</span>
          <span class="pv-stat-bar-status">${escapeHtml(getStatusLabel(weapon.statusEffectId))} ${Math.round((weapon.statusEffectChance ?? 0) * 100)}%</span>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAccessoryStatsSection(selectedItem, indexes) {
  const definition = indexes?.accessoryById?.get(selectedItem.source.id);
  const lines = definition ? buildAccessoryLevelDesc(definition) : [];
  if (lines.length === 0) return '';

  return `
    <div class="pv-loadout-stats-section">
      <h4 class="pv-loadout-section-title">레벨별 효과</h4>
      ${lines.map((line) => `<div class="pv-loadout-level-line">${escapeHtml(line)}</div>`).join('')}
    </div>
  `;
}

export function renderPauseLoadoutDetail(selectedItem, player, data, indexes) {
  const kindLabel = getKindLabel(selectedItem?.kind);
  const title = selectedItem?.name ?? kindLabel;
  const definition = getItemDefinition(selectedItem, indexes);
  const summary = selectedItem?.kind === 'weapon' || selectedItem?.kind === 'accessory'
    ? (definition?.description ?? selectedItem?.description ?? '장비 역할 정보를 준비 중입니다.')
    : selectedItem?.kind === 'empty'
      ? '새로운 장비를 획득하면 이 슬롯에 배치됩니다.'
      : '추가 슬롯은 상점에서 해금합니다.';
  const relationCount = getRelatedItems(selectedItem, player, data, indexes).length;
  const statsHtml = selectedItem?.kind === 'weapon' && selectedItem?.source
    ? renderWeaponStatsSection(selectedItem.source)
    : '';
  const effectLevelsHtml = selectedItem?.kind === 'accessory' && selectedItem?.source
    ? renderAccessoryStatsSection(selectedItem, indexes)
    : '';
  const detailKindClass = selectedItem?.kind === 'weapon'
    ? 'detail-kind-weapon'
    : selectedItem?.kind === 'accessory'
      ? 'detail-kind-accessory'
      : selectedItem?.kind === 'empty'
        ? 'detail-kind-empty'
        : 'detail-kind-locked';
  const detailIcon = getSlotIcon(selectedItem, indexes);

  return `
    <div class="pv-loadout-detail-header ${detailKindClass}">
      <div class="pv-loadout-detail-hero">
        <div class="pv-loadout-detail-icon">${detailIcon}</div>
        <div class="pv-loadout-detail-copy">
          <div class="pv-loadout-detail-kind">${escapeHtml(kindLabel)}</div>
          <h3 class="pv-loadout-detail-name">${escapeHtml(title)}</h3>
          <div class="pv-loadout-detail-summary">${escapeHtml(summary || '선택된 항목 정보')}</div>
        </div>
      </div>
    </div>
    ${statsHtml}
    ${effectLevelsHtml}
    ${renderStatusBlock(selectedItem, relationCount)}
    ${renderLinkedItems(selectedItem, player, data, indexes)}
    ${renderSynergySection(selectedItem, player, indexes)}
    ${renderEvolutionSection(selectedItem, player, data, indexes)}
  `;
}

export function renderPauseLoadoutPanel({
  items,
  selectedItemKey = null,
  player,
  data,
  indexes,
} = {}) {
  const loadoutItems = Array.isArray(items) && items.length > 0
    ? items
    : buildPauseLoadoutItems({ player });
  const selectedItem = findSelectedItem(loadoutItems, selectedItemKey)
    ?? getDefaultPauseSelection({ player });
  const selectedKey = selectedItem?.selectionKey ?? null;
  const weaponItems = loadoutItems.filter((item) => item.kind === 'weapon' || (item.kind === 'empty' && item.name?.includes('무기')));
  const accessoryItems = loadoutItems.filter((item) => item.kind === 'accessory' || (item.kind === 'empty' && item.name?.includes('장신구')));

  const weaponCardsHtml = weaponItems.map((item) => renderSlotCard(item, selectedKey, player, data, indexes)).join('');
  const accessoryCardsHtml = accessoryItems
    .map((item) => renderSlotCard(item, selectedKey, player, data, indexes))
    .join('');
  const weaponCount = weaponItems.filter((item) => item.kind === 'weapon').length;
  const accessoryCount = accessoryItems.filter((item) => item.kind === 'accessory').length;
  const maxWeaponSlots = Math.max(0, player?.maxWeaponSlots ?? 3);
  const maxAccessorySlots = Math.max(0, player?.maxAccessorySlots ?? 3);

  return `
    <section class="pv-loadout-panel" aria-label="로드아웃">
      <div class="pv-loadout-list">
        <div class="pv-slot-section">
          ${renderSectionHeader('무기', '⚔', weaponCount, maxWeaponSlots)}
          <div class="pv-slot-cards">${weaponCardsHtml}</div>
        </div>
        <div class="pv-slot-section pv-slot-section--acc">
          ${renderSectionHeader('장신구', '◈', accessoryCount, maxAccessorySlots)}
          <div class="pv-slot-cards">${accessoryCardsHtml}</div>
        </div>
      </div>
      <div class="pv-loadout-detail" data-loadout-detail>
        ${selectedItem ? renderPauseLoadoutDetail(selectedItem, player, data, indexes) : '<div class="pv-loadout-empty-msg">선택할 항목이 없습니다.</div>'}
      </div>
    </section>
  `;
}
