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
  updateCodexEnemyFilters,
  updateCodexWeaponFilters,
  updateCodexAccessoryFilters,
} from './codexViewState.js';
import { renderCodexWeaponTab } from './codexWeaponRender.js';
import { renderCodexRecordsTab } from './codexRecordsTab.js';

function revealCodexDetailPanel(panel, selector) {
  const detail = /** @type {HTMLElement | null} */ (panel.querySelector(selector));
  if (!detail) return;
  detail.focus?.();
  detail.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
}

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
    const summary = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-summary'));
    const grid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-grid'));
    const lockedGrid = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-grid-locked'));
    const lockedLabel = /** @type {HTMLElement | null} */ (panel.querySelector('#cx-enemy-locked-label'));
    const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
    if (!label || !summary || !grid || !lockedGrid || !lockedLabel) return;

    const model = buildCodexEnemyGridModel({
      enemyData: gameData?.enemyData ?? [],
      session,
      currentTier: state.enemy.tierFilter,
      selectedEnemyId: state.selectedEnemyId,
      search: search ?? state.enemy.search,
      statusFilter: state.enemy.statusFilter,
    });

    state.selectedEnemyId = model.summary.selectedId;
    label.textContent = `${model.tierText} 적 ${model.summary.visibleCount}종`;
    summary.innerHTML = `
      <span class="cx-summary-chip">${model.summary.statusLabel}</span>
      <span class="cx-summary-chip">발견 ${model.summary.discoveredCount}</span>
      <span class="cx-summary-chip muted">미발견 ${model.summary.undiscoveredCount}</span>
    `;
    grid.innerHTML = renderCodexEnemyGrid({ entries: model.discoveredEntries });
    lockedGrid.innerHTML = renderCodexEnemyGrid({ entries: model.undiscoveredEntries });
    lockedLabel.style.display = model.undiscoveredEntries.length > 0 ? '' : 'none';
    lockedGrid.style.display = model.undiscoveredEntries.length > 0 ? '' : 'none';

    const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-ecard'));
    bindCodexSelectableCards(cards, 'id', (enemyId) => {
      toggleCodexSelection(state, 'enemy', enemyId);
      refreshGrid(searchInput?.value ?? '');
      revealCodexDetailPanel(panel, '#cx-enemy-detail-card');
    });

    renderDetail();
  };

  panel.innerHTML = renderCodexEnemyTabShell();

  const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-enemy-search'));
  if (searchInput) {
    searchInput.value = state.enemy.search;
  }
  searchInput?.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    updateCodexEnemyFilters(state, { search: target.value });
    refreshGrid(target.value);
  });

  const tierButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
  tierButtons.forEach((button) => {
    button.classList.toggle('active', (button.dataset.tier ?? 'all') === state.enemy.tierFilter);
  });
  bindCodexButtonGroup(tierButtons, 'tier', (_tier, button) => {
    setCodexEnemyTier(state, button.dataset.tier ?? 'all');
    tierButtons.forEach((candidate) => candidate.classList.remove('active'));
    button.classList.add('active');
    refreshGrid(state.enemy.search);
  });

  const statusButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-sf'));
  statusButtons.forEach((button) => {
    button.classList.toggle('active', (button.dataset.statusFilter ?? 'all') === state.enemy.statusFilter);
  });
  bindCodexButtonGroup(statusButtons, 'statusFilter', (statusFilter, button) => {
    updateCodexEnemyFilters(state, { statusFilter });
    statusButtons.forEach((candidate) => candidate.classList.remove('active'));
    button.classList.add('active');
    refreshGrid(state.enemy.search);
  });

  refreshGrid(state.enemy.search);
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
    search: state.weapon.search,
    typeFilter: state.weapon.typeFilter,
    statusFilter: state.weapon.statusFilter,
    selectedWeaponId: state.selectedWeaponId,
  });

  const searchInput = /** @type {HTMLInputElement | null} */ (panel.querySelector('#cx-weapon-search'));
  searchInput?.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    updateCodexWeaponFilters(state, { search: target.value });
    renderCodexWeaponPanel(root, { state, gameData, session, onAccessoryRef });
  });

  const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-wcard'));
  bindCodexSelectableCards(cards, 'wid', (weaponId) => {
    toggleCodexSelection(state, 'weapon', weaponId);
    renderCodexWeaponPanel(root, { state, gameData, session, onAccessoryRef });
    revealCodexDetailPanel(panel, '#cx-weapon-detail');
  });

  const typeButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-tf'));
  bindCodexButtonGroup(typeButtons, 'wtype', (typeFilter) => {
    updateCodexWeaponFilters(state, { typeFilter });
    renderCodexWeaponPanel(root, { state, gameData, session, onAccessoryRef });
  });

  const statusButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-sf'));
  bindCodexButtonGroup(statusButtons, 'wstatus', (statusFilter) => {
    updateCodexWeaponFilters(state, { statusFilter });
    renderCodexWeaponPanel(root, { state, gameData, session, onAccessoryRef });
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
    statusFilter: state.accessory.statusFilter,
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

  const statusButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (panel.querySelectorAll('.cx-sf'));
  bindCodexButtonGroup(statusButtons, 'statusFilter', (statusFilter) => {
    updateCodexAccessoryFilters(state, { statusFilter });
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
  });

  const cards = /** @type {NodeListOf<HTMLElement>} */ (panel.querySelectorAll('.cx-acard'));
  bindCodexSelectableCards(cards, 'aid', (accessoryId) => {
    toggleCodexSelection(state, 'accessory', accessoryId);
    renderCodexAccessoryPanel(root, { state, gameData, session, onWeaponRef });
    revealCodexDetailPanel(panel, '#cx-accessory-detail');
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
