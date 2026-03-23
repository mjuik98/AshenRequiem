export function bindPauseTooltipEntries({
  root,
  tooltip,
  entries,
  ensureTooltip,
  showTooltip,
  hideTooltip,
  positionTooltip,
  documentRef = document,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  hideDelayMs = 80,
}) {
  const nextTooltip = ensureTooltip(tooltip, documentRef);
  let hideTimer = null;

  const showTip = (element, buildContent, event) => {
    clearTimeoutFn(hideTimer);
    showTooltip({
      tooltip: nextTooltip,
      element,
      buildContent,
      event,
    });
  };

  const hideTip = () => {
    hideTimer = setTimeoutFn(() => hideTooltip(nextTooltip), hideDelayMs);
  };

  entries.forEach(({ selector, buildContent }) => {
    root.querySelectorAll(selector).forEach((element) => {
      element.addEventListener('mouseenter', (event) => showTip(element, buildContent, event));
      element.addEventListener('mousemove', (event) => positionTooltip(nextTooltip, event));
      element.addEventListener('mouseleave', hideTip);
      element.addEventListener('focusin', (event) => showTip(element, buildContent, event));
      element.addEventListener('focusout', hideTip);
    });
  });

  return {
    tooltip: nextTooltip,
    dispose() {
      clearTimeoutFn(hideTimer);
      hideTooltip(nextTooltip);
    },
  };
}
