import { validateCoreGameData } from '../data/gameDataValidation.js';

/** validateGameData — 초기화 시 데이터 무결성 검증 */
export function validateGameData({ upgradeData, weaponData, waveData }) {
  const report = validateCoreGameData({ upgradeData, weaponData, waveData });
  report.errors.forEach((message) => console.error(message));
  report.warnings.forEach((message) => console.warn(message));

  if (report.ok) console.debug('[validate] 모든 데이터 무결성 검증 통과');
  return report.ok;
}
