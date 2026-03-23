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

function renderAccessoryFilters(search, rarityFilter, effectFilter) {
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
    <div class="cx-accessory-detail" id="cx-accessory-detail">
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
          <div class="cx-detail-lines">
            ${detail.levelLines.map((line) => `<div class="cx-detail-line">${line}</div>`).join('')}
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
  selectedAccessoryId = null,
}) {
  const grid = buildCodexAccessoryGridModel({
    accessoryData,
    weaponEvolutionData,
    session,
    search,
    rarityFilter,
    effectFilter,
    selectedAccessoryId,
  });
  const detail = buildCodexAccessoryDetailModel({
    accessoryData,
    weaponEvolutionData,
    weaponData,
    session,
    selectedAccessoryId: selectedAccessoryId ?? grid.entries[0]?.id ?? accessoryData[0]?.id ?? null,
  });

  return `
    ${renderAccessoryFilters(search, rarityFilter, effectFilter)}
    <p class="cx-section-label">장신구 · ${grid.entries.length}종</p>
    <div class="cx-accessory-grid">
      ${grid.entries.map((entry) => renderCodexAccessoryCard(entry)).join('')}
    </div>
    ${renderAccessoryDetail(detail)}
  `;
}
