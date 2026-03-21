function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderPauseTabNavigation({
  activeTabName,
  weaponCount,
  maxWpnSlots,
  accessoryCount,
  maxAccSlots,
}) {
  return `
    <nav class="pv-tabs" role="tablist" aria-label="정보 탭">
      <button class="pv-tab ${activeTabName === 'weapons' ? 'active' : ''}" type="button" role="tab" aria-selected="${activeTabName === 'weapons'}" data-tab-name="weapons">
        무기 <span class="pv-tab-cnt">${weaponCount}/${maxWpnSlots}</span>
      </button>
      <button class="pv-tab ${activeTabName === 'accessories' ? 'active' : ''}" type="button" role="tab" aria-selected="${activeTabName === 'accessories'}" data-tab-name="accessories">
        장신구 <span class="pv-tab-cnt">${accessoryCount}/${maxAccSlots}</span>
      </button>
      <button class="pv-tab ${activeTabName === 'stats' ? 'active' : ''}" type="button" role="tab" aria-selected="${activeTabName === 'stats'}" data-tab-name="stats">
        스탯
      </button>
      <button class="pv-tab ${activeTabName === 'sound' ? 'active' : ''}" type="button" role="tab" aria-selected="${activeTabName === 'sound'}" data-tab-name="sound">
        사운드
      </button>
    </nav>
  `;
}

export function renderPauseTabPanels({
  activeTabName,
  weapons,
  accessories,
  maxAccSlots,
  weaponCardsHtml,
  accessoryGridHtml,
  statsHtml,
  soundControlsHtml,
}) {
  return `
    <div class="pv-tab-content ${activeTabName === 'weapons' ? 'active' : ''}" id="pv-tab-weapons" role="tabpanel">
      <div class="pv-weapon-list">
        ${weapons.length > 0 ? weaponCardsHtml : '<div class="pv-empty-msg">보유 무기 없음</div>'}
      </div>
    </div>

    <div class="pv-tab-content ${activeTabName === 'accessories' ? 'active' : ''}" id="pv-tab-accessories" role="tabpanel">
      <div class="pv-acc-grid">
        ${accessoryGridHtml}
      </div>
    </div>

    <div class="pv-tab-content ${activeTabName === 'stats' ? 'active' : ''}" id="pv-tab-stats" role="tabpanel">
      ${statsHtml}
    </div>

    <div class="pv-tab-content ${activeTabName === 'sound' ? 'active' : ''}" id="pv-tab-sound" role="tabpanel">
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
        <span class="pv-pause-title">Paused</span>
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
