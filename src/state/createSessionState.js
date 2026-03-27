export {
  createSessionState,
  normalizeSessionState as _normalizeSessionState,
  migrateSessionState as _migrate,
} from './session/sessionMigrations.js';
export {
  updateSessionBest,
  earnCurrency,
  purchasePermanentUpgrade,
} from './session/sessionCommands.js';
export {
  saveSession,
  loadSession,
  setSessionStorage,
  resetSessionStorage,
} from './session/sessionStorage.js';
export {
  createLocalSessionRepository,
  getSessionRepository,
  loadSessionState,
  saveSessionState,
  setSessionRepository,
  resetSessionRepository,
} from './session/sessionRepository.js';

/**
 * @typedef {Object} SessionState
 * @property {number}  _version
 * @property {{ kills: number, survivalTime: number, level: number, weaponsUsed: string[] }} last
 * @property {{ kills: number, survivalTime: number, level: number }} best
 * @property {{
 *   currency: number,
 *   permanentUpgrades: Record<string, number>,
 *   enemyKills: Record<string, number>,
 *   enemiesEncountered: string[],
 *   killedBosses: string[],
 *   weaponsUsedAll: string[],
 *   accessoriesOwnedAll: string[],
 *   evolvedWeapons: string[],
 *   totalRuns: number,
 *   unlockedWeapons: string[],
 *   unlockedAccessories: string[],
 *   completedUnlocks: string[],
 *   selectedStartWeaponId: string,
 *   selectedStartAccessoryId: string|null,
 *   selectedArchetypeId: string,
 *   selectedRiskRelicId: string|null,
 *   selectedStageId: string,
 *   selectedSeedMode: 'none'|'custom'|'daily',
 *   selectedSeedText: string,
 *   claimedDailyRewardSeeds: string[],
 *   recentRuns: object[],
 *   selectedAscensionLevel: number,
 *   highestAscensionCleared: number
 * }} meta
 * @property {{
 *   soundEnabled: boolean,
 *   musicEnabled: boolean,
 *   masterVolume: number,
 *   bgmVolume: number,
 *   sfxVolume: number,
 *   quality: 'low'|'medium'|'high',
 *   glowEnabled: boolean,
 *   showFps: boolean,
 *   useDevicePixelRatio: boolean,
 *   reducedMotion: boolean,
 *   highVisibilityHud: boolean,
 *   largeText: boolean,
 *   keyBindings: {
 *     moveUp: string[],
 *     moveDown: string[],
 *     moveLeft: string[],
 *     moveRight: string[],
 *     pause: string[],
 *     confirm: string[],
 *     debug: string[]
 *   }
 * }} options
 * @property {object|null} activeRun
 */

export {};
