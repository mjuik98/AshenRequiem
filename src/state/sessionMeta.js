/**
 * src/state/sessionMeta.js
 *
 * SessionState.meta 공통 기본값과 보정 헬퍼를 제공한다.
 */

export function createDefaultSessionMeta() {
  return {
    currency:              0,
    permanentUpgrades:     {},
    enemyKills:            {},
    enemiesEncountered:    [],
    killedBosses:          [],
    weaponsUsedAll:        [],
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
  meta.selectedStartWeaponId = typeof meta.selectedStartWeaponId === 'string'
    ? meta.selectedStartWeaponId
    : defaults.selectedStartWeaponId;

  return meta;
}

export function appendUnique(base = [], additions = []) {
  return [...new Set([...(base ?? []), ...(additions ?? [])])];
}
