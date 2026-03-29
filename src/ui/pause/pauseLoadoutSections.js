import {
  buildPauseLoadoutItems,
  findSelectedItem,
  getDefaultPauseSelection,
  matchesSlotCategory,
} from './pauseLoadoutModel.js';
import { renderPauseLoadoutGrid } from './pauseLoadoutCards.js';
import { renderPauseLoadoutDetail } from './pauseLoadoutDetailSections.js';

export { renderPauseLoadoutDetail } from './pauseLoadoutDetailSections.js';

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
  const weaponItems = loadoutItems.filter((item) => matchesSlotCategory(item, 'weapon'));
  const accessoryItems = loadoutItems.filter((item) => matchesSlotCategory(item, 'accessory'));
  const weaponCount = weaponItems.filter((item) => item.kind === 'weapon').length;
  const accessoryCount = accessoryItems.filter((item) => item.kind === 'accessory').length;
  const maxWeaponSlots = Math.max(0, player?.maxWeaponSlots ?? 3);
  const maxAccessorySlots = Math.max(0, player?.maxAccessorySlots ?? 3);

  return `
    <section class="pv-loadout-panel" aria-label="로드아웃">
      <div class="pv-loadout-list">
        ${renderPauseLoadoutGrid({
          label: '무기',
          icon: '⚔',
          items: weaponItems,
          count: weaponCount,
          maxCount: maxWeaponSlots,
          selectedKey,
          player,
          data,
          indexes,
        })}
        ${renderPauseLoadoutGrid({
          label: '장신구',
          icon: '◈',
          items: accessoryItems,
          count: accessoryCount,
          maxCount: maxAccessorySlots,
          selectedKey,
          player,
          data,
          indexes,
        })}
      </div>
      <div class="pv-loadout-detail" data-loadout-detail>
        ${selectedItem ? renderPauseLoadoutDetail(selectedItem, player, data, indexes) : '<div class="pv-loadout-empty-msg">선택할 항목이 없습니다.</div>'}
      </div>
    </section>
  `;
}
