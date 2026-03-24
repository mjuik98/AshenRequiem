function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getStartLoadoutWeaponEmoji(behaviorId) {
  const map = {
    targetProjectile: '🔵',
    areaBurst: '✨',
    orbit: '⚡',
    boomerang: '🪃',
    chainLightning: '⚡',
    omnidirectional: '🌀',
    laserBeam: '☀️',
    groundZone: '🔥',
    ricochetProjectile: '💠',
  };
  return map[behaviorId] ?? '⚔';
}

function getStartLoadoutWeaponTag(behaviorId) {
  const map = {
    targetProjectile: '투사체',
    areaBurst: '광역',
    orbit: '궤도',
    boomerang: '관통',
    chainLightning: '연쇄',
    omnidirectional: '전방향',
    laserBeam: '레이저',
    groundZone: '장판',
    ricochetProjectile: '반사',
  };
  return map[behaviorId] ?? '기본';
}

function renderStartLoadoutCards(weapons = [], selectedWeaponId = null) {
  return weapons.map((weapon) => `
    <button
      class="sl-card ${weapon.id === selectedWeaponId ? 'selected' : ''}"
      data-weapon-id="${escapeHtml(weapon.id)}"
      type="button"
    >
      <div class="sl-card-top">
        <span class="sl-icon">${getStartLoadoutWeaponEmoji(weapon.behaviorId)}</span>
        <span class="sl-name">${escapeHtml(weapon.name)}</span>
      </div>
      <div class="sl-tag-row">
        <span class="sl-tag">${escapeHtml(getStartLoadoutWeaponTag(weapon.behaviorId))}</span>
      </div>
      <p class="sl-desc">${escapeHtml(weapon.description ?? '')}</p>
    </button>
  `).join('');
}

export function renderStartLoadoutMarkup({
  weapons = [],
  selectedWeaponId = null,
  canStart = false,
} = {}) {
  const emptyState = weapons.length === 0
    ? '<p class="sl-empty">시작 가능한 기본 무기가 없습니다.</p>'
    : '';
  const copy = canStart
    ? '해금한 기본 무기 중 하나를 고르고 전투를 시작합니다.'
    : '시작 가능한 기본 무기가 없습니다.';

  return `
    <div class="sl-backdrop" data-action="cancel"></div>
    <section class="sl-panel" role="dialog" aria-modal="true" aria-labelledby="sl-title">
      <p class="sl-eyebrow">Loadout</p>
      <h2 class="sl-title" id="sl-title">시작 무기 선택</h2>
      <p class="sl-copy">${escapeHtml(copy)}</p>
      <div class="sl-grid">${renderStartLoadoutCards(weapons, selectedWeaponId)}</div>
      ${emptyState}
      <div class="sl-actions">
        <button class="sl-btn ghost" data-action="cancel" type="button">취소</button>
        <button class="sl-btn primary" data-action="start" type="button"${canStart ? '' : ' disabled'}>시작하기</button>
      </div>
    </section>
  `;
}
