import { computePauseTooltipPosition } from './pauseTooltipController.js';

export function ensurePauseTooltip(existingTooltip = null, doc = document) {
  if (existingTooltip) return existingTooltip;

  const tooltip = doc.createElement('div');
  tooltip.className = 'pv-tooltip';
  tooltip.style.display = 'none';
  doc.body.appendChild(tooltip);
  return tooltip;
}

export function showPauseTooltip({ tooltip, element, buildContent, event }) {
  const html = buildContent?.(element);
  if (!tooltip || !html?.trim()) return false;

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  positionPauseTooltip(tooltip, event);
  return true;
}

export function hidePauseTooltip(tooltip) {
  if (!tooltip) return;
  tooltip.style.display = 'none';
  tooltip.innerHTML = '';
}

export function positionPauseTooltip(tooltip, event, viewport = window) {
  if (!tooltip) return;

  const { x, y } = computePauseTooltipPosition({
    event,
    tooltipWidth: tooltip.offsetWidth || 220,
    tooltipHeight: tooltip.offsetHeight || 100,
    viewportWidth: viewport.innerWidth,
    viewportHeight: viewport.innerHeight,
  });

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}
