import { ashPlainsStage } from './stages/ashPlainsStage.js';
import { moonCryptStage } from './stages/moonCryptStage.js';
import { emberHollowStage } from './stages/emberHollowStage.js';
import { frostHarborStage } from './stages/frostHarborStage.js';

export const stageData = [
  ashPlainsStage,
  moonCryptStage,
  emberHollowStage,
  frostHarborStage,
];

const DEFAULT_STAGE = Object.freeze({ ...stageData[0] });

export function normalizeStageId(stageId = null) {
  if (typeof stageId !== 'string' || stageId.length === 0) {
    return DEFAULT_STAGE.id;
  }
  return stageData.some((stage) => stage.id === stageId) ? stageId : DEFAULT_STAGE.id;
}

export function getStageById(stageId = null) {
  const normalizedId = normalizeStageId(stageId);
  return stageData.find((stage) => stage.id === normalizedId) ?? DEFAULT_STAGE;
}

export function getStageChoices() {
  return stageData.map((stage) => ({ ...stage }));
}
