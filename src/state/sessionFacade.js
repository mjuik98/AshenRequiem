/**
 * src/state/sessionFacade.js
 *
 * Legacy compatibility facade.
 * Real ownership lives under src/app/session/*.
 */

export {
  persistSession,
  setActiveRunAndSave,
  clearActiveRunAndSave,
  updateSessionOptionsAndSave,
  purchasePermanentUpgradeAndSave,
} from '../app/session/sessionPersistenceService.js';

export {
  setSelectedStartWeaponAndSave,
  setSelectedAscensionAndSave,
  setSelectedStartAccessoryAndSave,
  setSelectedArchetypeAndSave,
  setSelectedRiskRelicAndSave,
  setSelectedStageAndSave,
  setRunSeedSelectionAndSave,
} from '../app/session/loadoutSelectionWriteService.js';
