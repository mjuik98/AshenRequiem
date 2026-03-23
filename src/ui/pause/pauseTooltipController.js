import {
  buildPauseAccessoryTooltipContent,
  buildPauseWeaponTooltipContent,
} from './pauseTooltipContent.js';

export const PAUSE_TOOLTIP_SELECTORS = {
  weapon: '.pv-slot-card[data-loadout="weapon"]',
  accessory: '.pv-slot-card[data-loadout="accessory"]',
};

export function buildPauseTooltipBindingEntries(context) {
  return [
    {
      selector: PAUSE_TOOLTIP_SELECTORS.weapon,
      buildContent: (element) => buildPauseWeaponTooltipContent({
        weaponId: element.dataset.loadoutId,
        ...context,
      }),
    },
    {
      selector: PAUSE_TOOLTIP_SELECTORS.accessory,
      buildContent: (element) => buildPauseAccessoryTooltipContent({
        accessoryId: element.dataset.loadoutId,
        ...context,
      }),
    },
  ];
}

export function computePauseTooltipPosition({
  event,
  tooltipWidth,
  tooltipHeight,
  viewportWidth,
  viewportHeight,
}) {
  const pad = 14;
  const rect = event?.target?.getBoundingClientRect?.() ?? { right: 0, top: 0, height: 0 };
  const cursorX = event?.clientX ?? rect.right;
  const cursorY = event?.clientY ?? (rect.top + rect.height / 2);
  let x = cursorX + pad;
  let y = cursorY - (tooltipHeight / 2);

  if (x + tooltipWidth > viewportWidth - 8) x = cursorX - tooltipWidth - pad;
  if (x < 8) x = 8;
  if (y + tooltipHeight > viewportHeight - 8) y = viewportHeight - tooltipHeight - 8;
  if (y < 8) y = 8;

  return { x, y };
}
