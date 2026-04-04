export const ENEMY_TIER_LABELS = {
  normal: '일반',
  elite: '엘리트',
  boss: '보스',
};

const ENEMY_STATUS_LABELS = {
  all: '전체',
  discovered: '발견',
  undiscovered: '미발견',
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

function buildEnemyDiscoveryHint(enemy) {
  const tier = getCodexEnemyTier(enemy);
  if (tier === 'boss') {
    return '보스는 런 중 실제로 조우하면 실루엣이 기록됩니다.';
  }
  if (tier === 'elite') {
    return '엘리트 적은 전장에서 조우하거나 처치하면 도감에 기록됩니다.';
  }
  return '전장에서 조우하거나 처치하면 도감에 기록됩니다.';
}

export function buildCodexEnemyGridModel({
  enemyData = [],
  session = null,
  currentTier = 'all',
  selectedEnemyId = null,
  search = '',
  statusFilter = 'all',
}) {
  const tierText = currentTier === 'all' ? '전체' : ENEMY_TIER_LABELS[currentTier];
  const normalizedSearch = String(search ?? '').trim().toLowerCase();
  const kills = session?.meta?.enemyKills ?? {};

  const entries = enemyData
    .filter((enemy) => !enemy?.isProp)
    .filter((enemy) => {
      const tier = getCodexEnemyTier(enemy);
      const matchesTier = currentTier === 'all' || tier === currentTier;
      const discovered = isEnemyDiscovered(enemy, session);
      const matchesSearch = !normalizedSearch || (enemy.name ?? '').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'discovered' && discovered)
        || (statusFilter === 'undiscovered' && !discovered);
      return matchesTier && matchesSearch && matchesStatus;
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

  const resolvedSelected = entries.find((entry) => entry.id === selectedEnemyId)
    ?? entries.find((entry) => entry.discovered)
    ?? entries[0]
    ?? null;
  const discoveredEntries = entries.filter((entry) => entry.discovered)
    .map((entry) => ({ ...entry, isSelected: resolvedSelected?.id === entry.id }));
  const undiscoveredEntries = entries.filter((entry) => !entry.discovered)
    .map((entry) => ({ ...entry, isSelected: resolvedSelected?.id === entry.id }));

  return {
    tierText,
    entries,
    discoveredEntries,
    undiscoveredEntries,
    summary: {
      visibleCount: entries.length,
      discoveredCount: discoveredEntries.length,
      undiscoveredCount: undiscoveredEntries.length,
      selectedId: resolvedSelected?.id ?? null,
      selectedName: resolvedSelected?.name ?? null,
      statusLabel: ENEMY_STATUS_LABELS[statusFilter] ?? ENEMY_STATUS_LABELS.all,
    },
  };
}

export function buildCodexEnemyDetailModel({
  enemyData = [],
  session = null,
  selectedEnemyId = null,
}) {
  if (!selectedEnemyId) return null;

  const enemy = enemyData.find((entry) => entry.id === selectedEnemyId && !entry?.isProp);
  if (!enemy) return null;

  if (!isEnemyDiscovered(enemy, session)) {
    const tier = getCodexEnemyTier(enemy);
    return {
      id: enemy.id,
      unlocked: false,
      name: '???',
      displayName: '???',
      tier,
      tierLabel: ENEMY_TIER_LABELS[tier] ?? tier,
      borderColor: enemy.isBoss
        ? 'rgba(255,64,129,0.7)'
        : enemy.isElite
          ? 'rgba(255,215,64,0.6)'
          : (enemy.color ?? '#888'),
      avatarText: '?',
      color: enemy.color ?? '#888',
      discoveryHint: buildEnemyDiscoveryHint(enemy),
    };
  }

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
    unlocked: true,
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
    discoveryHint: buildEnemyDiscoveryHint(enemy),
  };
}
