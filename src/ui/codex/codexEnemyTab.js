export const ENEMY_TIER_LABELS = {
  normal: '일반',
  elite: '엘리트',
  boss: '보스',
};

export function getCodexEnemyTier(enemy) {
  if (enemy?.isBoss) return 'boss';
  if (enemy?.isElite) return 'elite';
  return 'normal';
}

function isEnemyDiscovered(enemy, session) {
  const kills = session?.meta?.enemyKills ?? {};
  const encountered = session?.meta?.enemiesEncountered ?? [];
  return (kills[enemy.id] ?? 0) > 0 || encountered.includes(enemy.id);
}

export function buildCodexEnemyGridModel({
  enemyData = [],
  session = null,
  currentTier = 'all',
  selectedEnemyId = null,
  search = '',
}) {
  const tierText = currentTier === 'all' ? '전체' : ENEMY_TIER_LABELS[currentTier];
  const normalizedSearch = (search ?? '').trim();
  const kills = session?.meta?.enemyKills ?? {};

  const entries = enemyData
    .filter((enemy) => {
      const tier = getCodexEnemyTier(enemy);
      const matchesTier = currentTier === 'all' || tier === currentTier;
      const matchesSearch = !normalizedSearch || (enemy.name ?? '').includes(normalizedSearch);
      return matchesTier && matchesSearch;
    })
    .map((enemy) => {
      const tier = getCodexEnemyTier(enemy);
      const discovered = isEnemyDiscovered(enemy, session);
      return {
        id: enemy.id,
        name: enemy.name,
        tier,
        tierLabel: ENEMY_TIER_LABELS[tier] ?? tier,
        discovered,
        isSelected: selectedEnemyId === enemy.id,
        killCount: kills[enemy.id] ?? 0,
        borderColor: enemy.isBoss
          ? 'rgba(255,64,129,0.7)'
          : enemy.isElite
            ? 'rgba(255,215,64,0.6)'
            : (enemy.color ?? '#888'),
        avatarText: enemy.isBoss ? 'B' : enemy.isElite ? 'E' : (enemy.name?.[0] ?? '?'),
        color: enemy.color ?? '#888',
        stats: {
          hp: enemy.hp,
          damage: enemy.damage,
          moveSpeed: enemy.moveSpeed,
          xpValue: enemy.xpValue,
        },
      };
    });

  return { tierText, entries };
}

export function buildCodexEnemyDetailModel({
  enemyData = [],
  session = null,
  selectedEnemyId = null,
}) {
  if (!selectedEnemyId) return null;

  const enemy = enemyData.find((entry) => entry.id === selectedEnemyId);
  if (!enemy || !isEnemyDiscovered(enemy, session)) return null;

  const killCount = session?.meta?.enemyKills?.[enemy.id] ?? 0;
  const tier = getCodexEnemyTier(enemy);
  const milestones = [10, 50, 100, 300, 500];
  const effects = [];

  if (enemy.knockbackResist >= 1) effects.push('넉백무효');
  if (enemy.knockbackResist > 0) effects.push('넉백저항');
  if (enemy.behaviorId === 'dash') effects.push('돌진');
  if (enemy.behaviorId === 'circle_dash') effects.push('궤도돌진');
  if (enemy.projectileConfig) effects.push('투사체');
  if (enemy.deathSpawn) effects.push('분열');
  if (enemy.isBoss && enemy.phases?.length) effects.push(`페이즈×${enemy.phases.length}`);

  return {
    id: enemy.id,
    name: enemy.name,
    tier,
    tierLabel: ENEMY_TIER_LABELS[tier] ?? tier,
    killCount,
    borderColor: enemy.isBoss
      ? 'rgba(255,64,129,0.7)'
      : enemy.isElite
        ? 'rgba(255,215,64,0.6)'
        : (enemy.color ?? '#888'),
    avatarText: enemy.isBoss ? 'B' : enemy.isElite ? 'E' : (enemy.name?.[0] ?? '?'),
    color: enemy.color ?? '#888',
    stats: {
      hp: enemy.hp,
      moveSpeed: enemy.moveSpeed,
      damage: enemy.damage,
      xpValue: enemy.xpValue,
    },
    drops: enemy.deathSpawn
      ? [`미니 ${enemy.deathSpawn.enemyId} ×${enemy.deathSpawn.count}`, '경험치 젬']
      : (enemy.isBoss ? ['보스 크리스탈', '대량 통화'] : enemy.isElite ? ['엘리트 젬', '통화'] : ['경험치 젬']),
    effects,
    milestoneStates: milestones.map((value) => ({ value, done: killCount >= value })),
  };
}

export function renderCodexEnemyTabShell() {
  return `
    <div class="cx-search-row">
      <input class="cx-search" id="cx-enemy-search" placeholder="적 이름 검색..." aria-label="적 검색">
      <div class="cx-tier-filter">
        <button class="cx-tf active" data-tier="all">전체</button>
        <button class="cx-tf" data-tier="normal">일반</button>
        <button class="cx-tf" data-tier="elite">엘리트</button>
        <button class="cx-tf" data-tier="boss">보스</button>
      </div>
    </div>
    <p class="cx-section-label" id="cx-enemy-label"></p>
    <div class="cx-enemy-grid" id="cx-enemy-grid"></div>
    <div id="cx-enemy-detail"></div>
  `;
}

export function renderCodexEnemyGrid(model) {
  return model.entries.map((enemy) => `
    <div class="cx-ecard ${enemy.tier} ${enemy.isSelected ? 'selected' : ''} ${!enemy.discovered ? 'locked' : ''}"
         data-id="${enemy.id}" role="button" tabindex="0"
         aria-label="${enemy.discovered ? enemy.name : '미발견 적'} 상세 보기">
      <div class="cx-eavatar" style="background:${enemy.color}22;border-color:${enemy.borderColor};color:${enemy.color}">
        ${enemy.avatarText}
      </div>
      <div class="cx-ename">${enemy.discovered ? enemy.name : '???'}</div>
      <div class="cx-etype-row">
        <span class="cx-ebadge badge-${enemy.tier}">${enemy.tierLabel}</span>
      </div>
      ${enemy.discovered ? `
        <div class="cx-estats">
          <div class="cx-estat"><span class="v">${enemy.stats.hp}</span><span class="k">HP</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.damage}</span><span class="k">DMG</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.moveSpeed}</span><span class="k">SPD</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.xpValue}</span><span class="k">XP</span></div>
        </div>
        <div class="cx-ekills">처치 <span>${enemy.killCount.toLocaleString()}</span>회</div>
      ` : `
        <div class="cx-lock-overlay" aria-label="미발견">
          <div class="cx-lock-icon"><div class="arc"></div><div class="body"></div></div>
          <span class="cx-lock-text">미발견</span>
        </div>
      `}
    </div>
  `).join('');
}

export function renderCodexEnemyDetail(model) {
  if (!model) return '';

  return `
    <div class="cx-detail">
      <div class="cx-dh">
        <div class="cx-davatar" style="background:${model.color}22;border-color:${model.borderColor};color:${model.color}">
          ${model.avatarText}
        </div>
        <div>
          <div class="cx-dname">${model.name}</div>
          <div class="cx-dtier"><span class="cx-ebadge badge-${model.tier}">${model.tierLabel}</span></div>
        </div>
      </div>
      <div class="cx-dstat-grid">
        <div class="cx-dstat"><div class="v">${model.stats.hp}</div><div class="k">최대 HP</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.moveSpeed}</div><div class="k">이동 속도</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.damage}</div><div class="k">데미지</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.xpValue}</div><div class="k">XP 보상</div></div>
      </div>
      <div class="cx-drops-row">
        <span class="cx-drop-label">드롭:</span>
        ${model.drops.map((drop) => `<span class="cx-drop-pill">${drop}</span>`).join('')}
      </div>
      ${model.effects.length > 0 ? `<div class="cx-effects-row">${model.effects.map((effect) => `<span class="cx-effect-pill">${effect}</span>`).join('')}</div>` : ''}
      <div class="cx-kills-row">
        <div>
          <div class="cx-kills-key">총 처치 횟수</div>
          <div class="cx-kills-val">${model.killCount.toLocaleString()}</div>
        </div>
        <div>
          <div class="cx-kills-key" style="text-align:right;margin-bottom:4px">마일스톤</div>
          <div class="cx-milestone">
            ${model.milestoneStates.map((state) => `<div class="dp-ms ${state.done ? 'done' : ''}" title="${state.value}회"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
