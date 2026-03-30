import {
  buildCodexAccessoryDetailModel,
  buildCodexAccessoryGridModel,
} from './codexAccessoryModel.js';

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderAccessoryFilters(search, rarityFilter, effectFilter, statusFilter) {
  const rarityFilters = [
    ['all', '전체'],
    ['common', '일반'],
    ['rare', '희귀'],
    ['catalyst', '진화 재료'],
  ];
  const effectFilters = [
    ['all', '전체 효과'],
    ['offense', '전투'],
    ['sustain', '생존'],
    ['utility', '유틸'],
  ];
  const statusFilters = [
    ['all', '전체 상태'],
    ['discovered', '발견'],
    ['locked', '미발견'],
  ];

  return `
    <div class="cx-search-row">
      <input class="cx-search" id="cx-accessory-search" placeholder="장신구 이름 또는 효과 검색..." aria-label="장신구 검색" value="${escapeAttribute(search)}">
      <div class="cx-tier-filter">
        ${rarityFilters.map(([value, label]) => `
          <button class="cx-af${rarityFilter === value ? ' active' : ''}" data-afilter="${value}" type="button">${label}</button>
        `).join('')}
      </div>
      <div class="cx-tier-filter">
        ${effectFilters.map(([value, label]) => `
          <button class="cx-ef${effectFilter === value ? ' active' : ''}" data-efilter="${value}" type="button">${label}</button>
        `).join('')}
      </div>
      <div class="cx-tier-filter">
        ${statusFilters.map(([value, label]) => `
          <button class="cx-sf${statusFilter === value ? ' active' : ''}" data-status-filter="${value}" type="button">${label}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCodexAccessoryCard(card) {
  return `
    <div class="cx-acard ${card.rarity} ${!card.unlocked ? 'locked' : ''} ${card.isSelected ? 'selected' : ''}"
         data-aid="${card.id}" role="button" tabindex="0" aria-label="${card.unlocked ? card.name : '미발견 장신구'} 상세 보기">
      <div class="cx-ahead">
        <div class="cx-aicon">${card.icon}</div>
        <div class="cx-acopy">
          <div class="cx-aname">${card.unlocked ? card.name : '???'}</div>
          <div class="cx-arow">
            <span class="cx-ararity ${card.rarity}">${card.rarityLabel}</span>
            <span class="cx-alevel">Lv.${card.maxLevel}</span>
            ${card.isCatalyst ? '<span class="cx-acatalyst">진화 재료</span>' : ''}
          </div>
        </div>
      </div>
      ${card.unlocked
        ? `<div class="cx-aeffect">${card.effectText}</div>`
        : `<div class="cx-wlocked">아직 미발견</div>`}
    </div>
  `;
}

function renderAccessoryDetail(detail) {
  if (!detail) {
    return '<div class="cx-accessory-detail"><div class="cx-discovery-hint">표시할 장신구가 없습니다.</div></div>';
  }

  return `
    <div class="cx-accessory-detail" id="cx-accessory-detail" role="region" tabindex="-1" aria-label="선택한 장신구 상세 정보">
      <div class="cx-detail-kicker">선택한 장신구</div>
      <div class="cx-detail-hero">
        <div class="cx-detail-icon">${detail.icon}</div>
        <div class="cx-detail-copy">
          <div class="cx-detail-name">${detail.displayName}</div>
          <div class="cx-detail-subline">
            <span class="cx-ararity ${detail.rarity}">${detail.rarityLabel}</span>
            <span class="cx-alevel">Lv.${detail.maxLevel}</span>
            ${detail.isCatalyst ? '<span class="cx-acatalyst">진화 재료</span>' : ''}
          </div>
          <div class="cx-detail-desc">${detail.description}</div>
        </div>
      </div>
      <div class="cx-discovery-hint">${detail.discoveryHint}</div>
      ${detail.unlocked ? `
        <div class="cx-detail-block">
          <div class="cx-detail-label">현재 핵심 효과</div>
          <div class="cx-detail-copyline">${detail.effectText}</div>
        </div>
        <div class="cx-detail-block">
          <div class="cx-detail-label">레벨별 효과</div>
          <div class="cx-detail-level-groups">
            ${detail.levelGroups.map((group) => `
              <div class="cx-level-group">
                <div class="cx-level-group-label">${escapeHtml(group.label)}</div>
                <div class="cx-level-track">
                  ${group.levels.map((entry) => `
                    <div class="cx-level-chip">
                      <span class="cx-level-chip-kicker">${escapeHtml(entry.label)}</span>
                      <span class="cx-level-chip-value">${escapeHtml(entry.valueText)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="cx-detail-block">
        <div class="cx-detail-label">연결된 진화 무기</div>
        <div class="cx-detail-chip-row">
          ${detail.linkedWeapons.length > 0
            ? detail.linkedWeapons.map((entry) => `
                <button class="cx-link-chip" data-weapon-ref="${entry.resultWeaponId || entry.baseWeaponId}" type="button">
                  <span class="cx-link-icon">${entry.baseWeaponIcon}</span>
                  <span>${entry.baseWeaponName}</span>
                  <span class="cx-link-arrow">→</span>
                  <span class="cx-link-icon">${entry.resultWeaponIcon}</span>
                  <span>${entry.resultWeaponName}</span>
                </button>
              `).join('')
            : '<div class="cx-discovery-hint">이 장신구와 연결된 진화 무기가 없습니다.</div>'}
        </div>
      </div>
    </div>
  `;
}

export function renderCodexAccessoryTab({
  accessoryData = [],
  weaponEvolutionData = [],
  weaponData = [],
  session = null,
  search = '',
  rarityFilter = 'all',
  effectFilter = 'all',
  statusFilter = 'all',
  selectedAccessoryId = null,
}) {
  const unresolvedGrid = buildCodexAccessoryGridModel({
    accessoryData,
    weaponEvolutionData,
    session,
    search,
    rarityFilter,
    effectFilter,
    statusFilter,
    selectedAccessoryId,
  });
  const resolvedSelectedAccessoryId = selectedAccessoryId
    ?? unresolvedGrid.discoveredEntries[0]?.id
    ?? unresolvedGrid.lockedEntries[0]?.id
    ?? accessoryData[0]?.id
    ?? null;
  const grid = buildCodexAccessoryGridModel({
    accessoryData,
    weaponEvolutionData,
    session,
    search,
    rarityFilter,
    effectFilter,
    statusFilter,
    selectedAccessoryId: resolvedSelectedAccessoryId,
  });
  const detail = buildCodexAccessoryDetailModel({
    accessoryData,
    weaponEvolutionData,
    weaponData,
    session,
    selectedAccessoryId: resolvedSelectedAccessoryId,
  });

  return `
    <div class="cx-detail-layout">
      <div class="cx-detail-column">
        ${renderAccessoryDetail(detail)}
      </div>
      <div class="cx-list-column">
        ${renderAccessoryFilters(search, rarityFilter, effectFilter, statusFilter)}
        <div class="cx-summary-bar">
          <div>
            <div class="cx-summary-kicker">현재 보기</div>
            <div class="cx-summary-title">장신구 ${grid.summary.visibleCount}종</div>
          </div>
          <div class="cx-summary-metrics">
            <span class="cx-summary-chip">${grid.summary.statusLabel}</span>
            <span class="cx-summary-chip">발견 ${grid.summary.discoveredCount}</span>
            <span class="cx-summary-chip muted">미발견 ${grid.summary.lockedCount}</span>
          </div>
        </div>
        <p class="cx-section-label">발견한 장신구 · ${grid.discoveredEntries.length}종</p>
        <div class="cx-accessory-grid">
          ${grid.discoveredEntries.map((entry) => renderCodexAccessoryCard(entry)).join('')}
        </div>
        <p class="cx-section-label" style="margin-top:14px">미발견 장신구 · ${grid.lockedEntries.length}종</p>
        <div class="cx-accessory-grid">
          ${grid.lockedEntries.map((entry) => renderCodexAccessoryCard(entry)).join('')}
        </div>
      </div>
    </div>
  `;
}
