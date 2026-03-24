import {
  getKindLabel,
  toArray,
} from './pauseLoadoutFormatting.js';

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
