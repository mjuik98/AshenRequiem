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

function renderLinkedItems(selectedItem, player, data, indexes) {
  const weaponById = indexes?.weaponById ?? new Map();
  const accessoryById = indexes?.accessoryById ?? new Map();

  let label = '연결 정보 없음';
  let items = [];

  if (selectedItem?.kind === 'weapon') {
    items = toArray(player?.accessories).map((accessory) => accessory?.name ?? accessory?.id).filter(Boolean);
    if (items.length === 0) {
      label = '장신구 연결 없음';
    } else {
      label = '현재 장신구';
    }
  } else if (selectedItem?.kind === 'accessory') {
    items = toArray(player?.weapons).map((weapon) => weapon?.name ?? weapon?.id).filter(Boolean);
    if (items.length === 0) {
      label = '무기 연결 없음';
    } else {
      label = '현재 무기';
    }
  } else if (selectedItem?.kind === 'locked') {
    label = '상점 해금 후 표시';
  }

  const linkedItemsHtml = items.length > 0
    ? items.map((itemName) => `<span class="pv-loadout-chip">${escapeHtml(itemName)}</span>`).join('')
    : `<div class="pv-loadout-empty-msg">${escapeHtml(label)}</div>`;

  const idHints = [];
  if (selectedItem?.kind === 'weapon') {
    for (const recipe of data?.weaponEvolutionData ?? []) {
      if (recipe?.requires?.weaponId === selectedItem.id) {
        const accessoryNames = toArray(recipe.requires.accessoryIds)
          .map((accessoryId) => accessoryById.get(accessoryId)?.name ?? accessoryId)
          .filter(Boolean)
          .join(', ');
        idHints.push({
          title: '진화 조건',
          text: accessoryNames ? `${accessoryNames} 필요` : '조건 확인 필요',
        });
      }
    }
  } else if (selectedItem?.kind === 'accessory') {
    for (const recipe of data?.weaponEvolutionData ?? []) {
      if (toArray(recipe?.requires?.accessoryIds).includes(selectedItem.id)) {
        const weaponName = weaponById.get(recipe?.requires?.weaponId)?.name ?? recipe?.requires?.weaponId ?? '무기';
        idHints.push({
          title: '연결 진화',
          text: `${weaponName} 관련`,
        });
      }
    }
  }

  const hintsHtml = idHints.length > 0
    ? idHints.map((hint) => `
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
    ? summarizeWeapon(selectedItem.source)
    : selectedItem?.kind === 'accessory'
      ? summarizeAccessory(selectedItem.source)
      : selectedItem?.kind === 'empty'
        ? '새로운 장비를 찾을 수 있는 빈 슬롯입니다.'
        : '추가 슬롯은 상점에서 해금합니다.';

  return `
    <div class="pv-loadout-detail-header">
      <div class="pv-loadout-detail-kind">${escapeHtml(kindLabel)}</div>
      <h3 class="pv-loadout-detail-name">${escapeHtml(title)}</h3>
      <div class="pv-loadout-detail-summary">${escapeHtml(summary || '선택된 항목 정보')}</div>
    </div>
    <div class="pv-loadout-power">
      <h4 class="pv-loadout-section-title">현재 정보</h4>
      <div class="pv-loadout-power-lines">
        ${selectedItem?.kind === 'weapon'
          ? `
            <div class="pv-loadout-power-row"><span>레벨</span><span>Lv.${escapeHtml(String(selectedItem.source?.level ?? 1))}</span></div>
            <div class="pv-loadout-power-row"><span>데미지</span><span>${escapeHtml(String(selectedItem.source?.damage ?? '—'))}</span></div>
            <div class="pv-loadout-power-row"><span>쿨다운</span><span>${escapeHtml(String(selectedItem.source?.cooldown ?? '—'))}</span></div>
          `
          : selectedItem?.kind === 'accessory'
            ? `
              <div class="pv-loadout-power-row"><span>레벨</span><span>Lv.${escapeHtml(String(selectedItem.source?.level ?? 1))}</span></div>
              <div class="pv-loadout-power-row"><span>희귀도</span><span>${escapeHtml(selectedItem.source?.rarity ?? 'common')}</span></div>
            `
            : `
              <div class="pv-loadout-power-row"><span>상태</span><span>${escapeHtml(kindLabel)}</span></div>
            `
        }
      </div>
    </div>
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

function renderLoadoutCard(item, selectedItemKey) {
  const isSelected = selectedItemKey != null && item?.selectionKey === selectedItemKey;
  const kindLabel = getKindLabel(item?.kind);
  const badge = item?.kind === 'weapon'
    ? (item?.level != null ? `Lv.${item.level}` : '무기')
    : item?.kind === 'accessory'
      ? (item?.rarity === 'rare' ? '희귀' : '장신구')
      : kindLabel;
  const summary = item?.kind === 'weapon'
    ? summarizeWeapon(item.source)
    : item?.kind === 'accessory'
      ? summarizeAccessory(item.source)
      : item?.kind === 'empty'
        ? '비어 있는 장비 슬롯'
        : '상점 해금 필요';

  return `
    <button
      class="pv-loadout-card kind-${escapeHtml(item?.kind ?? 'unknown')}${isSelected ? ' selected' : ''}"
      type="button"
      data-loadout="${escapeHtml(item?.kind ?? 'unknown')}"
      data-loadout-id="${escapeHtml(item?.id ?? '')}"
      data-loadout-key="${escapeHtml(item?.selectionKey ?? '')}"
      aria-pressed="${isSelected}"
    >
      <div class="pv-loadout-card-top">
        <span class="pv-loadout-card-badge">${escapeHtml(badge)}</span>
        <span class="pv-loadout-card-kind">${escapeHtml(kindLabel)}</span>
      </div>
      <div class="pv-loadout-card-name">${escapeHtml(item?.name ?? kindLabel)}</div>
      <div class="pv-loadout-card-summary">${escapeHtml(summary)}</div>
    </button>
  `;
}

export function buildPauseLoadoutItems({ player } = {}) {
  const weapons = toArray(player?.weapons);
  const accessories = toArray(player?.accessories);
  const maxWeaponSlots = Math.max(0, player?.maxWeaponSlots ?? 3);
  const maxAccessorySlots = Math.max(0, player?.maxAccessorySlots ?? 3);

  const items = [];
  weapons.forEach((weapon) => {
    items.push(buildEquippedItem('weapon', weapon, items.length));
  });
  accessories.forEach((accessory) => {
    items.push(buildEquippedItem('accessory', accessory, items.length));
  });

  const emptyCount = Math.max(0, maxWeaponSlots - weapons.length) + Math.max(0, maxAccessorySlots - accessories.length);
  for (let index = 0; index < emptyCount; index += 1) {
    items.push(buildPlaceholderItem('empty', '빈 슬롯', items.length, { description: '비어 있는 장비 슬롯' }));
  }

  items.push(buildPlaceholderItem('locked', '상점 해금', items.length, {
    description: '추가 슬롯은 상점에서 해금합니다.',
  }));

  return items.map((item, index) => ({ ...item, slotIndex: index }));
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
  const renderedItems = loadoutItems.map((item) => renderLoadoutCard(item, selectedKey)).join('');

  return `
    <section class="pv-loadout-panel" aria-label="로드아웃">
      <div class="pv-loadout-list">
        ${renderedItems}
      </div>
      <div class="pv-loadout-detail" data-loadout-detail>
        ${selectedItem ? renderItemDetail(selectedItem, player, data, indexes) : '<div class="pv-loadout-empty-msg">선택할 항목이 없습니다.</div>'}
      </div>
    </section>
  `;
}
