import {
  escapeHtml,
  normalizePauseSynergyRequirementId,
  toArray,
} from './pauseLoadoutFormatting.js';
import { getItemDefinition } from './pauseLoadoutItems.js';

function getIndexedItemById(id, indexes) {
  if (!id) return null;
  const weapon = indexes?.weaponById?.get(id);
  if (weapon) return { kind: 'weapon', id, item: weapon };
  const accessory = indexes?.accessoryById?.get(id);
  if (accessory) return { kind: 'accessory', id, item: accessory };
  return null;
}

function getReferenceGlyph(kind) {
  if (kind === 'weapon') return '⚔';
  if (kind === 'accessory') return '◈';
  return '•';
}

export function getBehaviorLabel(behaviorId) {
  const labels = {
    targetProjectile: '투사체',
    areaBurst: '광역',
    orbit: '궤도',
    boomerang: '부메랑',
    chainLightning: '연쇄',
    omnidirectional: '전방향',
    laserBeam: '레이저',
    groundZone: '장판',
    ricochetProjectile: '반사',
  };
  return labels[behaviorId] ?? '무기';
}

export function getSlotIcon(item, indexes) {
  if (item?.kind === 'empty' || item?.kind === 'locked') {
    return '<span class="pv-slot-icon-glyph muted">+</span>';
  }

  const definition = getItemDefinition(item, indexes);
  if (definition?.icon) {
    return `<span class="pv-slot-icon-glyph">${escapeHtml(definition.icon)}</span>`;
  }

  const iconMap = {
    targetProjectile: '◈',
    orbit: '◉',
    areaBurst: '✦',
    boomerang: '↺',
    chainLightning: '⚡',
    omnidirectional: '✸',
    laserBeam: '→',
    groundZone: '⊚',
    ricochetProjectile: '◆',
  };
  return `<span class="pv-slot-icon-glyph">${iconMap[item?.source?.behaviorId] ?? '⚔'}</span>`;
}

export function buildRequirementReference(requirement, indexes) {
  const id = normalizePauseSynergyRequirementId(requirement);
  if (!id) return null;
  const resolved = getIndexedItemById(id, indexes);
  if (resolved) return resolved;
  return { kind: 'unknown', id, item: null };
}

export function isReferenceEquipped(reference, player) {
  if (!reference?.kind || reference.kind === 'unknown') return false;
  const source = reference.kind === 'weapon' ? toArray(player?.weapons) : toArray(player?.accessories);
  return new Set(source.map((item) => item?.id).filter(Boolean)).has(reference.id);
}

export function getReferenceGlyphForRequirement(kind) {
  return getReferenceGlyph(kind);
}
