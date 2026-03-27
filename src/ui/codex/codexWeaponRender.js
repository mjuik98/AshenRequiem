import {
  buildCodexWeaponCollectionModel,
  buildCodexWeaponDetailModel,
} from './codexWeaponModel.js';

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderWeaponFilters(search, typeFilter, statusFilter) {
  const typeFilters = [
    ['all', '전체'],
    ['base', '기본'],
    ['evolved', '진화'],
  ];
  const statusFilters = [
    ['all', '전체 상태'],
    ['discovered', '발견'],
    ['locked', '미발견'],
  ];

  return `
    <div class="cx-search-row">
      <input class="cx-search" id="cx-weapon-search" placeholder="무기 이름 또는 분류 검색..." aria-label="무기 검색" value="${escapeAttribute(search)}">
      <div class="cx-tier-filter">
        ${typeFilters.map(([value, label]) => `
          <button class="cx-tf${typeFilter === value ? ' active' : ''}" data-wtype="${value}" type="button">${label}</button>
        `).join('')}
      </div>
      <div class="cx-tier-filter">
        ${statusFilters.map(([value, label]) => `
          <button class="cx-sf${statusFilter === value ? ' active' : ''}" data-wstatus="${value}" type="button">${label}</button>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderCodexWeaponDetail(detail) {
  if (!detail) return '';

  return `
    <div class="cx-detail" id="cx-weapon-detail" role="region" tabindex="-1" aria-label="선택한 무기 상세 정보">
      <div class="cx-detail-kicker">선택한 무기</div>
      <div class="cx-detail-hero">
        <div class="cx-detail-icon">${detail.icon}</div>
        <div class="cx-detail-copy">
          <div class="cx-detail-name">${detail.name}</div>
          <div class="cx-detail-subline">
            <span class="cx-ararity ${detail.isEvolved ? 'rare' : 'common'}">${detail.isEvolved ? '진화 무기' : '기본 무기'}</span>
            <span class="cx-alevel">Lv.${detail.maxLevel}</span>
          </div>
          <div class="cx-summary-inline">
            ${detail.summaryChips.map((chip) => `<span class="cx-summary-chip">${chip}</span>`).join('')}
          </div>
          <div class="cx-detail-desc">${detail.description || '무기 설명이 아직 준비되지 않았습니다.'}</div>
        </div>
      </div>
      <div class="cx-discovery-hint">${detail.discoveryHint}</div>
      <div class="cx-dstat-grid">
        ${detail.detailStats.map((entry) => `
          <div class="cx-dstat"><div class="v">${entry.value}</div><div class="k">${entry.label}</div></div>
        `).join('')}
      </div>
      ${detail.recipeText ? `
        <div class="cx-detail-block">
          <div class="cx-detail-label">진화 조건</div>
          <div class="cx-detail-copyline">${detail.recipeText}</div>
          ${detail.recipeAccessories.length > 0 ? `
            <div class="cx-wreq-chips" style="margin-top:10px">
              ${detail.recipeAccessories.map((accessory) => `
                <button class="cx-req-chip" type="button" data-accessory-ref="${accessory.id}">
                  <span class="cx-req-icon">${accessory.icon}</span>
                  <span>${accessory.name}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderCodexWeaponCard(card) {
  return `
    <div class="cx-wcard ${card.isEvolved ? 'evolved' : ''} ${!card.unlocked ? 'locked' : ''} ${card.isSelected ? 'selected' : ''}"
         data-wid="${card.id}" data-kind="${card.isEvolved ? 'evolved' : 'base'}" role="button" tabindex="0" aria-label="${card.name} 상세 보기">
      <div class="cx-whead">
        <div class="cx-wicon">${card.icon}</div>
        <div>
          <div class="cx-wname">${card.name}</div>
          <div class="cx-wtype">${card.typeLabel}</div>
        </div>
      </div>
      ${card.unlocked ? `
        <div class="cx-wbar-row"><span class="cx-wbar-lbl">공격력</span>
          <div class="cx-wbar-track"><div class="cx-wbar-fill" style="width:${card.dmgPct}%;background:#ef5350"></div></div>
        </div>
        <div class="cx-wbar-row"><span class="cx-wbar-lbl">공격속도</span>
          <div class="cx-wbar-track"><div class="cx-wbar-fill" style="width:${card.cdPct}%;background:#42a5f5"></div></div>
        </div>
        ${card.recipeText ? `
          <div class="cx-wrequires">${card.recipeText}</div>
          ${card.recipeAccessories.length > 0 ? `
            <div class="cx-wreq-chips">
              ${card.recipeAccessories.map((accessory) => `
                <button class="cx-req-chip" type="button" data-accessory-ref="${accessory.id}">
                  <span class="cx-req-icon">${accessory.icon}</span>
                  <span>${accessory.name}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        ` : ''}
      ` : `<div class="cx-wlocked">아직 미발견</div>`}
    </div>
  `;
}

export function renderCodexWeaponTab({
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  search = '',
  typeFilter = 'all',
  statusFilter = 'all',
  selectedWeaponId = null,
}) {
  const unresolvedCollection = buildCodexWeaponCollectionModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    search,
    typeFilter,
    statusFilter,
    selectedWeaponId,
  });
  const resolvedSelectedWeaponId = unresolvedCollection.summary.selectedId;
  const collection = buildCodexWeaponCollectionModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    search,
    typeFilter,
    statusFilter,
    selectedWeaponId: resolvedSelectedWeaponId,
  });
  const detail = buildCodexWeaponDetailModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId: resolvedSelectedWeaponId,
  });

  return `
    <div class="cx-detail-layout">
      <div class="cx-detail-column">
        ${renderCodexWeaponDetail(detail)}
      </div>
      <div class="cx-list-column">
        ${renderWeaponFilters(search, typeFilter, statusFilter)}
        <div class="cx-summary-bar">
          <div>
            <div class="cx-summary-kicker">현재 보기</div>
            <div class="cx-summary-title">${collection.summary.typeLabel} 무기 ${collection.summary.visibleCount}종</div>
          </div>
          <div class="cx-summary-metrics">
            <span class="cx-summary-chip">${collection.summary.statusLabel}</span>
            <span class="cx-summary-chip">발견 ${collection.summary.discoveredCount}</span>
            <span class="cx-summary-chip muted">미발견 ${collection.summary.lockedCount}</span>
          </div>
        </div>
        <p class="cx-section-label">발견한 무기 · ${collection.discoveredEntries.length}종</p>
        <div class="cx-weapon-grid" id="cx-wgrid-unlocked">
          ${collection.discoveredEntries.map((card) => renderCodexWeaponCard(card)).join('')}
        </div>
        <p class="cx-section-label" style="margin-top:14px">미발견 무기 · ${collection.lockedEntries.length}종</p>
        <div class="cx-weapon-grid" id="cx-wgrid-locked">
          ${collection.lockedEntries.map((card) => renderCodexWeaponCard(card)).join('')}
        </div>
      </div>
    </div>
  `;
}
