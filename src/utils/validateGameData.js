import { validateCoreGameData } from '../data/gameDataValidation.js';
import {
  logRuntimeError,
  logRuntimeInfo,
  logRuntimeWarn,
} from './runtimeLogger.js';

function normalizeValidationMessage(message) {
  return String(message).replace(/^\[validate\]\s*/, '');
}

/** validateGameData — 초기화 시 데이터 무결성 검증 */
export function validateGameData(gameData = {}) {
  const {
    upgradeData,
    weaponData,
    waveData,
    stageData,
    assetManifest,
  } = gameData;
  const report = validateCoreGameData({
    upgradeData,
    weaponData,
    waveData,
    stageData,
    assetManifest,
  });
  report.errors.forEach((message) => logRuntimeError('validate', normalizeValidationMessage(message)));
  report.warnings.forEach((message) => logRuntimeWarn('validate', normalizeValidationMessage(message)));

  if (report.ok) {
    logRuntimeInfo('validate', '모든 데이터 무결성 검증 통과');
  }
  return report.ok;
}
