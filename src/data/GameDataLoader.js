/**
 * src/data/GameDataLoader.js
 *
 * FIX(BUG-2): JSON.parse(JSON.stringify()) 가 함수 필드를 소멸시키는 버그 수정
 *
 *   Before (버그):
 *     enemyData: JSON.parse(JSON.stringify(enemyData))
 *     → behaviorState: () => ({ phase: 'idle', ... }) 함수가 JSON 직렬화 과정에서 null로 소멸
 *     → createEnemy() 가 behaviorState() 호출 시 TypeError: null is not a function
 *     → elite_golem, elite_bat, elite_skeleton, boss_lich 생성 즉시 크래시
 *
 *   After (수정):
 *     두 단계 clone 전략:
 *       1. JSON clone: 순수 데이터 필드 (값 타입, 중첩 객체/배열)
 *       2. 함수 필드 복원: FUNCTION_FIELDS 목록의 필드를 원본 배열에서 직접 복사
 *
 *   대상 함수 필드:
 *     - enemyData[].behaviorState : () => object  (엘리트/보스 FSM 초기 상태 생성기)
 *
 *   장기 권고(AGENTS.md R-26):
 *     behaviorState 함수는 데이터 파일보다 createEnemy() 생성 시점에
 *     enemyBehaviorRegistry 또는 별도 initializer 맵에서 조회하는 것이 더 안전.
 *     현재 수정은 기존 구조를 유지하면서 버그만 해소.
 */
import { waveData }         from './waveData.js';
import { bossData }         from './bossData.js';
import { upgradeData }      from './upgradeData.js';
import { weaponData }       from './weaponData.js';
import { enemyData }        from './enemyData.js';
import { synergyData }      from './synergyData.js';
import { statusEffectData } from './statusEffectData.js';

/**
 * JSON 직렬화 시 소멸되는 함수 필드 목록.
 * 배열 이름과 복원할 필드명을 매핑한다.
 * @type {Array<{ arrayKey: string, fields: string[] }>}
 */
const FUNCTION_FIELD_MAP = [
  { arrayKey: 'enemyData',  fields: ['behaviorState'] },
];

/**
 * JSON 직렬화 시 소멸되는 함수 필드 및 Infinity 등을 원본 배열에서 복원한다.
 *
 * @param {object} cloned  JSON clone된 데이터 묶음 객체
 * @param {object} originals  원본 배열 참조 묶음 객체
 */
function restoreSpecialFields(cloned, originals) {
  // 1. 명시된 함수 필드 복원 (behaviorState 등)
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

  // 2. waveData의 Infinity 복원 (JSON.stringify 시 null로 변환됨)
  if (Array.isArray(cloned.waveData) && Array.isArray(originals.waveData)) {
    cloned.waveData.forEach((wave, i) => {
      const original = originals.waveData[i];
      if (original && original.to === Infinity) {
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
    data.waveData = data.waveData.map(w => ({
      ...w,
      spawnPerSecond: w.spawnPerSecond * 1.5,
      eliteChance:    w.eliteChance !== undefined
        ? Math.min(0.3, w.eliteChance * 1.2)
        : w.eliteChance,
    }));
    return data;
  },

  /**
   * 특정 데이터를 오버라이드하여 로딩한다.
   *
   * FIX(BUG-2): 두 단계 clone으로 함수 필드 보존
   *   1. JSON clone → 순수 데이터 deep copy (원본 오염 방지)
   *   2. restoreFunctionFields → behaviorState 등 함수 복원
   *
   * @param {object} overrides
   * @returns {object}
   */
  loadWithOverrides(overrides = {}) {
    const originals = { waveData, bossData, upgradeData, weaponData, enemyData, synergyData, statusEffectData };

    // 1단계: JSON deep clone (함수 필드는 null/undefined로 소멸됨 — 의도적)
    const base = JSON.parse(JSON.stringify(originals));

    // 2단계: 특수 필드 복원 (함수, Infinity 등)
    restoreSpecialFields(base, originals);

    return { ...base, ...overrides };
  },
};
