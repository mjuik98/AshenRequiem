import { formatWeaponSynergyBonus } from './pauseTooltipContent.js';

const BASE_STATS = {
  moveSpeed: 200,
  magnetRadius: 60,
  lifesteal: 0,
  critChance: 0.05,
  critMultiplier: 2.0,
  xpMult: 1.0,
  globalDamageMult: 1.0,
  currencyMult: 1.0,
  projectileSizeMult: 1.0,
  projectileSpeedMult: 1.0,
  projectileLifetimeMult: 1.0,
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStatCell(icon, key, base, bonus, unit, ariaLabel) {
  const bonusHtml = bonus > 0.05
    ? `<span class="pv-stat-bonus">+${Math.round(bonus)}</span>`
    : bonus < -0.05
    ? `<span class="pv-stat-bonus neg">${Math.round(bonus)}</span>`
    : '';

  return `
    <div class="pv-stat-cell">
      <div class="pv-sicon" aria-hidden="true">${icon}</div>
      <div class="pv-stat-info">
        <div class="pv-stat-key">${key}</div>
        <div class="pv-stat-val-row" aria-label="${ariaLabel}">
          <span class="pv-stat-base">${base}</span>
          ${bonusHtml}
          ${unit ? `<span class="pv-stat-unit">${unit}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function renderPauseStats({
  player,
  activeSynergies = [],
  session = null,
  formatSynergyBonus = formatWeaponSynergyBonus,
}) {
  const ms = player?.moveSpeed ?? BASE_STATS.moveSpeed;
  const mag = player?.magnetRadius ?? BASE_STATS.magnetRadius;
  const ls = (player?.lifesteal ?? BASE_STATS.lifesteal) * 100;
  const cc = (player?.critChance ?? BASE_STATS.critChance) * 100;
  const cm = (player?.critMultiplier ?? BASE_STATS.critMultiplier) * 100;
  const xpm = (player?.xpMult ?? BASE_STATS.xpMult) * 100;
  const dmg = (player?.globalDamageMult ?? BASE_STATS.globalDamageMult) * 100;
  const gold = (player?.currencyMult ?? BASE_STATS.currencyMult) * 100;
  const projSize = (player?.projectileSizeMult ?? BASE_STATS.projectileSizeMult) * 100;
  const projSpeed = (player?.projectileSpeedMult ?? BASE_STATS.projectileSpeedMult) * 100;
  const projLifetime = (player?.projectileLifetimeMult ?? BASE_STATS.projectileLifetimeMult) * 100;
  const cd = player?.cooldownMult ?? 1.0;
  const cdBonus = Math.round((1.0 - cd) * 100);
  const bonusProjectiles = player?.bonusProjectileCount ?? 0;
  const wallet = session?.meta?.currency ?? 0;

  const synHtml = activeSynergies.length > 0
    ? `<div class="pv-stats-section">
        <div class="pv-sec-label">활성 시너지</div>
        <div class="pv-syn-list">
          ${activeSynergies.map((synergy) => `
            <div class="pv-syn-row">
              <div class="pv-syn-dot" aria-hidden="true"></div>
              <div class="pv-syn-info">
                <div class="pv-syn-name">${escapeHtml(synergy.name ?? synergy.id)}</div>
                <div class="pv-syn-desc">${escapeHtml(synergy.description ?? '')}</div>
              </div>
              <div class="pv-syn-bonus">${escapeHtml(formatSynergyBonus(synergy.bonus))}</div>
            </div>
          `).join('')}
        </div>
      </div>`
    : '';

  return `
    <div class="pv-stats-section">
      <div class="pv-sec-label">전투 스탯</div>
      <div class="pv-stats-grid">
        ${renderStatCell('→', '이동 속도', Math.round(BASE_STATS.moveSpeed), ms - BASE_STATS.moveSpeed, 'px/s', `이동 속도 ${Math.round(ms)} px/s`)}
        ${renderStatCell('◎', '자석 반경', Math.round(BASE_STATS.magnetRadius), mag - BASE_STATS.magnetRadius, 'px', `자석 반경 ${Math.round(mag)} px`)}
        ${renderStatCell('♥', '흡혈', Math.round(BASE_STATS.lifesteal * 100), ls - (BASE_STATS.lifesteal * 100), '%', `흡혈 ${ls.toFixed(0)}%`)}
        ${renderStatCell('!', '크리티컬 확률', Math.round(BASE_STATS.critChance * 100), cc - (BASE_STATS.critChance * 100), '%', `크리티컬 확률 ${cc.toFixed(0)}%`)}
        ${renderStatCell('×', '크리티컬 데미지', Math.round(BASE_STATS.critMultiplier * 100), cm - (BASE_STATS.critMultiplier * 100), '%', `크리티컬 데미지 ${cm.toFixed(0)}%`)}
        ${renderStatCell('⚔', '데미지 증가', Math.round(BASE_STATS.globalDamageMult * 100), dmg - (BASE_STATS.globalDamageMult * 100), '%', `데미지 증가 ${dmg.toFixed(0)}%`)}
        ${renderStatCell('★', '경험치 획득', 100, xpm - (BASE_STATS.xpMult * 100), '%', `경험치 획득 ${xpm.toFixed(0)}%`)}
        ${renderStatCell('💰', '골드 획득', 100, gold - (BASE_STATS.currencyMult * 100), '%', `골드 획득 ${gold.toFixed(0)}%`)}
        ${renderStatCell('◌', '투사체 크기/범위', 100, projSize - (BASE_STATS.projectileSizeMult * 100), '%', `투사체 크기/범위 ${projSize.toFixed(0)}%`)}
        ${renderStatCell('➤', '투사체 속도', 100, projSpeed - (BASE_STATS.projectileSpeedMult * 100), '%', `투사체 속도 ${projSpeed.toFixed(0)}%`)}
        ${renderStatCell('⌛', '투사체 지속시간', 100, projLifetime - (BASE_STATS.projectileLifetimeMult * 100), '%', `투사체 지속시간 ${projLifetime.toFixed(0)}%`)}
        ${renderStatCell('⟳', '쿨다운 배율', `×${cd.toFixed(2)}`, cdBonus, cdBonus > 0 ? '% 단축' : '', `쿨다운 배율 ×${cd.toFixed(2)}`)}
        ${bonusProjectiles > 0 ? renderStatCell('+', '추가 투사체', 0, bonusProjectiles, '발', `추가 투사체 +${bonusProjectiles}발`) : ''}
        ${renderStatCell('¤', '보유 재화', wallet.toLocaleString(), 0, '', `보유 재화 ${wallet}`)}
      </div>
    </div>
    ${synHtml}
  `;
}
