function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getStartLoadoutWeaponEmoji(behaviorId) {
  const map = {
    targetProjectile: '🔵',
    areaBurst: '✨',
    orbit: '⚡',
    boomerang: '🪃',
    chainLightning: '⚡',
    omnidirectional: '🌀',
    laserBeam: '☀️',
    groundZone: '🔥',
    ricochetProjectile: '💠',
  };
  return map[behaviorId] ?? '⚔';
}

function getStartLoadoutWeaponTag(behaviorId) {
  const map = {
    targetProjectile: '투사체',
    areaBurst: '광역',
    orbit: '궤도',
    boomerang: '관통',
    chainLightning: '연쇄',
    omnidirectional: '전방향',
    laserBeam: '레이저',
    groundZone: '장판',
    ricochetProjectile: '반사',
  };
  return map[behaviorId] ?? '기본';
}

function renderAscensionChoices(ascensionChoices = [], selectedAscensionLevel = 0) {
  return ascensionChoices.map((choice) => `
    <button
      class="sl-asc-card ${choice.level === selectedAscensionLevel ? 'selected' : ''}"
      data-ascension-level="${choice.level}"
      type="button"
    >
      <span class="sl-asc-level">A${choice.level}</span>
      <span class="sl-asc-name">${escapeHtml(choice.name)}</span>
      <span class="sl-asc-pressure">${escapeHtml(choice.pressureLabel ?? '')}</span>
      <span class="sl-asc-reward">${escapeHtml(choice.rewardLabel ?? '')}</span>
    </button>
  `).join('');
}

function getSelectedAscension(ascensionChoices = [], selectedAscensionLevel = 0) {
  return ascensionChoices.find((choice) => choice?.level === selectedAscensionLevel)
    ?? ascensionChoices[0]
    ?? null;
}

function renderAscensionSummary(ascensionChoices = [], selectedAscensionLevel = 0) {
  const selectedAscension = getSelectedAscension(ascensionChoices, selectedAscensionLevel);
  if (!selectedAscension) return '';

  return `
    <div class="sl-asc-summary" data-selected-ascension="${selectedAscension.level}">
      <div class="sl-asc-summary-head">
        <span class="sl-asc-summary-kicker">현재 계약</span>
        <span class="sl-asc-summary-title">A${selectedAscension.level} · ${escapeHtml(selectedAscension.name)}</span>
      </div>
      <p class="sl-asc-summary-desc">${escapeHtml(selectedAscension.description ?? '')}</p>
      <div class="sl-asc-summary-metrics">
        <span>${escapeHtml(selectedAscension.pressureLabel ?? '')}</span>
        <span>${escapeHtml(selectedAscension.rewardLabel ?? '')}</span>
      </div>
    </div>
  `;
}

function getAccessoryIcon(accessory) {
  if (typeof accessory?.icon === 'string' && accessory.icon.length > 0) {
    return accessory.icon;
  }
  return '◌';
}

function getConfigIcon(entry, fallback = '◌') {
  if (typeof entry?.icon === 'string' && entry.icon.length > 0) {
    return entry.icon;
  }
  return fallback;
}

function renderAccessoryChoices(accessories = [], selectedStartAccessoryId = null) {
  const noneSelected = selectedStartAccessoryId == null;
  const noneCard = `
    <button
      class="sl-inline-card ${noneSelected ? 'selected' : ''}"
      data-accessory-id="none"
      type="button"
    >
      <span class="sl-inline-icon">Ø</span>
      <span class="sl-inline-copy">
        <span class="sl-inline-title">없음</span>
        <span class="sl-inline-desc">순수한 시작 무기 세팅으로 진입합니다.</span>
      </span>
    </button>
  `;

  return [
    noneCard,
    ...accessories.map((accessory) => `
      <button
        class="sl-inline-card ${accessory.id === selectedStartAccessoryId ? 'selected' : ''}"
        data-accessory-id="${escapeHtml(accessory.id)}"
        type="button"
      >
        <span class="sl-inline-icon">${escapeHtml(getAccessoryIcon(accessory))}</span>
        <span class="sl-inline-copy">
          <span class="sl-inline-title">${escapeHtml(accessory.name)}</span>
          <span class="sl-inline-desc">${escapeHtml(accessory.description ?? '')}</span>
        </span>
      </button>
    `),
  ].join('');
}

function renderStageChoices(stages = [], selectedStageId = 'ash_plains') {
  return stages.map((stage) => `
    <button
      class="sl-inline-card ${stage.id === selectedStageId ? 'selected' : ''}"
      data-stage-id="${escapeHtml(stage.id)}"
      type="button"
    >
      <span class="sl-inline-copy">
        <span class="sl-inline-title">${escapeHtml(stage.name)}</span>
        <span class="sl-inline-desc">${escapeHtml(stage.description ?? '')}</span>
      </span>
    </button>
  `).join('');
}

function renderArchetypeChoices(archetypes = [], selectedArchetypeId = 'vanguard') {
  return archetypes.map((archetype) => `
    <button
      class="sl-inline-card ${archetype.id === selectedArchetypeId ? 'selected' : ''}"
      data-archetype-id="${escapeHtml(archetype.id)}"
      type="button"
    >
      <span class="sl-inline-icon">${escapeHtml(getConfigIcon(archetype, '✦'))}</span>
      <span class="sl-inline-copy">
        <span class="sl-inline-title">${escapeHtml(archetype.name)}</span>
        <span class="sl-inline-desc">${escapeHtml(archetype.description ?? '')}</span>
      </span>
    </button>
  `).join('');
}

function renderRiskRelicChoices(riskRelics = [], selectedRiskRelicId = null) {
  const noneSelected = selectedRiskRelicId == null;
  const noneCard = `
    <button
      class="sl-inline-card ${noneSelected ? 'selected' : ''}"
      data-risk-relic-id="none"
      type="button"
    >
      <span class="sl-inline-icon">Ø</span>
      <span class="sl-inline-copy">
        <span class="sl-inline-title">없음</span>
        <span class="sl-inline-desc">안정적인 기본 규칙으로 런을 시작합니다.</span>
      </span>
    </button>
  `;

  return [
    noneCard,
    ...riskRelics.map((riskRelic) => `
      <button
        class="sl-inline-card ${riskRelic.id === selectedRiskRelicId ? 'selected' : ''}"
        data-risk-relic-id="${escapeHtml(riskRelic.id)}"
        type="button"
      >
        <span class="sl-inline-icon">${escapeHtml(getConfigIcon(riskRelic, '✧'))}</span>
        <span class="sl-inline-copy">
          <span class="sl-inline-title">${escapeHtml(riskRelic.name)}</span>
          <span class="sl-inline-desc">${escapeHtml(riskRelic.description ?? '')}</span>
        </span>
      </button>
    `),
  ].join('');
}

function renderSeedChoices(selectedSeedMode = 'none', selectedSeedText = '', seedPreviewText = '') {
  const modes = [
    {
      id: 'none',
      label: '기본 RNG',
      description: '매번 새로운 런을 생성합니다.',
    },
    {
      id: 'daily',
      label: '데일리',
      description: '오늘 날짜 기준 고정 시드로 플레이합니다.',
    },
    {
      id: 'custom',
      label: '커스텀',
      description: '직접 입력한 시드로 런을 재현합니다.',
    },
  ];

  return `
    <div class="sl-inline-grid">
      ${modes.map((mode) => `
        <button
          class="sl-inline-card ${mode.id === selectedSeedMode ? 'selected' : ''}"
          data-seed-mode="${mode.id}"
          type="button"
        >
          <span class="sl-inline-copy">
            <span class="sl-inline-title">${escapeHtml(mode.label)}</span>
            <span class="sl-inline-desc">${escapeHtml(mode.description)}</span>
          </span>
        </button>
      `).join('')}
    </div>
    <label class="sl-seed-field ${selectedSeedMode === 'custom' ? 'active' : 'inactive'}">
      <span class="sl-seed-label">Seed</span>
      <input
        class="sl-seed-input"
        data-seed-text
        type="text"
        value="${escapeHtml(selectedSeedText)}"
        placeholder="ashen-run-001"
        ${selectedSeedMode === 'custom' ? '' : 'disabled'}
      />
      <span class="sl-seed-preview">${escapeHtml(seedPreviewText)}</span>
    </label>
  `;
}

function renderRecommendedGoals(recommendedGoals = []) {
  if (!recommendedGoals.length) return '';

  return `
    <div class="sl-goal-block">
      <div class="sl-section-title">Recommended Goals</div>
      <div class="sl-goal-list">
        ${recommendedGoals.map((goal) => `
          <div class="sl-goal-card">
            <span class="sl-goal-icon">${escapeHtml(goal.icon ?? '✦')}</span>
            <span class="sl-goal-copy">
              <span class="sl-goal-title">${escapeHtml(goal.title ?? goal.rewardText ?? '목표')}</span>
              <span class="sl-goal-desc">${escapeHtml(goal.description ?? '')}</span>
            </span>
            <span class="sl-goal-meta">${escapeHtml(goal.progressText ?? `${Math.round(goal.pct ?? 0)}%`)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderStartLoadoutCards(weapons = [], selectedWeaponId = null) {
  return weapons.map((weapon) => `
    <button
      class="sl-card ${weapon.id === selectedWeaponId ? 'selected' : ''}"
      data-weapon-id="${escapeHtml(weapon.id)}"
      type="button"
    >
      <div class="sl-card-top">
        <span class="sl-icon">${getStartLoadoutWeaponEmoji(weapon.behaviorId)}</span>
        <span class="sl-name">${escapeHtml(weapon.name)}</span>
      </div>
      <div class="sl-tag-row">
        <span class="sl-tag">${escapeHtml(getStartLoadoutWeaponTag(weapon.behaviorId))}</span>
      </div>
      <p class="sl-desc">${escapeHtml(weapon.description ?? '')}</p>
    </button>
  `).join('');
}

export function renderStartLoadoutMarkup({
  weapons = [],
  accessories = [],
  archetypes = [],
  riskRelics = [],
  selectedWeaponId = null,
  ascensionChoices = [],
  selectedAscensionLevel = 0,
  selectedStartAccessoryId = null,
  selectedArchetypeId = 'vanguard',
  selectedRiskRelicId = null,
  stages = [],
  selectedStageId = 'ash_plains',
  selectedSeedMode = 'none',
  selectedSeedText = '',
  seedPreviewText = '',
  recommendedGoals = [],
  canStart = false,
} = {}) {
  const emptyState = weapons.length === 0
    ? '<p class="sl-empty">시작 가능한 기본 무기가 없습니다.</p>'
    : '';
  const copy = canStart
    ? '해금한 기본 무기 중 하나를 고르고 전투를 시작합니다.'
    : '시작 가능한 기본 무기가 없습니다.';

  return `
    <div class="sl-backdrop" data-action="cancel"></div>
    <section class="sl-panel" role="dialog" aria-modal="true" aria-labelledby="sl-title">
      <p class="sl-eyebrow">Loadout</p>
      <h2 class="sl-title" id="sl-title">시작 무기 선택</h2>
      <p class="sl-copy">${escapeHtml(copy)}</p>
      <div class="sl-ascension-block">
        <div class="sl-section-title">Ascension</div>
        <div class="sl-ascension-grid">${renderAscensionChoices(ascensionChoices, selectedAscensionLevel)}</div>
        ${renderAscensionSummary(ascensionChoices, selectedAscensionLevel)}
      </div>
      <div class="sl-config-block">
        <div class="sl-section-title">Starting Relic</div>
        <div class="sl-inline-grid">${renderAccessoryChoices(accessories, selectedStartAccessoryId)}</div>
      </div>
      <div class="sl-config-block">
        <div class="sl-section-title">Archetype</div>
        <div class="sl-inline-grid">${renderArchetypeChoices(archetypes, selectedArchetypeId)}</div>
      </div>
      <div class="sl-config-block">
        <div class="sl-section-title">Risk Relic</div>
        <div class="sl-inline-grid">${renderRiskRelicChoices(riskRelics, selectedRiskRelicId)}</div>
      </div>
      <div class="sl-config-block">
        <div class="sl-section-title">Stage</div>
        <div class="sl-inline-grid">${renderStageChoices(stages, selectedStageId)}</div>
      </div>
      <div class="sl-config-block">
        <div class="sl-section-title">Run Seed</div>
        ${renderSeedChoices(selectedSeedMode, selectedSeedText, seedPreviewText)}
      </div>
      ${renderRecommendedGoals(recommendedGoals)}
      <div class="sl-grid">${renderStartLoadoutCards(weapons, selectedWeaponId)}</div>
      ${emptyState}
      <div class="sl-actions">
        <button class="sl-btn ghost" data-action="cancel" type="button">취소</button>
        <button class="sl-btn primary" data-action="start" type="button"${canStart ? '' : ' disabled'}>시작하기</button>
      </div>
    </section>
  `;
}
