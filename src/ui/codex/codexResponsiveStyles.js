export const CODEX_RESPONSIVE_CSS = `
  @media (max-width: 860px) {
    .cx-detail-layout { grid-template-columns: 1fr; }
    .cx-records-hero { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cx-records-focus { grid-template-columns: 1fr; }
  }
  @media (max-width: 540px) {
    .cx-content { padding: 14px; }
    .cx-tabs { padding: 0; overflow-x: auto; }
    .cx-tab { padding-left: 14px; padding-right: 14px; }
    .cx-dstat-grid { grid-template-columns: 1fr 1fr; }
    .cx-records-grid { grid-template-columns: 1fr 1fr; }
    .cx-records-hero { grid-template-columns: 1fr 1fr; }
    .cx-records-focus-meta {
      flex-direction: column;
      align-items: flex-start;
    }
    .cx-detail-hero { flex-direction: column; }
    .cx-link-chip { width: 100%; justify-content: flex-start; }
    .cx-summary-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;
