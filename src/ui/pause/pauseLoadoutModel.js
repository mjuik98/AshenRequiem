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

function getIndexedItemById(id, indexes) {
  if (!id) return null;
  const weapon = indexes?.weaponById?.get(id);
  if (weapon) return { kind: 'weapon', id, item: weapon };
  const accessory = indexes?.accessoryById?.get(id);
  if (accessory) return { kind: 'accessory', id, item: accessory };
  return null;
}

function getEquippedIds(player, kind) {
  const source = kind === 'weapon' ? toArray(player?.weapons) : toArray(player?.accessories);
  return new Set(source.map((item) => item?.id).filter(Boolean));
}

function getReferenceGlyph(kind) {
  if (kind === 'weapon') return '⚔';
  if (kind === 'accessory') return '◈';
  return '•';
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function formatCompactNumber(value, digits = 2) {
  return Number.isFinite(value)
    ? String(Number(value.toFixed(digits)))
    : '—';
}

export function formatSeconds(value, digits = 2) {
  return Number.isFinite(value)
    ? `${formatCompactNumber(value, digits)}s`
    : '—';
}

export function getKindLabel(kind) {
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

export function findSelectedItem(items, selectedItemKey) {
  if (!Array.isArray(items) || items.length === 0) return null;

  if (selectedItemKey != null) {
    const matchByKey = items.find((item) => item.selectionKey === selectedItemKey);
    if (matchByKey) return matchByKey;
  }

  const equipped = items.find((item) => item.kind === 'weapon' || item.kind === 'accessory');
  return equipped ?? items[0] ?? null;
}

export function getItemDefinition(item, indexes) {
  if (item?.kind === 'weapon') {
    return indexes?.weaponById?.get(item?.id) ?? item?.source ?? null;
  }
  if (item?.kind === 'accessory') {
    return indexes?.accessoryById?.get(item?.id) ?? item?.source ?? null;
  }
  return item?.source ?? null;
}

export function normalizePauseSynergyRequirementId(requirement) {
  if (typeof requirement !== 'string') return null;
  if (requirement.startsWith('up_')) return requirement.slice(3);
  if (requirement.startsWith('get_')) return requirement.slice(4);
  if (requirement.startsWith('acc_')) return requirement.slice(4);
  return requirement;
}

export function getRelatedItems(selectedItem, player, data, indexes) {
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

export function isEvolutionReady(item, player, data) {
  if (item?.kind !== 'weapon') return false;
  const recipes = toArray(data?.weaponEvolutionData);
  const recipe = recipes.find((candidate) => candidate?.requires?.weaponId === item.id);
  if (!recipe) return false;

  const ownedAccessoryIds = new Set(toArray(player?.accessories).map((accessory) => accessory?.id));
  const isMaxLevel = (item?.source?.level ?? 0) >= (item?.source?.maxLevel ?? Infinity);
  const hasAccessories = toArray(recipe?.requires?.accessoryIds).every((accessoryId) => ownedAccessoryIds.has(accessoryId));
  return isMaxLevel && hasAccessories;
}

export function hasSynergyActive(item, player, indexes) {
  if (item?.kind !== 'weapon' && item?.kind !== 'accessory') return false;
  const synergyMap = item.kind === 'weapon'
    ? indexes?.synergiesByWeaponId
    : indexes?.synergiesByAccessoryId;
  const synergies = synergyMap?.get(item?.id) ?? [];
  const activeSynergyIds = new Set(player?.activeSynergies ?? []);
  return synergies.some((synergy) => activeSynergyIds.has(synergy?.id));
}

export function getBehaviorLabel(behaviorId) {
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

export function getSlotIcon(item, indexes) {
  if (item?.kind === 'empty' || item?.kind === 'locked') {
    return '<span class="pv-slot-icon-glyph muted">+</span>';
  }

  const definition = getItemDefinition(item, indexes);
  if (definition?.icon) {
    return `<span class="pv-slot-icon-glyph">${escapeHtml(definition.icon)}</span>`;
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

export function buildRequirementReference(requirement, indexes) {
  const id = normalizePauseSynergyRequirementId(requirement);
  if (!id) return null;
  const resolved = getIndexedItemById(id, indexes);
  if (resolved) return resolved;
  return { kind: 'unknown', id, item: null };
}

export function isReferenceEquipped(reference, player) {
  if (!reference?.kind || reference.kind === 'unknown') return false;
  return getEquippedIds(player, reference.kind).has(reference.id);
}

export function getReferenceGlyphForRequirement(kind) {
  return getReferenceGlyph(kind);
}

export function buildPauseLoadoutItems({ player } = {}) {
  const items = [
    ...buildWeaponItems(player),
    ...buildAccessoryItems(player),
  ];

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

export function getStatusLabel(statusEffectId) {
  const labels = {
    slow: '슬로우',
    poison: '독',
    stun: '스턴',
  };
  return labels[statusEffectId] ?? statusEffectId;
}
