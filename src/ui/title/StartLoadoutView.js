import { bindStartLoadoutInteractions } from './startLoadoutInteractions.js';
import { renderStartLoadoutMarkup } from './startLoadoutMarkup.js';
import { ensureStartLoadoutStyles } from './startLoadoutStyles.js';
import { bindDialogRuntime } from '../shared/dialogRuntime.js';

export class StartLoadoutView {
  constructor(container) {
    this._container = container;
    this._el = document.createElement('div');
    this._el.className = 'sl-root';
    this._el.style.display = 'none';
    this._selectedWeaponId = null;
    this._selectedAscensionLevel = 0;
    this._selectedStartAccessoryId = null;
    this._selectedArchetypeId = 'vanguard';
    this._selectedRiskRelicId = null;
    this._selectedStageId = 'ash_plains';
    this._selectedSeedMode = 'none';
    this._selectedSeedText = '';
    this._canStart = false;
    this._weapons = [];
    this._accessories = [];
    this._archetypes = [];
    this._riskRelics = [];
    this._ascensionChoices = [];
    this._stages = [];
    this._seedPreviewText = '';
    this._recommendedGoals = [];
    this._onStart = null;
    this._onCancel = null;
    this._dialogRuntime = null;
    ensureStartLoadoutStyles();
    container.appendChild(this._el);
  }

  show({
    weapons = [],
    accessories = [],
    archetypes = [],
    riskRelics = [],
    selectedWeaponId = null,
    ascensionChoices = [],
    selectedAscensionLevel = 0,
    selectedStartAccessoryId = null,
    selectedArchetypeId = 'vanguard',
    selectedRiskRelicId = null,
    stages = [],
    selectedStageId = 'ash_plains',
    selectedSeedMode = 'none',
    selectedSeedText = '',
    seedPreviewText = '',
    recommendedGoals = [],
    canStart = false,
    onStart,
    onCancel,
  }) {
    this._weapons = weapons;
    this._accessories = accessories;
    this._archetypes = archetypes;
    this._riskRelics = riskRelics;
    this._ascensionChoices = ascensionChoices;
    this._stages = stages;
    this._selectedWeaponId = weapons.some((weapon) => weapon?.id === selectedWeaponId)
      ? selectedWeaponId
      : weapons[0]?.id ?? null;
    this._selectedStartAccessoryId = accessories.some((accessory) => accessory?.id === selectedStartAccessoryId)
      ? selectedStartAccessoryId
      : null;
    this._selectedArchetypeId = archetypes.some((entry) => entry?.id === selectedArchetypeId)
      ? selectedArchetypeId
      : archetypes[0]?.id ?? 'vanguard';
    this._selectedRiskRelicId = riskRelics.some((entry) => entry?.id === selectedRiskRelicId)
      ? selectedRiskRelicId
      : null;
    this._selectedAscensionLevel = ascensionChoices.some((choice) => choice?.level === selectedAscensionLevel)
      ? selectedAscensionLevel
      : ascensionChoices[0]?.level ?? 0;
    this._selectedStageId = stages.some((stage) => stage?.id === selectedStageId)
      ? selectedStageId
      : stages[0]?.id ?? 'ash_plains';
    this._selectedSeedMode = selectedSeedMode ?? 'none';
    this._selectedSeedText = selectedSeedText ?? '';
    this._seedPreviewText = seedPreviewText || this._buildSeedPreviewText();
    this._recommendedGoals = recommendedGoals;
    this._canStart = Boolean(canStart && this._selectedWeaponId);
    this._onStart = onStart;
    this._onCancel = onCancel;
    this._dialogRuntime?.dispose({ restoreFocus: false });
    this._dialogRuntime = bindDialogRuntime({
      root: this._el,
      panelSelector: '.sl-panel',
      onRequestClose: () => {
        this.hide();
        this._onCancel?.();
      },
    });
    this._el.style.display = 'flex';
    this._render({ focusSelector: '.sl-panel', scrollTop: 0 });
  }

  hide() {
    this._dialogRuntime?.dispose();
    this._dialogRuntime = null;
    this._el.style.display = 'none';
    this._el.innerHTML = '';
  }

  destroy() {
    this._dialogRuntime?.dispose({ restoreFocus: false });
    this._dialogRuntime = null;
    this._el.remove();
  }

  _captureRenderState() {
    return {
      scrollTop: this._el.querySelector('.sl-panel')?.scrollTop ?? 0,
      focusSelector: this._resolveFocusSelector(globalThis.document?.activeElement ?? null),
    };
  }

  _resolveFocusSelector(activeElement) {
    if (!activeElement) return null;
    if (activeElement === this._el.querySelector('.sl-panel')) {
      return '.sl-panel';
    }

    const dataset = activeElement.dataset ?? {};
    if (dataset.weaponId) return `[data-weapon-id="${dataset.weaponId}"]`;
    if (dataset.ascensionLevel) return `[data-ascension-level="${dataset.ascensionLevel}"]`;
    if (dataset.accessoryId) return `[data-accessory-id="${dataset.accessoryId}"]`;
    if (dataset.archetypeId) return `[data-archetype-id="${dataset.archetypeId}"]`;
    if (dataset.riskRelicId) return `[data-risk-relic-id="${dataset.riskRelicId}"]`;
    if (dataset.stageId) return `[data-stage-id="${dataset.stageId}"]`;
    if (dataset.seedMode) return `[data-seed-mode="${dataset.seedMode}"]`;
    if (Object.hasOwn(dataset, 'seedText')) return '[data-seed-text]';
    if (dataset.action) return `[data-action="${dataset.action}"]`;
    return null;
  }

  _restoreRenderState({ focusSelector = null, scrollTop = 0 } = {}) {
    const panel = this._el.querySelector('.sl-panel');
    if (panel) {
      panel.scrollTop = scrollTop;
    }
    if (!focusSelector) return;
    this._el.querySelector(focusSelector)?.focus?.({ preventScroll: true });
  }

  _render(renderState = this._captureRenderState()) {
    this._el.innerHTML = renderStartLoadoutMarkup({
      weapons: this._weapons,
      accessories: this._accessories,
      archetypes: this._archetypes,
      riskRelics: this._riskRelics,
      selectedWeaponId: this._selectedWeaponId,
      ascensionChoices: this._ascensionChoices,
      selectedAscensionLevel: this._selectedAscensionLevel,
      selectedStartAccessoryId: this._selectedStartAccessoryId,
      selectedArchetypeId: this._selectedArchetypeId,
      selectedRiskRelicId: this._selectedRiskRelicId,
      stages: this._stages,
      selectedStageId: this._selectedStageId,
      selectedSeedMode: this._selectedSeedMode,
      selectedSeedText: this._selectedSeedText,
      seedPreviewText: this._seedPreviewText,
      recommendedGoals: this._recommendedGoals,
      canStart: this._canStart,
    });

    bindStartLoadoutInteractions(this._el, {
      canStart: this._canStart,
      getSelectedWeaponId: () => this._selectedWeaponId,
      getSelectedAscensionLevel: () => this._selectedAscensionLevel,
      getSelectedStartAccessoryId: () => this._selectedStartAccessoryId,
      getSelectedArchetypeId: () => this._selectedArchetypeId,
      getSelectedRiskRelicId: () => this._selectedRiskRelicId,
      getSelectedStageId: () => this._selectedStageId,
      getSelectedSeedMode: () => this._selectedSeedMode,
      getSelectedSeedText: () => this._selectedSeedText,
      onSelectWeapon: (weaponId) => {
        this._selectedWeaponId = weaponId;
        this._render();
      },
      onSelectAscension: (ascensionLevel) => {
        this._selectedAscensionLevel = ascensionLevel;
        this._render();
      },
      onSelectAccessory: (accessoryId) => {
        this._selectedStartAccessoryId = accessoryId || null;
        this._render();
      },
      onSelectArchetype: (archetypeId) => {
        this._selectedArchetypeId = archetypeId;
        this._render();
      },
      onSelectRiskRelic: (riskRelicId) => {
        this._selectedRiskRelicId = riskRelicId || null;
        this._render();
      },
      onSelectStage: (stageId) => {
        this._selectedStageId = stageId;
        this._render();
      },
      onSelectSeedMode: (seedMode) => {
        this._selectedSeedMode = seedMode;
        if (seedMode !== 'custom') {
          this._selectedSeedText = '';
        }
        this._seedPreviewText = this._buildSeedPreviewText();
        this._render();
      },
      onChangeSeedText: (seedText) => {
        this._selectedSeedText = seedText;
        this._seedPreviewText = this._buildSeedPreviewText();
      },
      onCancel: () => {
        this.hide();
        this._onCancel?.();
      },
      onStart: (selectedWeaponId, runOptions) => {
        this.hide();
        this._onStart?.(selectedWeaponId, runOptions);
      },
    });

    this._restoreRenderState(renderState);
  }

  _buildSeedPreviewText() {
    if (this._selectedSeedMode === 'daily') {
      return '오늘의 고정 시드로 플레이합니다.';
    }
    if (this._selectedSeedMode === 'custom') {
      return this._selectedSeedText
        ? `Seed ${this._selectedSeedText}`
        : '커스텀 시드를 입력하면 동일한 런을 재현합니다.';
    }
    return '랜덤 시드로 새로운 런을 생성합니다.';
  }
}
