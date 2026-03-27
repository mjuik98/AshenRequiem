import {
  buildCodexWeaponCardModel,
  buildCodexWeaponDetailModel,
  partitionCodexWeapons,
} from './codexWeaponModel.js';

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
         data-wid="${card.id}" data-kind="${card.isEvolved ? 'evolved' : 'normal'}" role="button" tabindex="0" aria-label="${card.name} 상세 보기">
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
  selectedWeaponId = null,
}) {
  const { baseWeapons, evolvedWeapons } = partitionCodexWeapons(weaponData);
  const allCards = [...baseWeapons, ...evolvedWeapons].map((weapon) => buildCodexWeaponCardModel({
    weapon,
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId,
  }));
  const resolvedSelectedWeaponId = selectedWeaponId
    ?? allCards.find((weapon) => weapon.unlocked)?.id
    ?? allCards[0]?.id
    ?? null;
  const cards = [...baseWeapons, ...evolvedWeapons].map((weapon) => buildCodexWeaponCardModel({
    weapon,
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId: resolvedSelectedWeaponId,
  }));
  const unlockedCards = cards.filter((card) => card.unlocked);
  const lockedCards = cards.filter((card) => !card.unlocked);
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
        <div class="cx-search-row">
          <div class="cx-tier-filter">
            <button class="cx-tf active" data-wtype="all">전체</button>
            <button class="cx-tf" data-wtype="normal">기본</button>
            <button class="cx-tf" data-wtype="evolved">진화</button>
          </div>
        </div>
        <div class="cx-summary-bar">
          <div>
            <div class="cx-summary-kicker">현재 보기</div>
            <div class="cx-summary-title">무기 ${cards.length}종</div>
          </div>
          <div class="cx-summary-metrics">
            <span class="cx-summary-chip">발견 ${unlockedCards.length}</span>
            <span class="cx-summary-chip muted">미발견 ${lockedCards.length}</span>
          </div>
        </div>
        <p class="cx-section-label">발견한 무기 · ${unlockedCards.length}종</p>
        <div class="cx-weapon-grid" id="cx-wgrid-unlocked">
          ${unlockedCards.map((card) => renderCodexWeaponCard(card)).join('')}
        </div>
        <p class="cx-section-label" style="margin-top:14px">미발견 무기 · ${lockedCards.length}종</p>
        <div class="cx-weapon-grid" id="cx-wgrid-locked">
          ${lockedCards.map((card) => renderCodexWeaponCard(card)).join('')}
        </div>
      </div>
    </div>
  `;
}
