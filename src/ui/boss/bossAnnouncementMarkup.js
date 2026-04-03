export function buildBossAnnouncementMarkup(bossName = '') {
  return `
    <div class="ba-inner">
      <div class="ba-warning">⚠ WARNING ⚠</div>
      <div class="ba-name">${bossName}</div>
      <div class="ba-subtitle">강력한 적이 나타났다!</div>
    </div>
  `;
}
