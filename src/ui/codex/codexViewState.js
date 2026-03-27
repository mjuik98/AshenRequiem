/**
 * @typedef {object} CodexEnemyState
 * @property {string} search
 * @property {string} tierFilter
 * @property {string} statusFilter
 */

/**
 * @typedef {object} CodexWeaponState
 * @property {string} search
 * @property {string} typeFilter
 * @property {string} statusFilter
 */

/**
 * @typedef {object} CodexAccessoryState
 * @property {string} search
 * @property {string} rarityFilter
 * @property {string} effectFilter
 * @property {string} statusFilter
 */

/**
 * @typedef {object} CodexViewState
 * @property {string} currentTier
 * @property {string} activeTab
 * @property {string | null} selectedEnemyId
 * @property {string | null} selectedWeaponId
 * @property {string | null} selectedAccessoryId
 * @property {CodexEnemyState} enemy
 * @property {CodexWeaponState} weapon
 * @property {CodexAccessoryState} accessory
 */

function createCodexEnemyState() {
  return {
    search: '',
    tierFilter: 'all',
    statusFilter: 'all',
  };
}

function createCodexWeaponState() {
  return {
    search: '',
    typeFilter: 'all',
    statusFilter: 'all',
  };
}

function createCodexAccessoryState() {
  return {
    search: '',
    rarityFilter: 'all',
    effectFilter: 'all',
    statusFilter: 'all',
  };
}

/**
 * @returns {CodexViewState}
 */
export function createCodexViewState() {
  const enemy = createCodexEnemyState();
  return {
    currentTier: enemy.tierFilter,
    activeTab: 'enemy',
    selectedEnemyId: null,
    selectedWeaponId: null,
    selectedAccessoryId: null,
    enemy,
    weapon: createCodexWeaponState(),
    accessory: createCodexAccessoryState(),
  };
}

/**
 * @param {CodexViewState} state
 * @returns {CodexViewState}
 */
export function resetCodexViewState(state) {
  const nextState = createCodexViewState();
  state.currentTier = nextState.currentTier;
  state.activeTab = nextState.activeTab;
  state.selectedEnemyId = nextState.selectedEnemyId;
  state.selectedWeaponId = nextState.selectedWeaponId;
  state.selectedAccessoryId = nextState.selectedAccessoryId;
  state.enemy.search = nextState.enemy.search;
  state.enemy.tierFilter = nextState.enemy.tierFilter;
  state.enemy.statusFilter = nextState.enemy.statusFilter;
  state.weapon.search = nextState.weapon.search;
  state.weapon.typeFilter = nextState.weapon.typeFilter;
  state.weapon.statusFilter = nextState.weapon.statusFilter;
  state.accessory.search = nextState.accessory.search;
  state.accessory.rarityFilter = nextState.accessory.rarityFilter;
  state.accessory.effectFilter = nextState.accessory.effectFilter;
  state.accessory.statusFilter = nextState.accessory.statusFilter;
  return state;
}

/**
 * @param {CodexViewState} state
 * @param {string} [tabName='enemy']
 * @returns {string}
 */
export function setCodexActiveTab(state, tabName = 'enemy') {
  state.activeTab = tabName || 'enemy';
  return state.activeTab;
}

/**
 * @param {CodexViewState} state
 * @param {string} [tier='all']
 * @returns {string}
 */
export function setCodexEnemyTier(state, tier = 'all') {
  state.enemy.tierFilter = tier || 'all';
  state.currentTier = state.enemy.tierFilter;
  state.selectedEnemyId = null;
  return state.enemy.tierFilter;
}

/**
 * @param {CodexViewState} state
 * @param {'enemy' | 'weapon' | 'accessory'} kind
 * @param {string} id
 * @returns {string | null}
 */
export function toggleCodexSelection(state, kind, id) {
  const fieldName = kind === 'enemy'
    ? 'selectedEnemyId'
    : kind === 'weapon'
      ? 'selectedWeaponId'
      : 'selectedAccessoryId';
  state[fieldName] = state[fieldName] === id ? null : id;
  return state[fieldName];
}

/**
 * @param {CodexViewState} state
 * @param {{ search?: string, tierFilter?: string, statusFilter?: string }} [nextFilters={}]
 * @returns {CodexEnemyState}
 */
export function updateCodexEnemyFilters(state, {
  search,
  tierFilter,
  statusFilter,
} = {}) {
  if (search !== undefined) state.enemy.search = search;
  if (tierFilter !== undefined) {
    state.enemy.tierFilter = tierFilter;
    state.currentTier = state.enemy.tierFilter;
  }
  if (statusFilter !== undefined) state.enemy.statusFilter = statusFilter;
  return state.enemy;
}

/**
 * @param {CodexViewState} state
 * @param {{ search?: string, typeFilter?: string, statusFilter?: string }} [nextFilters={}]
 * @returns {CodexWeaponState}
 */
export function updateCodexWeaponFilters(state, {
  search,
  typeFilter,
  statusFilter,
} = {}) {
  if (search !== undefined) state.weapon.search = search;
  if (typeFilter !== undefined) state.weapon.typeFilter = typeFilter;
  if (statusFilter !== undefined) state.weapon.statusFilter = statusFilter;
  return state.weapon;
}

/**
 * @param {CodexViewState} state
 * @param {{ search?: string, rarityFilter?: string, effectFilter?: string, statusFilter?: string }} [nextFilters={}]
 * @returns {CodexAccessoryState}
 */
export function updateCodexAccessoryFilters(state, {
  search,
  rarityFilter,
  effectFilter,
  statusFilter,
} = {}) {
  if (search !== undefined) state.accessory.search = search;
  if (rarityFilter !== undefined) state.accessory.rarityFilter = rarityFilter;
  if (effectFilter !== undefined) state.accessory.effectFilter = effectFilter;
  if (statusFilter !== undefined) state.accessory.statusFilter = statusFilter;
  return state.accessory;
}
