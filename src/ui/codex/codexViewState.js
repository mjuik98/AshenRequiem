/**
 * @typedef {object} CodexAccessoryState
 * @property {string} search
 * @property {string} rarityFilter
 * @property {string} effectFilter
 */

/**
 * @typedef {object} CodexViewState
 * @property {string} currentTier
 * @property {string} activeTab
 * @property {string | null} selectedEnemyId
 * @property {string | null} selectedWeaponId
 * @property {string | null} selectedAccessoryId
 * @property {CodexAccessoryState} accessory
 */

function createCodexAccessoryState() {
  return {
    search: '',
    rarityFilter: 'all',
    effectFilter: 'all',
  };
}

/**
 * @returns {CodexViewState}
 */
export function createCodexViewState() {
  return {
    currentTier: 'all',
    activeTab: 'enemy',
    selectedEnemyId: null,
    selectedWeaponId: null,
    selectedAccessoryId: null,
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
  state.accessory.search = nextState.accessory.search;
  state.accessory.rarityFilter = nextState.accessory.rarityFilter;
  state.accessory.effectFilter = nextState.accessory.effectFilter;
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
  state.currentTier = tier || 'all';
  state.selectedEnemyId = null;
  return state.currentTier;
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
 * @param {{ search?: string, rarityFilter?: string, effectFilter?: string }} [nextFilters={}]
 * @returns {CodexAccessoryState}
 */
export function updateCodexAccessoryFilters(state, {
  search,
  rarityFilter,
  effectFilter,
} = {}) {
  if (search !== undefined) state.accessory.search = search;
  if (rarityFilter !== undefined) state.accessory.rarityFilter = rarityFilter;
  if (effectFilter !== undefined) state.accessory.effectFilter = effectFilter;
  return state.accessory;
}
