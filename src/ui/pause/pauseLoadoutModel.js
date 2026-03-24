import {
  escapeHtml,
  normalizePauseSynergyRequirementId,
  formatCompactNumber,
  formatSeconds,
  getKindLabel,
  toArray,
} from './pauseLoadoutFormatting.js';
import {
  buildPauseLoadoutItems,
  findSelectedItem,
  getDefaultPauseSelection,
  getItemDefinition,
} from './pauseLoadoutItems.js';
import {
  buildRequirementReference,
  getBehaviorLabel,
  getReferenceGlyphForRequirement,
  getSlotIcon,
  isReferenceEquipped,
} from './pauseLoadoutIcons.js';
import { getStatusLabel } from './pauseLoadoutLabels.js';
import {
  getRelatedItems,
  hasSynergyActive,
  isEvolutionReady,
} from './pauseLoadoutRelationships.js';

export {
  buildPauseLoadoutItems,
  buildRequirementReference,
  escapeHtml,
  findSelectedItem,
  formatCompactNumber,
  formatSeconds,
  getBehaviorLabel,
  getKindLabel,
  getRelatedItems,
  getDefaultPauseSelection,
  getItemDefinition,
  getReferenceGlyphForRequirement,
  getSlotIcon,
  getStatusLabel,
  hasSynergyActive,
  isReferenceEquipped,
  isEvolutionReady,
  normalizePauseSynergyRequirementId,
  toArray,
};
