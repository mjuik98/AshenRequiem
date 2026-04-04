import { ensureStartLoadoutStyles } from './startLoadoutStyles.js';
import {
  bindStartLoadoutViewRuntime,
  renderStartLoadoutViewRuntime,
} from './startLoadoutViewRuntime.js';
import {
  buildStartLoadoutAdvancedSummary,
  buildStartLoadoutSeedPreviewText,
} from '../../app/title/titleLoadoutQueryService.js';
import {
  disposeDialogRuntime,
  replaceDialogRuntime,
} from '../shared/dialogViewLifecycle.js';

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
    this._advancedSummary = '';
    this._isAdvancedOpen = false;
    this._onStart = null;
    this._onCancel = null;
    this._dialogRuntime = null;
    this._runtimeDisposer = bindStartLoadoutViewRuntime(this);
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
    advancedSummary = '',
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
    this._advancedSummary = advancedSummary || this._buildAdvancedSummary();
    this._isAdvancedOpen = false;
    this._canStart = Boolean(canStart && this._selectedWeaponId);
    this._onStart = onStart;
    this._onCancel = onCancel;
    this._dialogRuntime = replaceDialogRuntime(this._dialogRuntime, {
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
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime);
    this._el.style.display = 'none';
    this._el.innerHTML = '';
  }

  destroy() {
    this._dialogRuntime = disposeDialogRuntime(this._dialogRuntime, { restoreFocus: false });
    this._runtimeDisposer?.();
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
    renderStartLoadoutViewRuntime(this, renderState);
  }

  _buildSeedPreviewText() {
    return buildStartLoadoutSeedPreviewText({
      seedMode: this._selectedSeedMode,
      seedText: this._selectedSeedText,
      now: new Date(),
    });
  }

  _buildAdvancedSummary() {
    return buildStartLoadoutAdvancedSummary({
      ascensionChoices: this._ascensionChoices,
      selectedAscensionLevel: this._selectedAscensionLevel,
      archetypes: this._archetypes,
      selectedArchetypeId: this._selectedArchetypeId,
      stages: this._stages,
      selectedStageId: this._selectedStageId,
    });
  }
}
