/**
 * src/data/GameDataLoader.js
 *
 * PATCH:
 * - JSON stringify/parse 기반 복제를 제거하고 안전한 deep clone으로 교체
 * - 함수, Infinity, 배열/객체를 보존하면서 데이터셋 변경에 더 견고하게 동작
 * - overrides는 기존과 동일하게 최상위 키 기준으로 덮어쓰기
 */
import { waveData }            from './waveData.js';
import { bossData }            from './bossData.js';
import { upgradeData }         from './upgradeData.js';
import { weaponData }          from './weaponData.js';
import { enemyData }           from './enemyData.js';
import { synergyData }         from './synergyData.js';
import { statusEffectData }    from './statusEffectData.js';
import { weaponEvolutionData } from './weaponEvolutionData.js';
import { weaponProgressionData } from './weaponProgressionData.js';
import { accessoryData }       from './accessoryData.js';
import { propDropData }        from './propDropData.js';
import { stageData }           from './stageData.js';
import { archetypeData }       from './archetypeData.js';
import { riskRelicData }       from './riskRelicData.js';
import { ascensionData }       from './ascensionData.js';
import { unlockData }          from './unlockData.js';
import { permanentUpgradeData } from './permanentUpgradeData.js';
import { assetManifest }       from './assetManifest.js';

function deepCloneValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (typeof value === 'function') return value;

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const arr = [];
    seen.set(value, arr);
    for (const item of value) {
      arr.push(deepCloneValue(item, seen));
    }
    return arr;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const item of value) {
      clonedSet.add(deepCloneValue(item, seen));
    }
    return clonedSet;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [key, mapValue] of value.entries()) {
      clonedMap.set(deepCloneValue(key, seen), deepCloneValue(mapValue, seen));
    }
    return clonedMap;
  }

  const clonedObject = {};
  seen.set(value, clonedObject);
  for (const [key, objectValue] of Object.entries(value)) {
    clonedObject[key] = deepCloneValue(objectValue, seen);
  }
  return clonedObject;
}

function cloneGameData(originals) {
  const cloned = {};
  for (const [key, value] of Object.entries(originals)) {
    cloned[key] = deepCloneValue(value);
  }
  return cloned;
}

function cloneStageBackgroundFiles(files) {
  if (!files || typeof files !== 'object') return null;
  if (typeof files.baseSrc !== 'string' || files.baseSrc.length <= 0) return null;
  return {
    baseSrc: files.baseSrc,
    overlaySrc: typeof files.overlaySrc === 'string' ? files.overlaySrc : null,
    overlayAlpha: Number.isFinite(files.overlayAlpha) ? files.overlayAlpha : 0.18,
  };
}

function hydrateStageBackgroundAssets(stageEntries = [], assetEntries = []) {
  const backgroundFilesByKey = new Map(
    assetEntries
      .filter((entry) => entry?.category === 'stage_background')
      .map((entry) => [entry.id, cloneStageBackgroundFiles(entry.files)]),
  );

  return stageEntries.map((stage) => {
    if (!stage?.background || typeof stage.background !== 'object') return stage;

    const hydratedImages = backgroundFilesByKey.get(stage.assets?.backgroundKey) ?? null;
    const nextBackground = { ...stage.background };
    if (hydratedImages) {
      nextBackground.images = hydratedImages;
    } else if (!nextBackground.images || typeof nextBackground.images !== 'object') {
      delete nextBackground.images;
    }

    return {
      ...stage,
      background: nextBackground,
    };
  });
}

export const GameDataLoader = {
  clone(data = {}) {
    return deepCloneValue(data);
  },

  loadDefault() {
    return this.loadWithOverrides({});
  },

  loadHardMode() {
    const data = this.loadDefault();
    data.waveData = data.waveData.map(wave => ({
      ...wave,
      spawnPerSecond: wave.spawnPerSecond * 1.5,
      eliteChance:
        wave.eliteChance !== undefined
          ? Math.min(0.3, wave.eliteChance * 1.2)
          : wave.eliteChance,
    }));
    return data;
  },

  loadWithOverrides(overrides = {}) {
    const originals = {
      waveData,
      bossData,
      upgradeData,
      weaponData,
      enemyData,
      synergyData,
      statusEffectData,
      weaponEvolutionData,
      weaponProgressionData,
      accessoryData,
      propDropData,
      stageData,
      archetypeData,
      riskRelicData,
      ascensionData,
      unlockData,
      permanentUpgradeData,
      assetManifest,
    };

    const base = cloneGameData(originals);
    const merged = { ...base, ...overrides };
    return {
      ...merged,
      stageData: hydrateStageBackgroundAssets(merged.stageData ?? [], merged.assetManifest ?? []),
    };
  },
};
