export function buildBossHudMarkup(boss = {}) {
  return `
    <div class="boss-name">${boss.name || 'BOSS'}</div>
    <div class="boss-bar-wrap">
      <div class="boss-hp-fill"></div>
    </div>
    <span class="boss-hp-label"></span>
  `;
}
