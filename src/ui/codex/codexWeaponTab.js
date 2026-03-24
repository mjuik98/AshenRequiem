import { isCodexWeaponUnlocked } from './codexRecords.js';

export const CODEX_WEAPON_TYPE_LABEL = {
  targetProjectile: '직선 투사체',
  areaBurst: '범위 폭발',
  orbit: '궤도형',
  boomerang: '부메랑',
  chainLightning: '연쇄 번개',
  omnidirectional: '전방위',
  laserBeam: '광선',
  groundZone: '장판',
  ricochetProjectile: '도약 투사체',
};

export const CODEX_WEAPON_EMOJI = {
  targetProjectile: '🔵',
  orbit: '⚡',
  areaBurst: '✨',
  boomerang: '🪃',
  chainLightning: '⚡',
  omnidirectional: '🌀',
  laserBeam: '☄',
  groundZone: '◉',
  ricochetProjectile: '✦',
};

export function partitionCodexWeapons(weaponData = []) {
  return {
    baseWeapons: weaponData.filter((weapon) => !weapon.isEvolved),
    evolvedWeapons: weaponData.filter((weapon) => weapon.isEvolved),
  };
}

export function buildCodexWeaponCardModel({
  weapon,
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  selectedWeaponId = null,
}) {
  const unlocked = isCodexWeaponUnlocked(weapon, session);
  const recipe = weaponEvolutionData.find((entry) => (
    entry.resultWeaponId === weapon.id
    || entry?.requires?.weaponId === weapon.id
  ));
  const dmgPct = Math.min(100, (weapon.damage ?? 0) * 5);
  const cdPct = Math.round((1 - (((weapon.cooldown ?? 0.5) - 0.5) / 3.5)) * 100);
  const recipeAccessories = (recipe?.requires?.accessoryIds ?? []).map((accessoryId) => {
    const accessory = accessoryData.find((entry) => entry?.id === accessoryId);
    return {
      id: accessoryId,
      name: accessory?.name ?? accessoryId,
      icon: accessory?.icon ?? '◈',
    };
  });

  return {
    id: weapon.id,
    name: weapon.name,
    unlocked,
    isSelected: selectedWeaponId === weapon.id,
    isEvolved: weapon.isEvolved === true,
    icon: CODEX_WEAPON_EMOJI[weapon.behaviorId] ?? '⚔',
    typeLabel: CODEX_WEAPON_TYPE_LABEL[weapon.behaviorId] ?? weapon.behaviorId,
    dmgPct,
    cdPct,
    recipeText: recipe ? buildRecipeText(recipe, weaponData) : '',
    recipeAccessories,
  };
}

function buildRecipeText(recipe, weaponData = []) {
  const baseWeaponId = recipe?.requires?.weaponId ?? '';
  const baseWeaponName = weaponData.find((weapon) => weapon?.id === baseWeaponId)?.name ?? '기본 무기';
  return `${baseWeaponName} Lv.MAX + 장신구`;
}

export function buildCodexWeaponDetailModel({
  weaponData = [],
  session = null,
  weaponEvolutionData = [],
  accessoryData = [],
  selectedWeaponId = null,
}) {
  const selectedWeapon = weaponData.find((weapon) => weapon?.id === selectedWeaponId)
    ?? weaponData[0]
    ?? null;
  if (!selectedWeapon) return null;

  const card = buildCodexWeaponCardModel({
    weapon: selectedWeapon,
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId: selectedWeapon.id,
  });

  return {
    ...card,
    description: selectedWeapon.description ?? '',
    maxLevel: selectedWeapon.maxLevel ?? 1,
    detailStats: [
      { label: '공격력', value: String(selectedWeapon.damage ?? 0) },
      { label: '공격속도', value: `${card.cdPct}%` },
      { label: '분류', value: card.typeLabel },
      { label: '최대 레벨', value: `Lv.${selectedWeapon.maxLevel ?? 1}` },
    ],
  };
}

function renderCodexWeaponDetail(detail) {
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

function renderCodexWeaponCard(card) {
  return `
    <div class="cx-wcard ${card.isEvolved ? 'evolved' : ''} ${!card.unlocked ? 'locked' : ''} ${card.isSelected ? 'selected' : ''}"
         data-wid="${card.id}" role="button" tabindex="0" aria-label="${card.name} 상세 보기">
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
  const detail = buildCodexWeaponDetailModel({
    weaponData,
    session,
    weaponEvolutionData,
    accessoryData,
    selectedWeaponId: selectedWeaponId ?? baseWeapons[0]?.id ?? evolvedWeapons[0]?.id ?? null,
  });

  return `
    <div class="cx-search-row">
      <div class="cx-tier-filter">
        <button class="cx-tf active" data-wtype="all">전체</button>
        <button class="cx-tf" data-wtype="normal">기본</button>
        <button class="cx-tf" data-wtype="evolved">진화</button>
      </div>
    </div>
    <p class="cx-section-label">기본 무기 · ${baseWeapons.length}종</p>
    <div class="cx-weapon-grid" id="cx-wgrid-base">
      ${baseWeapons.map((weapon) => renderCodexWeaponCard(buildCodexWeaponCardModel({
        weapon,
        weaponData,
        session,
        weaponEvolutionData,
        accessoryData,
        selectedWeaponId,
      }))).join('')}
    </div>
    <p class="cx-section-label" style="margin-top:14px">진화 무기 · ${evolvedWeapons.length}종</p>
    <div class="cx-weapon-grid" id="cx-wgrid-evo">
      ${evolvedWeapons.map((weapon) => renderCodexWeaponCard(buildCodexWeaponCardModel({
        weapon,
        weaponData,
        session,
        weaponEvolutionData,
        accessoryData,
        selectedWeaponId,
      }))).join('')}
    </div>
    ${renderCodexWeaponDetail(detail)}
  `;
}
