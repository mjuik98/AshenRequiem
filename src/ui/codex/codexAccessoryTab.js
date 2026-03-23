import {
  buildAccessoryCurrentDesc,
  buildAccessoryLevelDesc,
} from '../../data/accessoryData.js';
import { isCodexAccessoryUnlocked } from './codexRecords.js';

const ACCESSORY_RARITY_LABEL = {
  common: '일반',
  rare: '희귀',
};

const EFFECT_CATEGORY_LABEL = {
  all: '전체',
  offense: '전투',
  sustain: '생존',
  utility: '유틸',
};

const OFFENSE_STATS = new Set([
  'damageMult',
  'cooldownMult',
  'projectileSpeedMult',
  'projectileSizeMult',
  'projectileLifetimeMult',
  'critChance',
  'critMultiplier',
  'bonusProjectileCount',
]);
const SUSTAIN_STATS = new Set([
  'maxHp',
  'lifesteal',
  'invincibleDuration',
]);

function getAccessoryEffectText(accessory) {
  const lines = buildAccessoryCurrentDesc(accessory, 1);
  return lines[0] ?? accessory?.description ?? '';
}

function getAccessoryEffectCategory(accessory) {
  const effects = accessory?.effects ?? [];
  if (effects.some((effect) => OFFENSE_STATS.has(effect?.stat))) return 'offense';
  if (effects.some((effect) => SUSTAIN_STATS.has(effect?.stat))) return 'sustain';
  return 'utility';
}

function isCatalystAccessory(accessoryId, weaponEvolutionData = []) {
  return weaponEvolutionData.some((recipe) => (recipe?.requires?.accessoryIds ?? []).includes(accessoryId));
}

function resolveWeaponById(weaponData = [], weaponId) {
  return weaponData.find((weapon) => weapon?.id === weaponId) ?? null;
}

function buildLinkedWeapons(accessory, weaponEvolutionData = [], weaponData = []) {
  return weaponEvolutionData
    .filter((recipe) => (recipe?.requires?.accessoryIds ?? []).includes(accessory?.id))
    .map((recipe) => {
      const baseWeapon = resolveWeaponById(weaponData, recipe?.requires?.weaponId);
      const resultWeapon = resolveWeaponById(weaponData, recipe?.resultWeaponId);
      return {
        recipeId: recipe?.id ?? `${accessory?.id}:${recipe?.resultWeaponId ?? 'weapon'}`,
        baseWeaponId: recipe?.requires?.weaponId ?? '',
        baseWeaponName: baseWeapon?.name ?? recipe?.requires?.weaponId ?? '무기',
        baseWeaponIcon: baseWeapon?.icon ?? '⚔',
        resultWeaponId: recipe?.resultWeaponId ?? '',
        resultWeaponName: resultWeapon?.name ?? recipe?.resultWeaponId ?? '진화 무기',
        resultWeaponIcon: resultWeapon?.icon ?? '✶',
      };
    });
}

function createDiscoveryHint(unlocked) {
  return unlocked
    ? '런 중 한 번이라도 획득하면 도감에 유지됩니다.'
    : '런 중 획득 시 기록됩니다.';
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function buildCodexAccessoryCardModel({
  accessory,
  session = null,
  weaponEvolutionData = [],
  selectedAccessoryId = null,
}) {
  const unlocked = isCodexAccessoryUnlocked(accessory, session);
  const effectCategory = getAccessoryEffectCategory(accessory);
  return {
    id: accessory.id,
    name: accessory.name,
    unlocked,
    isSelected: selectedAccessoryId === accessory.id,
    icon: accessory.icon ?? '◈',
    rarity: accessory.rarity ?? 'common',
    rarityLabel: ACCESSORY_RARITY_LABEL[accessory.rarity] ?? accessory.rarity ?? '일반',
    maxLevel: accessory.maxLevel ?? 5,
    effectText: getAccessoryEffectText(accessory),
    effectCategory,
    effectCategoryLabel: EFFECT_CATEGORY_LABEL[effectCategory] ?? effectCategory,
    isCatalyst: isCatalystAccessory(accessory?.id, weaponEvolutionData),
    discoveryHint: createDiscoveryHint(unlocked),
  };
}

export function buildCodexAccessoryGridModel({
  accessoryData = [],
  weaponEvolutionData = [],
  session = null,
  search = '',
  rarityFilter = 'all',
  effectFilter = 'all',
  selectedAccessoryId = null,
}) {
  const normalizedSearch = String(search ?? '').trim().toLowerCase();
  const entries = accessoryData
    .map((accessory) => buildCodexAccessoryCardModel({
      accessory,
      session,
      weaponEvolutionData,
      selectedAccessoryId,
    }))
    .filter((entry) => {
      const matchesSearch = !normalizedSearch
        || entry.name.toLowerCase().includes(normalizedSearch)
        || entry.effectText.toLowerCase().includes(normalizedSearch);
      const matchesRarity = rarityFilter === 'all'
        || (rarityFilter === 'catalyst' ? entry.isCatalyst : entry.rarity === rarityFilter);
      const matchesEffect = effectFilter === 'all' || entry.effectCategory === effectFilter;
      return matchesSearch && matchesRarity && matchesEffect;
    });

  return {
    entries,
    search,
    rarityFilter,
    effectFilter,
  };
}

export function buildCodexAccessoryDetailModel({
  accessoryData = [],
  weaponEvolutionData = [],
  weaponData = [],
  session = null,
  selectedAccessoryId = null,
}) {
  const accessory = accessoryData.find((entry) => entry?.id === selectedAccessoryId) ?? accessoryData[0] ?? null;
  if (!accessory) return null;

  const card = buildCodexAccessoryCardModel({
    accessory,
    session,
    weaponEvolutionData,
    selectedAccessoryId: accessory.id,
  });

  return {
    ...card,
    displayName: card.unlocked ? accessory.name : '???',
    levelLines: card.unlocked ? buildAccessoryLevelDesc(accessory) : [],
    linkedWeapons: buildLinkedWeapons(accessory, weaponEvolutionData, weaponData),
    discoveryHint: createDiscoveryHint(card.unlocked),
    description: card.unlocked ? accessory.description ?? '' : '아직 발견하지 못한 장신구입니다.',
  };
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
