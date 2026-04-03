export const HUD_VIEW_MARKUP = `
  <div class="hud-xp-bar-container">
    <div class="hud-xp-bar"></div>
  </div>
  <div class="hud-top">
    <div class="hud-stats">
      <span class="hud-level">Lv.1</span>
      <div class="hud-right-stats">
        <span class="hud-time">0:00</span>
        <span class="hud-kills">킬: 0</span>
        <span class="hud-gold">골드: 0</span>
        <span class="hud-curse">저주: 0%</span>
      </div>
    </div>
  </div>
  <div class="hud-chest-queue" id="hud-chest-queue">
    <span class="hud-chest-icon">📦</span>
    <span class="hud-chest-count" id="hud-chest-count">×1</span>
  </div>
`;

export function cacheHudViewElements(root) {
  return {
    level: root.querySelector('.hud-level'),
    kills: root.querySelector('.hud-kills'),
    time: root.querySelector('.hud-time'),
    gold: root.querySelector('.hud-gold'),
    curse: root.querySelector('.hud-curse'),
    xpBar: root.querySelector('.hud-xp-bar'),
    chestQueue: root.querySelector('#hud-chest-queue'),
    chestCount: root.querySelector('#hud-chest-count'),
  };
}
