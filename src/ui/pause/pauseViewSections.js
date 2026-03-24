function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizePauseTabName(activeTabName) {
  if (activeTabName === 'weapons' || activeTabName === 'accessories') {
    return 'loadout';
  }
  return activeTabName ?? 'loadout';
}

export function renderPauseTabNavigation({
  activeTabName,
  weaponCount,
  maxWpnSlots,
  accessoryCount,
  maxAccSlots,
}) {
  const normalizedTabName = normalizePauseTabName(activeTabName);
  return `
    <nav class="pv-tabs" role="tablist" aria-label="정보 탭">
      <button class="pv-tab ${normalizedTabName === 'loadout' ? 'active' : ''}" type="button" role="tab" aria-selected="${normalizedTabName === 'loadout'}" data-tab-name="loadout">
        로드아웃
      </button>
      <button class="pv-tab ${normalizedTabName === 'stats' ? 'active' : ''}" type="button" role="tab" aria-selected="${normalizedTabName === 'stats'}" data-tab-name="stats">
        스탯
      </button>
      <button class="pv-tab ${normalizedTabName === 'sound' ? 'active' : ''}" type="button" role="tab" aria-selected="${normalizedTabName === 'sound'}" data-tab-name="sound">
        사운드
      </button>
    </nav>
  `;
}

export function renderPauseTabPanels({
  activeTabName,
  loadoutPanelHtml = null,
  statsHtml,
  soundControlsHtml,
}) {
  const normalizedTabName = normalizePauseTabName(activeTabName);
  const fallbackLoadoutHtml = `
    <section class="pv-loadout-panel" aria-label="로드아웃">
      <div class="pv-loadout-list"></div>
      <div class="pv-loadout-detail">
        <div class="pv-loadout-detail-empty">선택한 로드아웃 항목의 상세 정보가 여기에 표시됩니다.</div>
      </div>
    </section>
  `;
  const hasCustomLoadoutPanel = loadoutPanelHtml !== null && loadoutPanelHtml !== undefined;
  const loadoutHtml = hasCustomLoadoutPanel ? loadoutPanelHtml : fallbackLoadoutHtml;
  return `
    <div class="pv-tab-content ${normalizedTabName === 'loadout' ? 'active' : ''}" id="pv-tab-loadout" role="tabpanel">
      ${loadoutHtml}
    </div>

    <div class="pv-tab-content ${normalizedTabName === 'stats' ? 'active' : ''}" id="pv-tab-stats" role="tabpanel">
      ${statsHtml}
    </div>

    <div class="pv-tab-content ${normalizedTabName === 'sound' ? 'active' : ''}" id="pv-tab-sound" role="tabpanel">
      ${soundControlsHtml}
    </div>
  `;
}

export function renderPauseHeader({
  timeStr,
  killStr,
  level,
  hp,
  maxHp,
  hpPct,
  hpFillClass,
  hpFillColor,
  hpPctColor,
}) {
  return `
    <header class="pv-header">
      <div class="pv-pause-badge">
        <div class="pv-pause-icon" aria-hidden="true">
          <div class="pv-pbar"></div><div class="pv-pbar"></div>
        </div>
        <span class="pv-pause-title">일시정지</span>
      </div>
      <div class="pv-run-stats" aria-label="현재 런 정보">
        <div class="pv-run-stat"><span class="pv-run-val">${escapeHtml(timeStr)}</span><span class="pv-run-key">생존</span></div>
        <div class="pv-run-div"></div>
        <div class="pv-run-stat"><span class="pv-run-val">${escapeHtml(String(killStr))}</span><span class="pv-run-key">킬</span></div>
        <div class="pv-run-div"></div>
        <div class="pv-run-stat"><span class="pv-run-val">Lv.${level}</span><span class="pv-run-key">레벨</span></div>
      </div>
    </header>

    <section class="pv-hp-section" aria-label="체력">
      <span class="pv-hp-label">HP</span>
      <div class="pv-hp-track">
        <div class="pv-hp-fill ${hpFillClass}" style="width:${hpPct}%;background:${hpFillColor}"></div>
      </div>
      <div class="pv-hp-meta">
        <span class="pv-hp-frac">${hp} / ${maxHp}</span>
        <span class="pv-hp-pct" style="color:${hpPctColor}">${Math.round(hpPct)}%</span>
        ${hpPct <= 30 ? '<span class="pv-hp-warn" aria-live="assertive">위험</span>' : ''}
      </div>
    </section>
  `;
}
