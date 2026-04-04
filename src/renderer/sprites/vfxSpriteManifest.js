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
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 5.2,
      stretchX: 1.28,
      stretchY: 0.92,
      glowBlur: 24,
      glowColor: '#f6f2a0',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 4.2,
      stretchX: 1.36,
      stretchY: 0.82,
      glowBlur: 20,
      glowColor: '#d7ff8f',
      opacity: 0.96,
    },
  },
  arcane_nova: {
    atlas: 'projectiles',
    columnOffset: 4,
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 6,
      stretchX: 1.42,
      stretchY: 0.96,
      glowBlur: 26,
      glowColor: '#ffb8ff',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 5,
      stretchX: 1.5,
      stretchY: 0.86,
      glowBlur: 22,
      glowColor: '#f38bff',
      opacity: 0.98,
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
    sizeMult: 4.2,
    glowBlur: 24,
    glowColor: '#f5ef96',
    opacity: 1,
    growthMult: 1.25,
    alphaFloor: 0.36,
    fadeFactor: 0.46,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  arcane_nova_impact: {
    atlas: 'effects',
    row: 2,
    drawMode: 'burst',
    sizeMult: 4,
    glowBlur: 26,
    glowColor: '#f29dff',
    opacity: 1,
    growthMult: 1.4,
    alphaFloor: 0.34,
    fadeFactor: 0.48,
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

  const style = sourceFrameIndex <= def.intro.end ? def.intro : def.flight;

  const localColumn = sourceFrameIndex % 4;
  const localRow = Math.floor(sourceFrameIndex / 4);
  return {
    atlas: def.atlas,
    x: (def.columnOffset + localColumn) * CELL,
    y: localRow * CELL,
    w: CELL,
    h: CELL,
    sizeMult: style.sizeMult,
    stretchX: style.stretchX ?? 1,
    stretchY: style.stretchY ?? 1,
    rotateWithVelocity: def.rotateWithVelocity,
    glowBlur: style.glowBlur,
    glowColor: style.glowColor,
    opacity: style.opacity,
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
    glowBlur: def.glowBlur,
    glowColor: def.glowColor,
    opacity: def.opacity,
    growthMult: def.growthMult,
    alphaFloor: def.alphaFloor,
    fadeFactor: def.fadeFactor,
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
