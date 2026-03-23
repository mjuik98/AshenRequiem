import { isCodexWeaponUnlocked } from './codexRecords.js';

export const CODEX_WEAPON_TYPE_LABEL = {
  targetProjectile: '투사체',
  areaBurst: '폭발형',
  orbit: '궤도형',
  boomerang: '부메랑',
  chainLightning: '연쇄',
  omnidirectional: '전방향',
};

export const CODEX_WEAPON_EMOJI = {
  targetProjectile: '🔵',
  orbit: '⚡',
  areaBurst: '✨',
  boomerang: '🪃',
  chainLightning: '⚡',
  omnidirectional: '🌀',
};

export function partitionCodexWeapons(weaponData = []) {
  return {
    baseWeapons: weaponData.filter((weapon) => !weapon.isEvolved),
    evolvedWeapons: weaponData.filter((weapon) => weapon.isEvolved),
  };
}

export function buildCodexWeaponCardModel({
  weapon,
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
    recipeText: recipe
      ? `${recipe.requires?.weaponId ?? ''} Lv.MAX + 장신구`
      : '',
    recipeAccessories,
  };
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
        <div class="cx-wbar-row"><span class="cx-wbar-lbl">DMG</span>
          <div class="cx-wbar-track"><div class="cx-wbar-fill" style="width:${card.dmgPct}%;background:#ef5350"></div></div>
        </div>
        <div class="cx-wbar-row"><span class="cx-wbar-lbl">속도</span>
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
        session,
        weaponEvolutionData,
        accessoryData,
        selectedWeaponId,
      }))).join('')}
    </div>
  `;
}
