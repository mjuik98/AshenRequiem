import {
  getDiscoveredAccessoryIds,
  getDiscoveredCodexWeaponIds,
  isAccessoryDiscovered,
  isCodexWeaponDiscovered,
} from '../../domain/meta/codex/codexDiscoveryDomain.js';
import { buildMetaGoalRoadmap } from '../../domain/meta/progression/metaGoalDomain.js';
import { buildUnlockGuideEntries } from '../../domain/meta/progression/unlockGuidanceDomain.js';
import { buildRunAnalytics } from '../../domain/meta/progression/runAnalyticsDomain.js';

function countDiscoveredEnemies(session, enemyData = []) {
  const kills = session?.meta?.enemyKills ?? {};
  const enemyIds = new Set((enemyData ?? []).filter((entry) => !entry?.isProp).map((entry) => entry?.id).filter(Boolean));
  return Object.entries(kills)
    .filter(([enemyId, value]) => enemyIds.has(enemyId) && (Number(value) || 0) > 0)
    .length;
}

function countDiscoveredWeapons(session, weaponData = []) {
  const unlocked = getDiscoveredCodexWeaponIds(session);
  return (weaponData ?? []).filter((weapon) => unlocked.has(weapon?.id)).length;
}

function countDiscoveredAccessories(session, accessoryData = []) {
  const unlocked = getDiscoveredAccessoryIds(session);
  return (accessoryData ?? []).filter((accessory) => unlocked.has(accessory?.id)).length;
}

export function countCodexDiscovered(session) {
  const kills = session?.meta?.enemyKills ?? {};
  const owned = new Set([
    ...(session?.meta?.weaponsUsedAll ?? []),
    ...(session?.meta?.accessoriesOwnedAll ?? []),
    ...(session?.meta?.evolvedWeapons ?? []),
  ]);
  const killedCount = Object.values(kills)
    .map((value) => Number(value) || 0)
    .filter((value) => value > 0)
    .length;
  return killedCount + owned.size;
}

export function isCodexWeaponUnlocked(weapon, session) {
  return isCodexWeaponDiscovered(session, weapon);
}

export function isCodexAccessoryUnlocked(accessory, session) {
  return isAccessoryDiscovered(session, accessory?.id);
}

export function buildCodexDiscoverySummary({ session = null, gameData = null }) {
  const enemyData = gameData?.enemyData ?? [];
  const weaponData = gameData?.weaponData ?? [];
  const accessoryData = gameData?.accessoryData ?? [];

  const entries = [
    {
      label: '적',
      icon: '☠',
      tone: 'enemy',
      discovered: countDiscoveredEnemies(session, enemyData),
      total: enemyData.filter((enemy) => !enemy?.isProp).length,
    },
    {
      label: '무기',
      icon: '⚔',
      tone: 'weapon',
      discovered: countDiscoveredWeapons(session, weaponData),
      total: weaponData.length,
    },
    {
      label: '장신구',
      icon: '◈',
      tone: 'accessory',
      discovered: countDiscoveredAccessories(session, accessoryData),
      total: accessoryData.length,
    },
  ].map((entry) => ({
    ...entry,
    pct: entry.total > 0 ? Math.min(100, (entry.discovered / entry.total) * 100) : 0,
  }));

  return {
    entries,
    totalDiscovered: entries.reduce((sum, entry) => sum + entry.discovered, 0),
    total: entries.reduce((sum, entry) => sum + entry.total, 0),
  };
}

export function buildCodexRecordSummary(session) {
  const best = session?.best ?? {};
  const meta = session?.meta ?? {};
  const kills = Object.values(meta.enemyKills ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const totalRuns = meta.totalRuns ?? 0;
  const bossKills = (meta.killedBosses ?? []).length;
  const currency = meta.currency ?? 0;
  const survivalSec = best.survivalTime ?? 0;
  const analytics = buildRunAnalytics(meta);

  return {
    best,
    meta,
    kills,
    totalRuns,
    bossKills,
    currency,
    analytics,
    survivalSec,
    mm: Math.floor(survivalSec / 60),
    ss: String(Math.floor(survivalSec % 60)).padStart(2, '0'),
  };
}

export function buildCodexAchievements(session, gameData) {
  const meta = session?.meta ?? {};
  const best = session?.best ?? {};
  const kills = Object.values(meta.enemyKills ?? {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const bosses = (meta.killedBosses ?? []).length;
  const weapons = (meta.weaponsUsedAll ?? []).length;
  const accessories = (meta.accessoriesOwnedAll ?? []).length;
  const evos = (meta.evolvedWeapons ?? []).length;
  const runs = meta.totalRuns ?? 0;
  const discovery = buildCodexDiscoverySummary({ session, gameData });
  const discovered = discovery.totalDiscovered;
  const total = discovery.total;
  const accessoryIds = new Set(meta.accessoriesOwnedAll ?? []);
  const rareAccessoryCount = (gameData?.accessoryData ?? [])
    .filter((accessory) => accessory?.rarity === 'rare' && accessoryIds.has(accessory?.id))
    .length;
  const catalystAccessoryIds = new Set(
    (gameData?.weaponEvolutionData ?? [])
      .flatMap((recipe) => recipe?.requires?.accessoryIds ?? [])
      .filter(Boolean),
  );
  const catalystAccessoryCount = Array.from(catalystAccessoryIds)
    .filter((accessoryId) => accessoryIds.has(accessoryId))
    .length;

  return [
    { icon: '☠', name: '첫 번째 사냥', desc: '처음으로 10마리를 처치한다', done: kills >= 10, pct: Math.min(100, kills / 10 * 100) },
    { icon: '⚔', name: '백전노장', desc: '총 1000마리를 처치한다', done: kills >= 1000, pct: Math.min(100, kills / 1000 * 100) },
    { icon: '🐉', name: '보스 사냥꾼', desc: '보스를 처음으로 처치한다', done: bosses >= 1, pct: bosses >= 1 ? 100 : 0 },
    { icon: '📖', name: '반쪽 도감', desc: '도감의 50%를 채운다', done: discovered >= total * 0.5, pct: total > 0 ? Math.min(100, discovered / total * 200) : 0 },
    { icon: '⚗', name: '연금술사', desc: '무기를 진화시킨다', done: evos >= 1, pct: evos >= 1 ? 100 : 0 },
    { icon: '🗡', name: '무기 수집가', desc: '무기 5종 이상 획득한다', done: weapons >= 5, pct: Math.min(100, weapons / 5 * 100) },
    { icon: '💍', name: '장신구 수집가', desc: '장신구 5종 이상 획득한다', done: accessories >= 5, pct: Math.min(100, accessories / 5 * 100) },
    { icon: '💠', name: '희귀 수집가', desc: '희귀 장신구 2종 이상을 발견한다', done: rareAccessoryCount >= 2, pct: Math.min(100, rareAccessoryCount / 2 * 100) },
    { icon: '🧪', name: '진화 촉매 수집가', desc: '진화 재료 장신구 2종 이상을 발견한다', done: catalystAccessoryCount >= 2, pct: Math.min(100, catalystAccessoryCount / 2 * 100) },
    { icon: '🏃', name: '생존자', desc: '10분 이상 생존한다', done: (best.survivalTime ?? 0) >= 600, pct: Math.min(100, (best.survivalTime ?? 0) / 600 * 100) },
    { icon: '🌟', name: '전설적인 런', desc: '레벨 20 이상 달성한다', done: (best.level ?? 0) >= 20, pct: Math.min(100, (best.level ?? 0) / 20 * 100) },
    { icon: '💀', name: '오래된 전사', desc: '총 10번 이상 런을 완료한다', done: runs >= 10, pct: Math.min(100, runs / 10 * 100) },
  ];
}

export function buildCodexUnlockEntries(session, entries = []) {
  return buildUnlockGuideEntries(session, entries);
}

export function buildCodexRecordsModel({ session = null, gameData = null }) {
  const summary = buildCodexRecordSummary(session);
  const achievements = buildCodexAchievements(session, gameData);
  const unlocks = buildCodexUnlockEntries(session, gameData?.unlockData ?? []);
  const discovery = buildCodexDiscoverySummary({ session, gameData });
  const roadmapGoals = buildMetaGoalRoadmap({ session, gameData, limit: 4 });

  const secondaryGoals = [
    ...achievements
      .filter((entry) => !entry.done)
      .map((entry) => ({
        kind: 'achievement',
        icon: entry.icon,
        title: entry.name,
        description: entry.desc,
        progressText: `${Math.round(entry.pct)}%`,
        pct: entry.pct,
      })),
    ...unlocks
      .filter((entry) => !entry.done)
      .map((entry) => ({
        kind: 'unlock',
        icon: entry.icon,
        title: entry.title,
        description: entry.description,
        progressText: entry.progressText,
        pct: entry.pct,
      })),
  ]
    .sort((left, right) => right.pct - left.pct)
    .slice(0, 4);

  const focusGoals = [
    ...roadmapGoals,
    ...secondaryGoals.filter((entry) => !roadmapGoals.some((goal) => goal.title === entry.title)),
  ].slice(0, 4);

  const discoveryFocus = discovery.entries.map((entry) => ({
    ...entry,
    remaining: Math.max(0, entry.total - entry.discovered),
    progressText: `${entry.discovered}/${entry.total}`,
  }));

  return {
    summary,
    analytics: summary.analytics,
    highlights: [
      { icon: '☠', value: summary.kills.toLocaleString(), label: '총 처치 수' },
      { icon: '⏱', value: `${summary.mm}:${summary.ss}`, label: '최장 생존' },
      { icon: '★', value: `Lv.${summary.best.level ?? 1}`, label: '최고 레벨' },
      { icon: '💰', value: summary.currency.toLocaleString(), label: '누적 재화' },
    ],
    achievements,
    unlocks,
    focusGoals,
    discoveryFocus,
  };
}
