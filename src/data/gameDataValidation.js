import { AIM_PATTERN } from './constants/aiming.js';
import {
  VFX_SOURCE_DEFS,
  getProjectileSpriteAnimationDef,
  getProjectileSpriteFrame,
  getEffectSpriteSequenceDef,
  getEffectSpriteFrame,
} from '../renderer/sprites/vfxSpriteManifest.js';

function collectDuplicateIdErrors(items, label) {
  const ids = items.map((entry) => entry.id);
  return ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .map((id) => `[validate] ${label} 중복 id: ${id}`);
}

const ASSET_BUDGET_TIERS = new Set(['critical', 'standard', 'luxury']);
const ASSET_QUALITY_POLICIES = new Set(['fixed', 'scalable', 'fallback']);
const ASSET_SOURCE_TYPES = new Set(['dom', 'procedural', 'audio', 'image']);
const STAGE_BACKGROUND_MODES = new Set(['legacy_grid', 'seamless_tile']);
const AIM_PATTERNS = new Set(Object.values(AIM_PATTERN));

function validateAssetManifestEntries(assetManifest = []) {
  const errors = [];

  for (const entry of assetManifest) {
    if (!entry?.id) continue;
    if (typeof entry.preloadGroup !== 'string' || entry.preloadGroup.length <= 0) {
      errors.push(`[validate] assetManifest "${entry.id}" preloadGroup가 비어 있음`);
    }
    if (!ASSET_BUDGET_TIERS.has(entry.budgetTier)) {
      errors.push(`[validate] assetManifest "${entry.id}" budgetTier가 유효하지 않음`);
    }
    if (!Number.isFinite(entry.estimatedBytes) || entry.estimatedBytes <= 0) {
      errors.push(`[validate] assetManifest "${entry.id}" estimatedBytes가 유효하지 않음`);
    }
    if (!ASSET_QUALITY_POLICIES.has(entry.qualityPolicy)) {
      errors.push(`[validate] assetManifest "${entry.id}" qualityPolicy가 유효하지 않음`);
    }
    if (!ASSET_SOURCE_TYPES.has(entry.sourceType)) {
      errors.push(`[validate] assetManifest "${entry.id}" sourceType이 유효하지 않음`);
    }
    if (
      entry.sourceType === 'image'
      && entry.category === 'fx_surface'
      && entry.files?.src !== undefined
      && (typeof entry.files.src !== 'string' || entry.files.src.length <= 0)
    ) {
      errors.push(`[validate] assetManifest "${entry.id}" files.src가 유효하지 않음`);
    }
    if (entry.category === 'stage_background' && entry.sourceType === 'image') {
      if (typeof entry.files?.baseSrc !== 'string' || entry.files.baseSrc.length <= 0) {
        errors.push(`[validate] assetManifest "${entry.id}" files.baseSrc가 비어 있음`);
      }
      if (
        entry.files?.overlaySrc !== undefined
        && (typeof entry.files.overlaySrc !== 'string' || entry.files.overlaySrc.length <= 0)
      ) {
        errors.push(`[validate] assetManifest "${entry.id}" files.overlaySrc가 유효하지 않음`);
      }
      if (
        entry.files?.overlayAlpha !== undefined
        && (
          !Number.isFinite(entry.files.overlayAlpha)
          || entry.files.overlayAlpha < 0
          || entry.files.overlayAlpha > 1
        )
      ) {
        errors.push(`[validate] assetManifest "${entry.id}" files.overlayAlpha가 유효하지 않음`);
      }
    }
  }

  return errors;
}

function validateStageBackground(stage = {}) {
  const errors = [];
  const background = stage.background;
  if (!background || typeof background !== 'object') return errors;

  const mode = background.mode ?? 'legacy_grid';
  if (!STAGE_BACKGROUND_MODES.has(mode)) {
    errors.push(`[validate] stageData "${stage.id}" background.mode가 유효하지 않음`);
    return errors;
  }

  if (mode !== 'seamless_tile') return errors;

  if (!Number.isFinite(background.tileSize) || background.tileSize <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.tileSize가 유효하지 않음`);
  }

  if (!background.palette || typeof background.palette !== 'object') {
    errors.push(`[validate] stageData "${stage.id}" background.palette가 없음`);
    return errors;
  }

  if (typeof background.palette.base !== 'string' || background.palette.base.length <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.palette.base가 비어 있음`);
  }
  if (typeof background.palette.ember !== 'string' || background.palette.ember.length <= 0) {
    errors.push(`[validate] stageData "${stage.id}" background.palette.ember가 비어 있음`);
  }

  if (background.images !== undefined && (!background.images || typeof background.images !== 'object')) {
    errors.push(`[validate] stageData "${stage.id}" background.images가 유효하지 않음`);
  }

  return errors;
}

function resolveProjectileSourceKey(projectileVisualId) {
  return (
    getProjectileSpriteAnimationDef(projectileVisualId)?.sourceKey
    ?? getProjectileSpriteFrame(projectileVisualId)?.sourceKey
    ?? null
  );
}

function resolveEffectSourceKey(effectVisualId) {
  return (
    getEffectSpriteSequenceDef(effectVisualId)?.sourceKey
    ?? getEffectSpriteFrame(effectVisualId)?.sourceKey
    ?? null
  );
}

function validateProjectileVisualRef(errors, referencedSourceKeys, ownerLabel, fieldName, projectileVisualId) {
  if (!projectileVisualId) return;
  const sourceKey = resolveProjectileSourceKey(projectileVisualId);
  if (!sourceKey) {
    errors.push(`[validate] ${ownerLabel} ${fieldName} "${projectileVisualId}"가 VFX catalog에 없음`);
    return;
  }
  referencedSourceKeys.add(sourceKey);
}

function validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, fieldName, effectVisualId) {
  if (!effectVisualId) return;
  const sourceKey = resolveEffectSourceKey(effectVisualId);
  if (!sourceKey) {
    errors.push(`[validate] ${ownerLabel} ${fieldName} "${effectVisualId}"가 VFX catalog에 없음`);
    return;
  }
  referencedSourceKeys.add(sourceKey);
}

function validateReferencedVfxSources(assetManifest = [], referencedSourceKeys = new Set()) {
  const errors = [];
  const assetsById = new Map(assetManifest.map((entry) => [entry?.id, entry]));

  for (const sourceKey of referencedSourceKeys) {
    const sourceDef = VFX_SOURCE_DEFS[sourceKey];
    if (!sourceDef) {
      errors.push(`[validate] VFX source "${sourceKey}" 정의가 없음`);
      continue;
    }

    const assetId = sourceDef.assetId;
    if (!assetId) {
      errors.push(`[validate] VFX source "${sourceKey}" assetId가 비어 있음`);
      continue;
    }

    const assetEntry = assetsById.get(assetId);
    if (!assetEntry) {
      errors.push(`[validate] VFX source "${sourceKey}" → 존재하지 않는 assetManifest "${assetId}"`);
      continue;
    }

    if (assetEntry.sourceType !== 'image') {
      errors.push(`[validate] VFX source "${sourceKey}" asset "${assetId}" sourceType이 image가 아님`);
    }

    if (typeof assetEntry.files?.src !== 'string' || assetEntry.files.src.length <= 0) {
      errors.push(`[validate] VFX source "${sourceKey}" asset "${assetId}" files.src가 비어 있음`);
      continue;
    }

    if (assetEntry.files.src !== sourceDef.src) {
      errors.push(`[validate] VFX source "${sourceKey}" asset "${assetId}" files.src가 manifest src와 다름`);
    }
  }

  return errors;
}

function validateWeaponVisualContracts(weaponData, errors, referencedSourceKeys) {
  for (const weapon of weaponData) {
    if (weapon.maxLevel !== undefined && weapon.maxLevel < 1) {
      errors.push(`[validate] weaponData "${weapon.id}" maxLevel < 1`);
    }
    if (weapon.behaviorId && typeof weapon.behaviorId !== 'string') {
      errors.push(`[validate] weaponData "${weapon.id}" behaviorId가 문자열이 아님`);
    }
    if (weapon.aimPattern !== undefined && !AIM_PATTERNS.has(weapon.aimPattern)) {
      errors.push(`[validate] weaponData "${weapon.id}" aimPattern이 유효하지 않음`);
    }
    if (weapon.aimSpread !== undefined && (!Number.isFinite(weapon.aimSpread) || weapon.aimSpread < 0)) {
      errors.push(`[validate] weaponData "${weapon.id}" aimSpread가 유효하지 않음`);
    }

    validateProjectileVisualRef(errors, referencedSourceKeys, `weaponData "${weapon.id}"`, 'projectileVisualId', weapon.projectileVisualId);
    validateEffectVisualRef(errors, referencedSourceKeys, `weaponData "${weapon.id}"`, 'impactEffectVisualId', weapon.impactEffectVisualId);
  }
}

function validateEnemyVisualContracts(enemyData, errors, referencedSourceKeys) {
  for (const enemy of enemyData) {
    const projectileConfig = enemy?.projectileConfig;
    if (!projectileConfig || typeof projectileConfig !== 'object') continue;
    const ownerLabel = `enemyData "${enemy.id}" projectileConfig`;
    validateProjectileVisualRef(errors, referencedSourceKeys, ownerLabel, 'projectileVisualId', projectileConfig.projectileVisualId);
    validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'impactEffectVisualId', projectileConfig.impactEffectVisualId);
  }
}

function getBossPhaseActions(phase = {}) {
  const actions = [];
  if (phase.phaseAction && typeof phase.phaseAction === 'object') actions.push(phase.phaseAction);
  if (Array.isArray(phase.phaseActions)) {
    actions.push(...phase.phaseActions.filter(Boolean));
  }
  return actions;
}

function validateBossVisualContracts(bossData, errors, referencedSourceKeys) {
  for (const boss of bossData) {
    for (const phase of boss?.phases ?? []) {
      for (const action of getBossPhaseActions(phase)) {
        const ownerLabel = `bossData "${boss.enemyId ?? boss.at ?? 'unknown'}" phaseAction "${action.type ?? 'unknown'}"`;
        validateProjectileVisualRef(errors, referencedSourceKeys, ownerLabel, 'projectileVisualId', action.projectileVisualId);
        validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'impactEffectVisualId', action.impactEffectVisualId);
        validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'effectVisualId', action.effectVisualId);
      }
    }
  }
}

function validateStageVisualContracts(stageData, errors, referencedSourceKeys, assetIds) {
  for (const stage of stageData) {
    if (!stage?.id) continue;
    errors.push(...validateStageBackground(stage));
    if (!stage.assets?.backgroundKey) {
      errors.push(`[validate] stageData "${stage.id}" backgroundKey 없음`);
    } else if (!assetIds.has(stage.assets.backgroundKey)) {
      errors.push(`[validate] stageData "${stage.id}" → 존재하지 않는 backgroundKey "${stage.assets.backgroundKey}"`);
    }
    if (!stage.assets?.bossCueKey) {
      errors.push(`[validate] stageData "${stage.id}" bossCueKey 없음`);
    } else if (!assetIds.has(stage.assets.bossCueKey)) {
      errors.push(`[validate] stageData "${stage.id}" → 존재하지 않는 bossCueKey "${stage.assets.bossCueKey}"`);
    }

    for (const gimmick of stage.gimmicks ?? []) {
      const ownerLabel = `stageData "${stage.id}" gimmick "${gimmick.id ?? gimmick.type ?? 'unknown'}"`;
      validateProjectileVisualRef(errors, referencedSourceKeys, ownerLabel, 'projectileVisualId', gimmick.projectileVisualId);
      validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'impactEffectVisualId', gimmick.impactEffectVisualId);
      validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'effectVisualId', gimmick.effectVisualId);
    }

    if (stage.bossEcho) {
      const ownerLabel = `stageData "${stage.id}" bossEcho "${stage.bossEcho.id ?? stage.bossEcho.type ?? 'unknown'}"`;
      validateProjectileVisualRef(errors, referencedSourceKeys, ownerLabel, 'projectileVisualId', stage.bossEcho.projectileVisualId);
      validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'impactEffectVisualId', stage.bossEcho.impactEffectVisualId);
      validateEffectVisualRef(errors, referencedSourceKeys, ownerLabel, 'effectVisualId', stage.bossEcho.effectVisualId);
    }
  }
}

export function validateCoreGameData({
  upgradeData = [],
  weaponData = [],
  enemyData = [],
  bossData = [],
  waveData = [],
  stageData = [],
  assetManifest = [],
} = {}) {
  const errors = [];
  const warnings = [];
  const referencedSourceKeys = new Set();

  errors.push(...collectDuplicateIdErrors(upgradeData, 'upgradeData'));
  errors.push(...collectDuplicateIdErrors(weaponData, 'weaponData'));
  errors.push(...collectDuplicateIdErrors(assetManifest, 'assetManifest'));
  errors.push(...validateAssetManifestEntries(assetManifest));

  for (const upgrade of upgradeData) {
    if (!upgrade.weaponId) continue;
    if (!weaponData.some((weapon) => weapon.id === upgrade.weaponId)) {
      errors.push(`[validate] upgradeData "${upgrade.id}" → 존재하지 않는 weaponId "${upgrade.weaponId}"`);
    }
  }

  validateWeaponVisualContracts(weaponData, errors, referencedSourceKeys);
  validateEnemyVisualContracts(enemyData, errors, referencedSourceKeys);
  validateBossVisualContracts(bossData, errors, referencedSourceKeys);

  waveData.forEach((wave, index) => {
    if (wave.spawnPerSecond < 0) {
      errors.push(`[validate] waveData[${index}] spawnPerSecond < 0`);
    }
    if (wave.from >= wave.to) {
      errors.push(`[validate] waveData[${index}] from >= to`);
    }
  });

  const assetIds = new Set(assetManifest.map((entry) => entry?.id).filter(Boolean));
  validateStageVisualContracts(stageData, errors, referencedSourceKeys, assetIds);
  errors.push(...validateReferencedVfxSources(assetManifest, referencedSourceKeys));

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
