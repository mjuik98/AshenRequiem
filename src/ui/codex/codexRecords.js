import { unlockData } from '../../data/unlockData.js';

export function countCodexDiscovered(session) {
  const kills = session?.meta?.enemyKills ?? {};
  const owned = new Set([
    ...(session?.meta?.weaponsUsedAll ?? []),
    ...(session?.meta?.evolvedWeapons ?? []),
  ]);
  const killedCount = Object.values(kills).filter((value) => value > 0).length;
  return killedCount + owned.size;
}

export function isCodexWeaponUnlocked(weapon, session) {
  const owned = new Set(session?.meta?.weaponsUsedAll ?? []);
  const evolvedOwned = new Set(session?.meta?.evolvedWeapons ?? []);
  return weapon?.isEvolved ? evolvedOwned.has(weapon.id) : owned.has(weapon.id);
}

export function buildCodexRecordSummary(session) {
  const best = session?.best ?? {};
  const meta = session?.meta ?? {};
  const kills = Object.values(meta.enemyKills ?? {}).reduce((sum, value) => sum + value, 0);
  const totalRuns = meta.totalRuns ?? 0;
  const bossKills = (meta.killedBosses ?? []).length;
  const currency = meta.currency ?? 0;
  const survivalSec = best.survivalTime ?? 0;

  return {
    best,
    meta,
    kills,
    totalRuns,
    bossKills,
    currency,
    survivalSec,
    mm: Math.floor(survivalSec / 60),
    ss: String(Math.floor(survivalSec % 60)).padStart(2, '0'),
  };
}

export function buildCodexAchievements(session, gameData) {
  const meta = session?.meta ?? {};
  const best = session?.best ?? {};
  const kills = Object.values(meta.enemyKills ?? {}).reduce((sum, value) => sum + value, 0);
  const bosses = (meta.killedBosses ?? []).length;
  const weapons = (meta.weaponsUsedAll ?? []).length;
  const evos = (meta.evolvedWeapons ?? []).length;
  const runs = meta.totalRuns ?? 0;
  const discovered = countCodexDiscovered(session);
  const total = (gameData?.enemyData?.length ?? 0) + (gameData?.weaponData?.length ?? 0);

  return [
    { icon: '☠', name: '첫 번째 사냥', desc: '처음으로 10마리를 처치한다', done: kills >= 10, pct: Math.min(100, kills / 10 * 100) },
    { icon: '⚔', name: '백전노장', desc: '총 1000마리를 처치한다', done: kills >= 1000, pct: Math.min(100, kills / 1000 * 100) },
    { icon: '🐉', name: '보스 사냥꾼', desc: '보스를 처음으로 처치한다', done: bosses >= 1, pct: bosses >= 1 ? 100 : 0 },
    { icon: '📖', name: '반쪽 도감', desc: '도감의 50%를 채운다', done: discovered >= total * 0.5, pct: total > 0 ? Math.min(100, discovered / total * 200) : 0 },
    { icon: '⚗', name: '연금술사', desc: '무기를 진화시킨다', done: evos >= 1, pct: evos >= 1 ? 100 : 0 },
    { icon: '🗡', name: '무기 수집가', desc: '무기 5종 이상 획득한다', done: weapons >= 5, pct: Math.min(100, weapons / 5 * 100) },
    { icon: '🏃', name: '생존자', desc: '10분 이상 생존한다', done: (best.survivalTime ?? 0) >= 600, pct: Math.min(100, (best.survivalTime ?? 0) / 600 * 100) },
    { icon: '🌟', name: '전설적인 런', desc: '레벨 20 이상 달성한다', done: (best.level ?? 0) >= 20, pct: Math.min(100, (best.level ?? 0) / 20 * 100) },
    { icon: '💀', name: '오래된 전사', desc: '총 10번 이상 런을 완료한다', done: runs >= 10, pct: Math.min(100, runs / 10 * 100) },
  ];
}

export function buildCodexUnlockEntries(session, entries = unlockData) {
  const meta = session?.meta ?? {};
  const best = session?.best ?? {};
  const completedUnlocks = new Set(meta.completedUnlocks ?? []);
  const totalKills = Object.values(meta.enemyKills ?? {}).reduce((sum, value) => sum + value, 0);
  const bossKills = (meta.killedBosses ?? []).length;
  const weaponsUsed = new Set(meta.weaponsUsedAll ?? []);
  const evolvedWeapons = new Set(meta.evolvedWeapons ?? []);

  return entries.map((unlock) => {
    const done = completedUnlocks.has(unlock.id);
    let pct = 0;
    let progressText = '';

    switch (unlock.conditionType) {
      case 'total_kills_gte':
        pct = Math.min(100, totalKills / unlock.conditionValue * 100);
        progressText = `${totalKills} / ${unlock.conditionValue}`;
        break;
      case 'survival_time_gte': {
        const bestTime = best.survivalTime ?? 0;
        pct = Math.min(100, bestTime / unlock.conditionValue * 100);
        progressText = `${Math.floor(bestTime)} / ${unlock.conditionValue}초`;
        break;
      }
      case 'boss_kills_gte':
        pct = Math.min(100, bossKills / unlock.conditionValue * 100);
        progressText = `${bossKills} / ${unlock.conditionValue}`;
        break;
      case 'weapon_owned_once': {
        const owned = weaponsUsed.has(unlock.conditionValue);
        pct = owned ? 100 : 0;
        progressText = owned ? '달성' : unlock.conditionValue;
        break;
      }
      case 'weapon_evolved_once': {
        const evolved = evolvedWeapons.has(unlock.conditionValue);
        pct = evolved ? 100 : 0;
        progressText = evolved ? '달성' : unlock.conditionValue;
        break;
      }
      default:
        progressText = '-';
    }

    return {
      ...unlock,
      done,
      pct: done ? 100 : pct,
      progressText: done ? '완료' : progressText,
      icon: unlock.targetType === 'weapon' ? '🗡' : '🜂',
    };
  });
}
