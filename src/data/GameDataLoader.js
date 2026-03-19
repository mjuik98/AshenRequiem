/**
 * src/data/GameDataLoader.js
 *
 * 모든 게임 데이터를 통합적으로 로딩하고 관리한다.
 * 딥 카피를 통해 원본 데이터 오염을 방지하며, 난이도별 데이터 변조 기능을 지원한다.
 */
import { waveData }         from './waveData.js';
import { bossData }         from './bossData.js';
import { upgradeData }      from './upgradeData.js';
import { weaponData }       from './weaponData.js';
import { enemyData }        from './enemyData.js';
import { synergyData }      from './synergyData.js';
import { statusEffectData } from './statusEffectData.js';

export const GameDataLoader = {
  /**
   * 기본 데이터를 로딩하여 반환한다.
   * @returns {object}
   */
  loadDefault() {
    return this.loadWithOverrides({});
  },

  /**
   * 하드 모드 데이터를 로딩한다. (스폰 속도 증가 등)
   * @returns {object}
   */
  loadHardMode() {
    const data = this.loadDefault();
    
    // 웨이브 데이터 변조: 스폰 속도 1.5배, 엘리트 확률 클램프(Max 0.3)
    data.waveData = data.waveData.map(w => ({
      ...w,
      spawnPerSecond: w.spawnPerSecond * 1.5,
      eliteChance:    w.eliteChance !== undefined ? Math.min(0.3, w.eliteChance * 1.2) : w.eliteChance
    }));

    return data;
  },

  /**
   * 특정 데이터를 오버라이드하여 로딩한다.
   * @param {object} overrides 
   * @returns {object}
   */
  loadWithOverrides(overrides = {}) {
    // 딥 카피를 수행하여 원본 모듈의 데이터가 수정되지 않도록 보호
    const base = {
      waveData:         JSON.parse(JSON.stringify(waveData)),
      bossData:         JSON.parse(JSON.stringify(bossData)),
      upgradeData:      JSON.parse(JSON.stringify(upgradeData)),
      weaponData:       JSON.parse(JSON.stringify(weaponData)),
      enemyData:        JSON.parse(JSON.stringify(enemyData)),
      synergyData:      JSON.parse(JSON.stringify(synergyData)),
      statusEffectData: JSON.parse(JSON.stringify(statusEffectData)),
    };

    return { ...base, ...overrides };
  }
};
