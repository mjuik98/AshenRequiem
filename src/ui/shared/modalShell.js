function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHtmlAttributes(attributes = {}) {
  return Object.entries(attributes)
    .map(([key, value]) => {
      if (value === false || value == null) return '';
      if (value === true) return key;
      return `${key}="${escapeHtml(value)}"`;
    })
    .filter(Boolean)
    .join(' ');
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function renderModalHeader({
  eyebrow = '',
  title = '',
  copy = '',
  titleTag = 'h2',
  titleId = '',
  copyId = '',
  headerClassName = '',
  eyebrowClassName = '',
  titleClassName = '',
  copyClassName = '',
} = {}) {
  const safeTitleTag = titleTag || 'h2';
  const headerClass = joinClasses('ui-modal-header-stack', headerClassName);
  const eyebrowClass = joinClasses('ui-modal-eyebrow', eyebrowClassName);
  const titleClass = joinClasses('ui-modal-title', titleClassName);
  const copyClass = joinClasses('ui-modal-copy', copyClassName);

  return `
    <div class="${headerClass}">
      ${eyebrow ? `<p class="${eyebrowClass}">${escapeHtml(eyebrow)}</p>` : ''}
      <${safeTitleTag} class="${titleClass}" ${titleId ? `id="${escapeHtml(titleId)}"` : ''}>${escapeHtml(title)}</${safeTitleTag}>
      ${copy ? `<p class="${copyClass}" ${copyId ? `id="${escapeHtml(copyId)}"` : ''}>${escapeHtml(copy)}</p>` : ''}
    </div>
  `;
}

export function renderModalShell({
  tone = 'loadout',
  shellClassName = '',
  includeBackdrop = true,
  backdropClassName = '',
  backdropAttributes = {},
  panelTag = 'section',
  panelClassName = '',
  panelAttributes = {},
  headerHtml = '',
  bodyHtml = '',
  footerHtml = '',
} = {}) {
  const safePanelTag = panelTag || 'section';
  const panelAttrs = renderHtmlAttributes(panelAttributes);
  const backdropAttrs = renderHtmlAttributes(backdropAttributes);
  const shellClass = joinClasses('ui-modal-shell', `ui-modal-tone--${escapeHtml(tone)}`, shellClassName);
  const backdropClass = joinClasses('ui-modal-backdrop', backdropClassName);
  const panelClass = joinClasses('ui-modal-panel', panelClassName);

  return `
    <div class="${shellClass}">
      ${includeBackdrop ? `<div class="${backdropClass}" ${backdropAttrs}></div>` : ''}
      <${safePanelTag} class="${panelClass}" ${panelAttrs}>
        ${headerHtml}
        ${bodyHtml}
        ${footerHtml}
      </${safePanelTag}>
    </div>
  `;
}
