import {
  buildCodexEnemyDetailModel,
  buildCodexEnemyGridModel,
  renderCodexEnemyDetail,
  renderCodexEnemyGrid,
  renderCodexEnemyTabShell,
} from './codexEnemyTab.js';
import { renderCodexAccessoryTab } from './codexAccessoryTab.js';
import {
  bindCodexButtonGroup,
  bindCodexSelectableCards,
} from './codexViewBindings.js';
import {
  setCodexEnemyTier,
  toggleCodexSelection,
  updateCodexAccessoryFilters,
} from './codexViewState.js';
import { renderCodexWeaponTab } from './codexWeaponTab.js';
import { renderCodexRecordsTab } from './codexRecordsTab.js';

export function renderCodexEnemyPanel(root, { state, gameData, session }) {
  const panel = /** @type {HTMLElement | null} */ (root.querySelector('#cx-tab-enemy'));
  if (!panel) return;

  const renderDetail = () => {
    const detailRoot = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-detail'));
    if (!detailRoot) return;

    const model = buildCodexEnemyDetailModel({
      enemyData: gameData?.enemyData ?? [],
      session,
      selectedEnemyId: state.selectedEnemyId,
    });

    detailRoot.innerHTML = renderCodexEnemyDetail(model);
  };

  const refreshGrid = (search) => {
    const label = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-label'));
    const grid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-grid'));
    const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
    if (!label || !grid) return;

    const model = buildCodexEnemyGridModel({
      enemyData: gameData?.enemyData ?? [],
      session,
      currentTier: state.currentTier,
      selectedEnemyId: state.selectedEnemyId,
      search,
    });

    label.textContent = `${model.tierText} · ${model.entries.length}종`;
    grid.innerHTML = renderCodexEnemyGrid(model);

    const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-ecard'));
    bindCodexSelectableCards(cards, 'id', (enemyId) => {
      toggleCodexSelection(state, 'enemy', enemyId);
      refreshGrid(searchInput?.value ?? '');
    });

    renderDetail();
  };

  panel.innerHTML = renderCodexEnemyTabShell();

  const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
  searchInput?.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    refreshGrid(target.value);
  });

  const tierButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
  bindCodexButtonGroup(tierButtons, 'tier', (_tier, button) => {
    setCodexEnemyTier(state, button.dataset.tier ?? 'all');
    tierButtons.forEach((candidate) => candidate.classList.remove('active'));
    button.classList.add('active');
    if (searchInput) searchInput.value = '';
    refreshGrid('');
  });

  refreshGrid('');
}

export function renderCodexWeaponPanel(root, {
  state,
  gameData,
  session,
  onAccessoryRef,
}) {
  const panel = /** @type {HTMLElement | null} */ (root.querySelector('#cx-tab-weapon'));
  if (!panel) return;

  panel.innerHTML = renderCodexWeaponTab({
    weaponData: gameData?.weaponData ?? [],
    session,
    weaponEvolutionData: gameData?.weaponEvolutionData ?? [],
    accessoryData: gameData?.accessoryData ?? [],
    selectedWeaponId: state.selectedWeaponId,
  });

  const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-wcard'));
  bindCodexSelectableCards(cards, 'wid', (weaponId) => {
    toggleCodexSelection(state, 'weapon', weaponId);
    renderCodexWeaponPanel(root, { state, gameData, session, onAccessoryRef });
  });

  const typeButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
  const baseGrid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-wgrid-base'));
  const evolvedGrid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-wgrid-evo'));
  bindCodexButtonGroup(typeButtons, 'wtype', (type, button) => {
    typeButtons.forEach((candidate) => candidate.classList.remove('active'));
    button.classList.add('active');
    if (baseGrid) baseGrid.style.display = type === 'all' || type === 'normal' ? '' : 'none';
    if (evolvedGrid) evolvedGrid.style.display = type === 'all' || type === 'evolved' ? '' : 'none';
  });

  const recipeButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('[data-accessory-ref]'));
  bindCodexButtonGroup(recipeButtons, 'accessoryRef', (accessoryId) => {
    onAccessoryRef(accessoryId);
  }, { stopPropagation: true });
}

export function renderCodexAccessoryPanel(root, {
  state,
  gameData,
  session,
  onWeaponRef,
}) {
  const panel = /** @type {HTMLElement | null} */ (root.querySelector('#cx-tab-accessory'));
  if (!panel) return;

  panel.innerHTML = renderCodexAccessoryTab({
    accessoryData: gameData?.accessoryData ?? [],
    weaponEvolutionData: gameData?.weaponEvolutionData ?? [],
    weaponData: gameData?.weaponData ?? [],
    session,
    search: state.accessory.search,
    rarityFilter: state.accessory.rarityFilter,
    effectFilter: state.accessory.effectFilter,
    selectedAccessoryId: state.selectedAccessoryId,
  });

  const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-accessory-search'));
  searchInput?.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    updateCodexAccessoryFilters(state, { search: target.value });
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
  });

  const rarityButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-af'));
  bindCodexButtonGroup(rarityButtons, 'afilter', (rarityFilter) => {
    updateCodexAccessoryFilters(state, { rarityFilter });
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
  });

  const effectButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-ef'));
  bindCodexButtonGroup(effectButtons, 'efilter', (effectFilter) => {
    updateCodexAccessoryFilters(state, { effectFilter });
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
  });

  const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-acard'));
  bindCodexSelectableCards(cards, 'aid', (accessoryId) => {
    toggleCodexSelection(state, 'accessory', accessoryId);
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
  });

  const linkedWeapons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('[data-weapon-ref]'));
  bindCodexButtonGroup(linkedWeapons, 'weaponRef', (weaponId) => {
    onWeaponRef(weaponId);
  });
}

export function renderCodexRecordsPanel(root, { session, gameData }) {
  const panel = /** @type {HTMLElement | null} */ (root.querySelector('#cx-tab-records'));
  if (!panel) return;

  panel.innerHTML = renderCodexRecordsTab({
    session,
    gameData,
  });
}
