export const PAUSE_RESPONSIVE_CSS = `
  @media (max-width: 780px) {
    .pv-loadout-panel { grid-template-columns: 1fr; }
  }
  @media (max-width: 540px) {
    .pv-stats-grid { grid-template-columns: 1fr 1fr; }
    .pv-sound-toggles { grid-template-columns: 1fr; }
    .pv-footer { flex-direction: column-reverse; }
    .pv-btn-resume, .pv-btn-forfeit { justify-content: center; }
    .pv-loadout-detail-hero { align-items: stretch; }
    .pv-loadout-power-row, .pv-loadout-link-row, .pv-loadout-synergy-head, .pv-loadout-evolution-head {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    .pv-loadout-row-value,
    .pv-loadout-link-val,
    .pv-loadout-synergy-state,
    .pv-loadout-evolution-state {
      min-width: 0;
      text-align: left;
    }
    .pv-loadout-evolution-result { justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pv-panel, .pv-btn-resume, .pv-btn-forfeit, .pv-tab-content { animation: none !important; transition: none !important; }
    .pv-hp-fill.low, .pv-hp-warn { animation: none !important; }
  }
`;
