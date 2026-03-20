/**
 * src/data/GameDataLoader.js
 *
 * MERGED:
 *   - Phase 2 Final: weaponEvolutionData 로드 추가
 *   - FIX(BUG-2): JSON clone 시 소멸되는 함수 필드(behaviorState) 및 Infinity 복원 전략 유지
 */
import { waveData }         from './waveData.js';
import { bossData }         from './bossData.js';
import { upgradeData }      from './upgradeData.js';
import { weaponData }       from './weaponData.js';
import { enemyData }        from './enemyData.js';
import { synergyData }      from './synergyData.js';
import { statusEffectData } from './statusEffectData.js';
import { weaponEvolutionData } from './weaponEvolutionData.js';

const FUNCTION_FIELD_MAP = [
  { arrayKey: 'enemyData',  fields: ['behaviorState'] },
];

function restoreSpecialFields(cloned, originals) {
  // 1. 함수 필드 복원
  for (const { arrayKey, fields } of FUNCTION_FIELD_MAP) {
    const clonedArr   = cloned[arrayKey];
    const originalArr = originals[arrayKey];
    if (!Array.isArray(clonedArr) || !Array.isArray(originalArr)) continue;

    clonedArr.forEach((item, i) => {
      const original = originalArr[i];
      if (!original) return;
      for (const field of fields) {
        if (typeof original[field] === 'function') {
          item[field] = original[field];
        }
      }
    });
  }

  // 2. Infinity 복원 (waveData.to)
  if (Array.isArray(cloned.waveData) && Array.isArray(originals.waveData)) {
    cloned.waveData.forEach((wave, i) => {
      if (originals.waveData[i]?.to === Infinity) {
        wave.to = Infinity;
      }
    });
  }
}

export const GameDataLoader = {
  loadDefault() {
    return this.loadWithOverrides({});
  },

  loadHardMode() {
    const data = this.loadDefault();
    data.waveData = data.waveData.map(wave => ({
      ...wave,
      spawnPerSecond: wave.spawnPerSecond * 1.5,
      eliteChance:    wave.eliteChance !== undefined
        ? Math.min(0.3, wave.eliteChance * 1.2)
        : wave.eliteChance,
    }));
    return data;
  },

  loadWithOverrides(overrides = {}) {
    const originals = {
      waveData, bossData, upgradeData, weaponData,
      enemyData, synergyData, statusEffectData, weaponEvolutionData
    };

    // 1단계: JSON clone
    const base = JSON.parse(JSON.stringify(originals));

    // 2단계: 특수 필드 복원
    restoreSpecialFields(base, originals);

    return { ...base, ...overrides };
  },
};
