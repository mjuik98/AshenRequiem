const CELL = 256;

export const VFX_ATLAS_DEFS = {
  projectiles: {
    src: '/assets/vfx/projectiles-atlas.png',
    cellSize: CELL,
    width: CELL * 8,
    height: CELL * 3,
  },
  effects: {
    src: '/assets/vfx/effects-atlas.png',
    cellSize: CELL,
    width: CELL * 4,
    height: CELL * 3,
  },
};

const PROJECTILE_FRAMES = {};

const PROJECTILE_ANIMATION_DEFS = {
  magic_bolt: {
    atlas: 'projectiles',
    columnOffset: 0,
    sizeMult: 3.4,
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
    },
  },
  arcane_nova: {
    atlas: 'projectiles',
    columnOffset: 4,
    sizeMult: 3.8,
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
    },
  },
};

const EFFECT_FRAMES = {
  burst: {
    atlas: 'effects',
    x: 0,
    y: 0,
    w: CELL,
    h: CELL,
    drawMode: 'burst',
    sizeMult: 2.6,
  },
};

const EFFECT_SEQUENCE_DEFS = {
  magic_bolt_impact: {
    atlas: 'effects',
    row: 1,
    drawMode: 'burst',
    sizeMult: 2.9,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  arcane_nova_impact: {
    atlas: 'effects',
    row: 2,
    drawMode: 'burst',
    sizeMult: 3.2,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
};

function buildProjectileAnimationFrame(visualId, sourceFrameIndex) {
  const def = PROJECTILE_ANIMATION_DEFS[visualId];
  if (!def || !Number.isFinite(sourceFrameIndex) || sourceFrameIndex < 0 || sourceFrameIndex > 11) {
    return null;
  }

  const localColumn = sourceFrameIndex % 4;
  const localRow = Math.floor(sourceFrameIndex / 4);
  return {
    atlas: def.atlas,
    x: (def.columnOffset + localColumn) * CELL,
    y: localRow * CELL,
    w: CELL,
    h: CELL,
    sizeMult: def.sizeMult,
    rotateWithVelocity: def.rotateWithVelocity,
  };
}

function buildEffectSequenceFrame(effectType, sourceFrameIndex) {
  const def = EFFECT_SEQUENCE_DEFS[effectType];
  if (!def || !Number.isFinite(sourceFrameIndex) || sourceFrameIndex < 12 || sourceFrameIndex > 15) {
    return null;
  }

  return {
    atlas: def.atlas,
    x: (sourceFrameIndex - 12) * CELL,
    y: def.row * CELL,
    w: CELL,
    h: CELL,
    drawMode: def.drawMode,
    sizeMult: def.sizeMult,
  };
}

export function getProjectileSpriteAnimationDef(projectileVisualId) {
  return PROJECTILE_ANIMATION_DEFS[projectileVisualId] ?? null;
}

export function getProjectileSpriteFrame(behaviorId = 'default') {
  return PROJECTILE_FRAMES[behaviorId] ?? null;
}

export function getProjectileAnimationFrame(projectileVisualId, sourceFrameIndex) {
  return buildProjectileAnimationFrame(projectileVisualId, sourceFrameIndex);
}

export function getEffectSpriteSequenceDef(effectType) {
  return EFFECT_SEQUENCE_DEFS[effectType] ?? null;
}

export function getEffectSpriteFrame(effectType) {
  return EFFECT_FRAMES[effectType] ?? null;
}

export function getEffectSequenceFrame(effectType, sourceFrameIndex) {
  return buildEffectSequenceFrame(effectType, sourceFrameIndex);
}
