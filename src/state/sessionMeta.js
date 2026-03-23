/**
 * src/state/sessionMeta.js
 *
 * SessionState.meta 공통 기본값과 보정 헬퍼를 제공한다.
 */
import { unlockData } from '../data/unlockData.js';
import { evaluateUnlocks } from '../systems/progression/unlockEvaluator.js';

export function createDefaultSessionMeta() {
  return {
    currency:              0,
    permanentUpgrades:     {},
    enemyKills:            {},
    enemiesEncountered:    [],
    killedBosses:          [],
    weaponsUsedAll:        [],
    accessoriesOwnedAll:   [],
    evolvedWeapons:        [],
    totalRuns:             0,
    unlockedWeapons:       ['magic_bolt'],
    unlockedAccessories:   [],
    completedUnlocks:      [],
    selectedStartWeaponId: 'magic_bolt',
  };
}

export function ensureCodexMeta(session) {
  const defaults = createDefaultSessionMeta();
  const meta = session.meta ??= {};

  meta.currency ??= defaults.currency;
  meta.permanentUpgrades = { ...(meta.permanentUpgrades ?? defaults.permanentUpgrades) };
  meta.enemyKills = { ...(meta.enemyKills ?? defaults.enemyKills) };
  meta.enemiesEncountered = Array.isArray(meta.enemiesEncountered)
    ? [...meta.enemiesEncountered]
    : [...defaults.enemiesEncountered];
  meta.killedBosses = Array.isArray(meta.killedBosses)
    ? [...meta.killedBosses]
    : [...defaults.killedBosses];
  meta.weaponsUsedAll = Array.isArray(meta.weaponsUsedAll)
    ? [...meta.weaponsUsedAll]
    : [...defaults.weaponsUsedAll];
  meta.accessoriesOwnedAll = Array.isArray(meta.accessoriesOwnedAll)
    ? [...meta.accessoriesOwnedAll]
    : [...defaults.accessoriesOwnedAll];
  meta.evolvedWeapons = Array.isArray(meta.evolvedWeapons)
    ? [...meta.evolvedWeapons]
    : [...defaults.evolvedWeapons];
  meta.totalRuns ??= defaults.totalRuns;
  meta.unlockedWeapons = Array.isArray(meta.unlockedWeapons)
    ? [...meta.unlockedWeapons]
    : [...defaults.unlockedWeapons];
  meta.unlockedAccessories = Array.isArray(meta.unlockedAccessories)
    ? [...meta.unlockedAccessories]
    : [...defaults.unlockedAccessories];
  meta.completedUnlocks = Array.isArray(meta.completedUnlocks)
    ? [...meta.completedUnlocks]
    : [...defaults.completedUnlocks];
  if (!Array.isArray(meta.unlockedWeapons) || meta.unlockedWeapons.length === 0) {
    meta.unlockedWeapons = [...defaults.unlockedWeapons];
  }
  meta.selectedStartWeaponId = typeof meta.selectedStartWeaponId === 'string'
    && meta.unlockedWeapons.includes(meta.selectedStartWeaponId)
    ? meta.selectedStartWeaponId
    : meta.unlockedWeapons[0] ?? defaults.selectedStartWeaponId;

  return meta;
}

export function appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}

export function reconcileSessionUnlocks(session) {
  const meta = ensureCodexMeta(session);
  const unlockResult = evaluateUnlocks({
    session,
    runResult: {
      kills: session?.best?.kills ?? 0,
      survivalTime: session?.best?.survivalTime ?? 0,
      level: session?.best?.level ?? 1,
      weaponsUsed: meta.weaponsUsedAll ?? [],
    },
    unlockData,
  });

  meta.completedUnlocks = appendUnique(meta.completedUnlocks, unlockResult.newlyCompletedUnlocks);
  meta.unlockedWeapons = appendUnique(meta.unlockedWeapons, unlockResult.newlyUnlockedWeapons);
  meta.unlockedAccessories = appendUnique(meta.unlockedAccessories, unlockResult.newlyUnlockedAccessories);

  return session;
}
