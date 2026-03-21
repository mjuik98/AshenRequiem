import { buildAccessoryLevelDesc } from '../../data/accessoryData.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getKindLabel(kind) {
  switch (kind) {
    case 'weapon':
      return '무기';
    case 'accessory':
      return '장신구';
    case 'empty':
      return '빈 슬롯';
    case 'locked':
      return '상점 해금';
    default:
      return '로드아웃';
  }
}

function buildEquippedItem(kind, entity, slotIndex) {
  const name = entity?.name ?? entity?.id ?? getKindLabel(kind);
  return {
    kind,
    id: entity?.id ?? null,
    selectionKey: `${kind}:${slotIndex}`,
    name,
    label: name,
    slotIndex,
    level: entity?.level ?? null,
    maxLevel: entity?.maxLevel ?? null,
    rarity: entity?.rarity ?? null,
    description: entity?.description ?? '',
    state: kind,
    source: entity ?? null,
  };
}

function buildPlaceholderItem(kind, label, slotIndex, extra = {}) {
  return {
    kind,
    id: null,
    selectionKey: `${kind}:${slotIndex}`,
    name: label,
    label,
    slotIndex,
    state: kind,
    source: null,
    ...extra,
  };
}

function findSelectedItem(items, selectedItemKey) {
  if (!Array.isArray(items) || items.length === 0) return null;

  if (selectedItemKey != null) {
    const matchByKey = items.find((item) => item.selectionKey === selectedItemKey);
    if (matchByKey) return matchByKey;
  }

  const equipped = items.find((item) => item.kind === 'weapon' || item.kind === 'accessory');
  return equipped ?? items[0] ?? null;
}

function summarizeWeapon(weapon) {
  const parts = [];
  if (weapon?.level != null) parts.push(`Lv.${weapon.level}`);
  if (weapon?.damage != null) parts.push(`데미지 ${weapon.damage}`);
  if (weapon?.cooldown != null) parts.push(`쿨다운 ${weapon.cooldown}`);
  if (weapon?.range != null) parts.push(`사거리 ${Math.round(weapon.range)}`);
  return parts.join(' · ');
}

function summarizeAccessory(accessory) {
  const parts = [];
  if (accessory?.level != null) parts.push(`Lv.${accessory.level}`);
  if (accessory?.rarity) parts.push(accessory.rarity === 'rare' ? '희귀' : escapeHtml(accessory.rarity));
  if (accessory?.description) parts.push(accessory.description);
  return parts.join(' · ');
}

function getAccessoryEffectSummary(accessory, indexes) {
  const definition = indexes?.accessoryById?.get(accessory?.id);
  const lines = definition ? buildAccessoryLevelDesc(definition) : [];
  return lines[0] ?? accessory?.description ?? '현재 효과 정보를 준비 중입니다.';
}

export function normalizePauseSynergyRequirementId(requirement) {
  if (typeof requirement !== 'string') return null;
  if (requirement.startsWith('up_')) return requirement.slice(3);
  if (requirement.startsWith('get_')) return requirement.slice(4);
  return requirement;
}

function getEquippedIds(player, kind) {
  const source = kind === 'weapon' ? toArray(player?.weapons) : toArray(player?.accessories);
  return new Set(source.map((item) => item?.id).filter(Boolean));
}

function getRelatedItems(selectedItem, player, data, indexes) {
  if (selectedItem?.kind !== 'weapon' && selectedItem?.kind !== 'accessory') {
    return [];
  }

  const isWeapon = selectedItem.kind === 'weapon';
  const sourceKind = isWeapon ? 'accessory' : 'weapon';
  const sourceMap = isWeapon ? indexes?.accessoryById ?? new Map() : indexes?.weaponById ?? new Map();
  const synergyMap = isWeapon ? indexes?.synergiesByWeaponId : indexes?.synergiesByAccessoryId;
  const equippedIds = getEquippedIds(player, sourceKind);
  const relationships = new Map();

  const addRelationship = (kind, id, reason) => {
    if (!id || !sourceMap.has(id)) return;
    const key = `${kind}:${id}`;
    const current = relationships.get(key) ?? {
      kind,
      id,
      name: sourceMap.get(id)?.name ?? id,
      equipped: equippedIds.has(id),
      reasons: new Set(),
    };
    current.reasons.add(reason);
    relationships.set(key, current);
  };

  for (const recipe of data?.weaponEvolutionData ?? []) {
    if (isWeapon && recipe?.requires?.weaponId === selectedItem.id) {
      for (const accessoryId of toArray(recipe?.requires?.accessoryIds)) {
        addRelationship('accessory', accessoryId, '진화 경로');
      }
    }
    if (!isWeapon && toArray(recipe?.requires?.accessoryIds).includes(selectedItem.id)) {
      addRelationship('weapon', recipe?.requires?.weaponId, '진화 경로');
    }
  }

  for (const synergy of synergyMap?.get(selectedItem.id) ?? []) {
    for (const requirement of synergy?.requires ?? []) {
      const requirementId = normalizePauseSynergyRequirementId(requirement);
      if (!requirementId || requirementId === selectedItem.id) continue;
      addRelationship(sourceKind, requirementId, '시너지 연결');
    }
  }

  return [...relationships.values()].sort((left, right) => {
    if (left.equipped !== right.equipped) return left.equipped ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function isEvolutionReady(item, player, data) {
  if (item?.kind !== 'weapon') return false;
  const recipes = toArray(data?.weaponEvolutionData);
  const recipe = recipes.find((candidate) => candidate?.requires?.weaponId === item.id);
  if (!recipe) return false;

  const ownedAccessoryIds = new Set(toArray(player?.accessories).map((accessory) => accessory?.id));
  const isMaxLevel = (item?.source?.level ?? 0) >= (item?.source?.maxLevel ?? Infinity);
  const hasAccessories = toArray(recipe?.requires?.accessoryIds).every((accessoryId) => ownedAccessoryIds.has(accessoryId));
  return isMaxLevel && hasAccessories;
}

function hasSynergyActive(item, player, indexes) {
  if (item?.kind !== 'weapon' && item?.kind !== 'accessory') return false;
  const synergyMap = item.kind === 'weapon'
    ? indexes?.synergiesByWeaponId
    : indexes?.synergiesByAccessoryId;
  const synergies = synergyMap?.get(item?.id) ?? [];
  const activeSynergyIds = new Set(player?.activeSynergies ?? []);
  return synergies.some((synergy) => activeSynergyIds.has(synergy?.id));
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

function getBehaviorLabel(behaviorId) {
  const labels = {
    targetProjectile: '투사체',
    areaBurst: '광역',
    orbit: '궤도',
    boomerang: '부메랑',
    chainLightning: '연쇄',
    omnidirectional: '전방향',
    laserBeam: '레이저',
    groundZone: '장판',
    ricochetProjectile: '반사',
  };
  return labels[behaviorId] ?? '무기';
}

function getSlotIcon(item) {
  if (item?.kind === 'empty' || item?.kind === 'locked') {
    return '<span class="pv-slot-icon-glyph muted">+</span>';
  }

  if (item?.kind === 'accessory') {
    return '<span class="pv-slot-icon-glyph">◈</span>';
  }

  const iconMap = {
    targetProjectile: '◈',
    orbit: '◉',
    areaBurst: '✦',
    boomerang: '↺',
    chainLightning: '⚡',
    omnidirectional: '✸',
    laserBeam: '→',
    groundZone: '⊚',
    ricochetProjectile: '◆',
  };
  return `<span class="pv-slot-icon-glyph">${iconMap[item?.source?.behaviorId] ?? '⚔'}</span>`;
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
      ${item?.kind === 'empty' || item?.kind === 'locked' ? 'disabled' : ''}
    >
      <div class="pv-slot-icon-box${iconBoxClass ? ` ${iconBoxClass}` : ''}">
        ${getSlotIcon(item)}
      </div>
      <div class="pv-slot-body">
        <div class="pv-slot-name">${escapeHtml(item?.name ?? getKindLabel(item?.kind))}</div>
        <div class="pv-slot-sub">${typePill}${levelText}</div>
      </div>
      ${rightHtml}
    </button>
  `;
}

function buildWeaponItems(player) {
  const weapons = toArray(player?.weapons);
  const maxWeaponSlots = Math.max(0, player?.maxWeaponSlots ?? 3);
  const items = weapons.map((weapon, index) => buildEquippedItem('weapon', weapon, index));

  for (let index = weapons.length; index < maxWeaponSlots; index += 1) {
    items.push(buildPlaceholderItem('empty', '빈 무기 슬롯', index, { description: '비어 있는 무기 슬롯입니다.' }));
  }

  return items;
}

function buildAccessoryItems(player) {
  const accessories = toArray(player?.accessories);
  const maxAccessorySlots = Math.max(0, player?.maxAccessorySlots ?? 3);
  const items = accessories.map((accessory, index) => buildEquippedItem('accessory', accessory, index));

  for (let index = accessories.length; index < maxAccessorySlots; index += 1) {
    items.push(buildPlaceholderItem('empty', '빈 장신구 슬롯', index, { description: '비어 있는 장신구 슬롯입니다.' }));
  }

  return items;
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
    : `<div class="pv-loadout-empty-msg">${escapeHtml(selectedItem?.kind === 'locked' ? '상점 해금 후 표시' : '실제 연결 아이템이 없습니다.')}</div>`;

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
    <section class="pv-loadout-linked-items">
      <h4 class="pv-loadout-section-title">연결 아이템</h4>
      <div class="pv-loadout-chip-row">
        ${linkedItemsHtml}
      </div>
      ${hintsHtml ? `<div class="pv-loadout-link-list">${hintsHtml}</div>` : ''}
    </section>
  `;
}

function renderSynergySection(selectedItem, player, data, indexes) {
  if (selectedItem?.kind !== 'weapon' && selectedItem?.kind !== 'accessory') {
    return `
      <section class="pv-loadout-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">선택한 항목의 시너지가 여기에 표시됩니다.</div>
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
      <section class="pv-loadout-synergy">
        <h4 class="pv-loadout-section-title">시너지</h4>
        <div class="pv-loadout-empty-msg">연결된 시너지가 없습니다.</div>
      </section>
    `;
  }

  const synergyHtml = synergies.map((synergy) => {
    const isActive = activeSynergyIds.has(synergy?.id);
    const statusLabel = isActive ? '활성' : '비활성';
    return `
      <div class="pv-loadout-synergy-row${isActive ? ' active' : ''}">
        <div class="pv-loadout-synergy-head">
          <span class="pv-loadout-synergy-name">${escapeHtml(synergy?.name ?? synergy?.id ?? '시너지')}</span>
          <span class="pv-loadout-synergy-state">${statusLabel}</span>
        </div>
        <div class="pv-loadout-synergy-desc">${escapeHtml(synergy?.description ?? '')}</div>
      </div>
    `;
  }).join('');

  return `
    <section class="pv-loadout-synergy">
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
        <section class="pv-loadout-evolution">
          <h4 class="pv-loadout-section-title">진화</h4>
          <div class="pv-loadout-empty-msg">이 무기에 대한 진화 정보가 없습니다.</div>
        </section>
      `;
    }

    const accessoryById = indexes?.accessoryById ?? new Map();
    const accessoryNames = toArray(recipe?.requires?.accessoryIds)
      .map((accessoryId) => accessoryById.get(accessoryId)?.name ?? accessoryId)
      .filter(Boolean)
      .join(', ');
    const resultWeaponName = indexes?.weaponById?.get(recipe?.resultWeaponId)?.name ?? recipe?.resultWeaponId ?? '결과 무기';
    const isDone = player?.evolvedWeapons?.has(recipe?.id);

    return `
      <section class="pv-loadout-evolution">
        <h4 class="pv-loadout-section-title">진화</h4>
        <div class="pv-loadout-evolution-row${isDone ? ' done' : ''}">
          <div class="pv-loadout-evolution-head">
            <span class="pv-loadout-evolution-name">${escapeHtml(isDone ? '진화 완료' : '진화 조건')}</span>
            <span class="pv-loadout-evolution-state">${escapeHtml(resultWeaponName)}</span>
          </div>
          <div class="pv-loadout-evolution-desc">
            ${escapeHtml(accessoryNames || '추가 장신구 필요')}
          </div>
        </div>
      </section>
    `;
  }

  if (selectedItem?.kind === 'accessory') {
    const matchedRecipes = recipes.filter((candidate) => toArray(candidate?.requires?.accessoryIds).includes(selectedItem.id));
    if (matchedRecipes.length === 0) {
      return `
        <section class="pv-loadout-evolution">
          <h4 class="pv-loadout-section-title">진화</h4>
          <div class="pv-loadout-empty-msg">이 장신구에 대한 진화 정보가 없습니다.</div>
        </section>
      `;
    }

    const recipeHtml = matchedRecipes.map((recipe) => {
      const weaponName = indexes?.weaponById?.get(recipe?.requires?.weaponId)?.name ?? recipe?.requires?.weaponId ?? '무기';
      const isDone = player?.evolvedWeapons?.has(recipe?.id);
      return `
        <div class="pv-loadout-evolution-row${isDone ? ' done' : ''}">
          <div class="pv-loadout-evolution-head">
            <span class="pv-loadout-evolution-name">${escapeHtml(isDone ? '진화 완료' : '진화 조건')}</span>
            <span class="pv-loadout-evolution-state">${escapeHtml(weaponName)}</span>
          </div>
          <div class="pv-loadout-evolution-desc">
            ${escapeHtml(recipe?.resultWeaponId ?? '결과 무기')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="pv-loadout-evolution">
        <h4 class="pv-loadout-section-title">진화</h4>
        <div class="pv-loadout-evolution-list">
          ${recipeHtml}
        </div>
      </section>
    `;
  }

  return `
    <section class="pv-loadout-evolution">
      <h4 class="pv-loadout-section-title">진화</h4>
      <div class="pv-loadout-empty-msg">선택한 항목의 진화 정보가 여기에 표시됩니다.</div>
    </section>
  `;
}

function renderItemDetail(selectedItem, player, data, indexes) {
  const kindLabel = getKindLabel(selectedItem?.kind);
  const title = selectedItem?.name ?? kindLabel;
  const summary = selectedItem?.kind === 'weapon'
    ? `현재 효과: ${summarizeWeapon(selectedItem.source) || '기본 공격을 강화합니다.'}`
    : selectedItem?.kind === 'accessory'
      ? `현재 효과: ${getAccessoryEffectSummary(selectedItem.source, indexes)}`
      : selectedItem?.kind === 'empty'
        ? '새로운 장비를 찾을 수 있는 빈 슬롯입니다.'
        : '추가 슬롯은 상점에서 해금합니다.';
  const relationCount = getRelatedItems(selectedItem, player, data, indexes).length;
  const progressRows = selectedItem?.kind === 'weapon'
    ? `
        <div class="pv-loadout-power-row"><span>레벨 진행</span><span>${escapeHtml(String(selectedItem.source?.level ?? 1))}/${escapeHtml(String(selectedItem.source?.maxLevel ?? 5))}</span></div>
        <div class="pv-loadout-power-row"><span>현재 위력</span><span>${escapeHtml(String(selectedItem.source?.damage ?? '—'))}</span></div>
        <div class="pv-loadout-power-row"><span>현재 쿨다운</span><span>${escapeHtml(String(selectedItem.source?.cooldown ?? '—'))}</span></div>
        <div class="pv-loadout-power-row"><span>연결 수</span><span>${escapeHtml(String(relationCount))}</span></div>
      `
    : selectedItem?.kind === 'accessory'
      ? `
          <div class="pv-loadout-power-row"><span>레벨 진행</span><span>${escapeHtml(String(selectedItem.source?.level ?? 1))}/${escapeHtml(String(selectedItem.source?.maxLevel ?? 5))}</span></div>
          <div class="pv-loadout-power-row"><span>희귀도</span><span>${escapeHtml(selectedItem.source?.rarity ?? 'common')}</span></div>
          <div class="pv-loadout-power-row"><span>현재 효과</span><span>${escapeHtml(getAccessoryEffectSummary(selectedItem.source, indexes))}</span></div>
          <div class="pv-loadout-power-row"><span>연결 수</span><span>${escapeHtml(String(relationCount))}</span></div>
        `
      : `
          <div class="pv-loadout-power-row"><span>상태</span><span>${escapeHtml(kindLabel)}</span></div>
        `;

  let statsHtml = '';
  if (selectedItem?.kind === 'weapon' && selectedItem?.source) {
    const weapon = selectedItem.source;
    const damage = weapon.damage ?? 0;
    const cooldown = weapon.cooldown ?? 1;
    const range = weapon.range ?? 0;
    const cooldownFill = Math.max(0, Math.min(100, Math.round((1 - (cooldown / 4)) * 100)));

    statsHtml = `
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
          <span class="pv-stat-bar-val">${cooldown}s</span>
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

  let effectLevelsHtml = '';
  if (selectedItem?.kind === 'accessory' && selectedItem?.source) {
    const definition = indexes?.accessoryById?.get(selectedItem.source.id);
    const lines = definition ? buildAccessoryLevelDesc(definition) : [];
    if (lines.length > 0) {
      effectLevelsHtml = `
        <div class="pv-loadout-stats-section">
          <h4 class="pv-loadout-section-title">레벨별 효과</h4>
          ${lines.map((line) => `<div class="pv-loadout-level-line">${escapeHtml(line)}</div>`).join('')}
        </div>
      `;
    }
  }

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
    <div class="pv-loadout-detail-header">
      <div class="pv-loadout-detail-kind">${escapeHtml(kindLabel)}</div>
      <h3 class="pv-loadout-detail-name">${escapeHtml(title)}</h3>
      <div class="pv-loadout-detail-summary">${escapeHtml(summary || '선택된 항목 정보')}</div>
    </div>
    ${statsHtml}
    ${effectLevelsHtml}
    <div class="pv-loadout-role-summary">
      <h4 class="pv-loadout-section-title">역할 / 효과</h4>
      <div class="pv-loadout-role-copy">${escapeHtml(summary || '선택된 항목 정보')}</div>
      <div class="pv-loadout-role-copy muted">
        ${escapeHtml(
          selectedItem?.kind === 'weapon'
            ? '선택한 무기의 현재 역할과 연결 조건을 우선 확인하세요.'
            : selectedItem?.kind === 'accessory'
              ? '선택한 장신구가 어떤 무기/시너지와 맞물리는지 먼저 확인하세요.'
              : '선택 가능한 슬롯 상태를 확인하세요.',
        )}
      </div>
    </div>
    <div class="pv-loadout-power">
      <h4 class="pv-loadout-section-title">현재 상태</h4>
      <div class="pv-loadout-progress-block">
        <div class="pv-loadout-power-lines">
          ${progressRows}
        </div>
      </div>
    </div>
    ${levelBlockHtml ? `<div class="pv-loadout-power"><h4 class="pv-loadout-section-title">레벨 진행</h4>${levelBlockHtml}</div>` : ''}
    ${renderLinkedItems(selectedItem, player, data, indexes)}
    ${renderSynergySection(selectedItem, player, data, indexes)}
    ${renderEvolutionSection(selectedItem, player, data, indexes)}
    <div class="pv-loadout-guidance">
      <h4 class="pv-loadout-section-title">다음 안내</h4>
      <div class="pv-loadout-empty-msg">
        ${escapeHtml(
          selectedItem?.kind === 'weapon'
            ? '장신구와의 연결과 진화 조건을 확인하세요.'
            : selectedItem?.kind === 'accessory'
              ? '무기와 맞물리는 진화 조합을 확인하세요.'
              : selectedItem?.kind === 'empty'
                ? '장비를 채우면 상세 정보가 나타납니다.'
                : '해금 후 상세 정보가 표시됩니다.',
        )}
      </div>
    </div>
  `;
}

export function buildPauseLoadoutItems({ player } = {}) {
  const items = [
    ...buildWeaponItems(player),
    ...buildAccessoryItems(player),
  ];
  items.push(buildPlaceholderItem('locked', '상점 해금', items.length, {
    description: '추가 슬롯은 상점에서 해금합니다.',
  }));

  return items.map((item, index) => ({
    ...item,
    slotIndex: index,
    selectionKey: `${item.kind}:${index}`,
  }));
}

export function getDefaultPauseSelection({ player } = {}) {
  const items = buildPauseLoadoutItems({ player });
  return (
    items.find((item) => item.kind === 'weapon')
    ?? items.find((item) => item.kind === 'accessory')
    ?? items.find((item) => item.kind === 'empty')
    ?? items.find((item) => item.kind === 'locked')
    ?? null
  );
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
  const selectedItem = findSelectedItem(loadoutItems, selectedItemKey);
  const selectedKey = selectedItem?.selectionKey ?? null;
  const weaponItems = loadoutItems.filter((item) => item.kind === 'weapon' || (item.kind === 'empty' && item.name?.includes('무기')));
  const accessoryItems = loadoutItems.filter((item) => item.kind === 'accessory' || (item.kind === 'empty' && item.name?.includes('장신구')));
  const lockedItems = loadoutItems.filter((item) => item.kind === 'locked');

  const weaponCardsHtml = weaponItems.map((item) => renderSlotCard(item, selectedKey, player, data, indexes)).join('');
  const accessoryCardsHtml = accessoryItems
    .map((item) => renderSlotCard(item, selectedKey, player, data, indexes))
    .join('');
  const weaponCount = weaponItems.filter((item) => item.kind === 'weapon').length;
  const accessoryCount = accessoryItems.filter((item) => item.kind === 'accessory').length;
  const lockCount = lockedItems.length;
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
        ${lockCount > 0 ? `
          <div class="pv-slot-section pv-slot-section--locked">
            ${renderSectionHeader('해금', '🔒', lockCount, lockCount)}
            <div class="pv-slot-cards">${lockedItems.map((item) => renderSlotCard(item, selectedKey, player, data, indexes)).join('')}</div>
          </div>
        ` : ''}
      </div>
      <div class="pv-loadout-detail" data-loadout-detail>
        ${selectedItem ? renderItemDetail(selectedItem, player, data, indexes) : '<div class="pv-loadout-empty-msg">선택할 항목이 없습니다.</div>'}
      </div>
    </section>
  `;
}

function getStatusLabel(statusEffectId) {
  const labels = {
    slow: '슬로우',
    poison: '독',
    stun: '스턴',
  };
  return labels[statusEffectId] ?? statusEffectId;
}
