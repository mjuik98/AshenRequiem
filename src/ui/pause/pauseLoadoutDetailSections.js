import {
  renderPauseEvolutionSection,
  renderPauseLinkedItemsSection,
  renderPauseSynergySection,
} from './pauseLoadoutMetaSections.js';
import {
  renderPauseAccessoryStatsSection,
  renderPauseLoadoutDetailHeader,
  renderPauseStatusBlock,
  renderPauseWeaponStatsSection,
} from './pauseLoadoutStatsSections.js';

export function renderPauseLoadoutDetail(selectedItem, player, data, indexes) {
  const { headerHtml } = renderPauseLoadoutDetailHeader(selectedItem, player, data, indexes);
  const statsHtml = selectedItem?.kind === 'weapon' && selectedItem?.source
    ? renderPauseWeaponStatsSection(selectedItem.source, player)
    : '';
  const effectLevelsHtml = selectedItem?.kind === 'accessory' && selectedItem?.source
    ? renderPauseAccessoryStatsSection(selectedItem, indexes)
    : '';

  return `
    ${headerHtml}
    ${statsHtml}
    ${effectLevelsHtml}
    ${renderPauseStatusBlock(selectedItem)}
    ${renderPauseLinkedItemsSection(selectedItem, player, data, indexes)}
    ${renderPauseSynergySection(selectedItem, player, indexes)}
    ${renderPauseEvolutionSection(selectedItem, player, data, indexes)}
  `;
}
