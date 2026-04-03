export function buildWeaponEvolutionAnnounceMarkup(announceText, weaponName) {
  return `
    <div class="evo-inner">
      <div class="evo-badge">✨ 무기 진화!</div>
      <div class="evo-name">${weaponName}</div>
      <div class="evo-text">${announceText}</div>
    </div>
  `;
}
