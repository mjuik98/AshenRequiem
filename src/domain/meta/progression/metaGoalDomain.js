import {
  getDiscoveredAccessoryIds,
  getDiscoveredCodexWeaponIds,
} from '../codex/codexDiscoveryDomain.js';
import { buildUnlockGuideEntries } from './unlockGuidanceDomain.js';

function countDiscoveredEnemies(session, enemyData = []) {
  const kills = session?.meta?.enemyKills ?? {};
  const enemyIds = new Set((enemyData ?? []).filter((enemy) => !enemy?.isProp).map((enemy) => enemy?.id).filter(Boolean));
  return Object.entries(kills)
    .filter(([enemyId, count]) => enemyIds.has(enemyId) && (Number(count) || 0) > 0)
    .length;
}

function buildUnlockGoal(session, unlockData = []) {
  const unlock = buildUnlockGuideEntries(session, unlockData, Number.POSITIVE_INFINITY)
    .find((entry) => !entry.done);
  if (!unlock) return null;

  return {
    kind: 'unlock',
    id: unlock.id,
    icon: unlock.icon,
    title: unlock.title,
    description: unlock.description ?? unlock.rewardText ?? '',
    progressText: unlock.progressText,
    rewardText: unlock.rewardText ?? '',
    pct: unlock.pct ?? 0,
  };
}

function buildMetaUpgradeGoal(session, upgradeData = []) {
  const currency = session?.meta?.currency ?? 0;
  const owned = session?.meta?.permanentUpgrades ?? {};
  const upgrades = (upgradeData ?? [])
    .map((upgrade) => {
      const currentLevel = Number(owned[upgrade.id] ?? 0);
      const isMaxed = currentLevel >= (upgrade.maxLevel ?? 0);
      const nextCost = isMaxed ? 0 : upgrade.costPerLevel(currentLevel);
      return {
        upgrade,
        currentLevel,
        isMaxed,
        nextCost,
        affordable: !isMaxed && currency >= nextCost,
        pct: upgrade.maxLevel > 0 ? Math.min(100, currentLevel / upgrade.maxLevel * 100) : 0,
      };
    })
    .filter((entry) => !entry.isMaxed)
    .sort((left, right) => {
      if (left.affordable !== right.affordable) return left.affordable ? -1 : 1;
      return (right.pct - left.pct) || (left.nextCost - right.nextCost);
    });

  const nextUpgrade = upgrades[0];
  if (!nextUpgrade) return null;

  return {
    kind: 'meta_upgrade',
    id: nextUpgrade.upgrade.id,
    icon: nextUpgrade.upgrade.icon ?? '⚗',
    title: nextUpgrade.upgrade.name,
    description: nextUpgrade.upgrade.description ?? '영구 업그레이드를 강화하세요.',
    progressText: `Lv ${nextUpgrade.currentLevel}/${nextUpgrade.upgrade.maxLevel} · ${nextUpgrade.nextCost}💰`,
    pct: nextUpgrade.pct,
  };
}

function buildCodexGoal(session, gameData = {}) {
  const enemyData = gameData?.enemyData ?? [];
  const weaponData = gameData?.weaponData ?? [];
  const accessoryData = gameData?.accessoryData ?? [];
  const discoveredWeapons = getDiscoveredCodexWeaponIds(session);
  const discoveredAccessories = getDiscoveredAccessoryIds(session);

  const candidates = [
    {
      kind: 'codex',
      id: 'codex_enemy',
      icon: '☠',
      title: '적 도감 확장',
      description: '새 적을 조우해 전장 패턴을 익히세요.',
      discovered: countDiscoveredEnemies(session, enemyData),
      total: enemyData.filter((enemy) => !enemy?.isProp).length,
    },
    {
      kind: 'codex',
      id: 'codex_weapon',
      icon: '⚔',
      title: '무기 도감 확장',
      description: '새 무기와 진화를 기록하세요.',
      discovered: weaponData.filter((weapon) => discoveredWeapons.has(weapon?.id)).length,
      total: weaponData.length,
    },
    {
      kind: 'codex',
      id: 'codex_accessory',
      icon: '◈',
      title: '장신구 도감 확장',
      description: '진화 촉매를 포함한 장신구를 수집하세요.',
      discovered: accessoryData.filter((accessory) => discoveredAccessories.has(accessory?.id)).length,
      total: accessoryData.length,
    },
  ]
    .filter((entry) => entry.total > 0 && entry.discovered < entry.total)
    .map((entry) => ({
      ...entry,
      pct: entry.total > 0 ? Math.min(100, entry.discovered / entry.total * 100) : 0,
      progressText: `${entry.discovered}/${entry.total}`,
    }))
    .sort((left, right) => right.pct - left.pct);

  return candidates[0] ?? null;
}

function buildDailyGoal(session) {
  const streak = Math.max(0, Number(session?.meta?.dailyChallengeStreak) || 0);
  const bestStreak = Math.max(0, Number(session?.meta?.bestDailyChallengeStreak) || 0);
  const nextMilestone = streak < 3 ? 3 : streak < 5 ? 5 : 7;
  const pct = Math.min(100, streak / nextMilestone * 100);

  return {
    kind: 'daily',
    id: 'daily_streak',
    icon: '☀',
    title: '데일리 연속 도전',
    description: `현재 ${streak}일 연속. 다음 마일스톤은 ${nextMilestone}일입니다.`,
    progressText: `${streak}/${nextMilestone}일 · 최고 ${bestStreak}일`,
    pct,
  };
}

export function buildMetaGoalRoadmap({
  session = null,
  gameData = {},
  limit = 4,
} = {}) {
  const source = /** @type {any} */ (gameData ?? {});
  const roadmap = [
    buildUnlockGoal(session, source.unlockData ?? []),
    buildMetaUpgradeGoal(session, source.permanentUpgradeData ?? []),
    buildCodexGoal(session, source),
    buildDailyGoal(session),
  ].filter(Boolean);

  return roadmap.slice(0, Math.max(0, limit));
}
