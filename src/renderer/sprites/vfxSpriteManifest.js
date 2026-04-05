const DEFAULT_CELL = 256;
const DEFAULT_SEQUENCE_COLUMNS = 4;

export const VFX_SOURCE_DEFS = {
  projectiles: {
    src: '/assets/vfx/projectiles-atlas.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 8,
    height: DEFAULT_CELL * 3,
  },
  effects: {
    src: '/assets/vfx/effects-atlas.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 3,
  },
  fire_bolt: {
    src: '/assets/vfx/fire_bolt.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
  fire_bolt_upgrade: {
    src: '/assets/vfx/fire_bolt_upgrade.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
  holy_bolt: {
    src: '/assets/vfx/holy_bolt.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
  holy_bolt_upgrade: {
    src: '/assets/vfx/holy_bolt_upgrade.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
  ice_bolt: {
    src: '/assets/vfx/ice_bolt.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
  ice_bolt_upgrade: {
    src: '/assets/vfx/ice_bolt_upgrade.png',
    cellSize: DEFAULT_CELL,
    width: DEFAULT_CELL * 4,
    height: DEFAULT_CELL * 4,
  },
};

export const VFX_ATLAS_DEFS = {
  projectiles: VFX_SOURCE_DEFS.projectiles,
  effects: VFX_SOURCE_DEFS.effects,
};

const PROJECTILE_FRAMES = {};

const PROJECTILE_ANIMATION_DEFS = {
  magic_bolt: {
    sourceKey: 'projectiles',
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
    sourceKey: 'projectiles',
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
  fire_bolt: {
    sourceKey: 'fire_bolt',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 5.6,
      stretchX: 1.34,
      stretchY: 0.92,
      glowBlur: 28,
      glowColor: '#ffb56c',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 4.8,
      stretchX: 1.56,
      stretchY: 0.82,
      glowBlur: 24,
      glowColor: '#ff8d42',
      opacity: 0.98,
    },
  },
  fire_bolt_upgrade: {
    sourceKey: 'fire_bolt_upgrade',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 6.2,
      stretchX: 1.42,
      stretchY: 0.94,
      glowBlur: 30,
      glowColor: '#ffc27c',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 5.3,
      stretchX: 1.66,
      stretchY: 0.84,
      glowBlur: 26,
      glowColor: '#ffa14d',
      opacity: 0.99,
    },
  },
  holy_bolt: {
    sourceKey: 'holy_bolt',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 4.9,
      stretchX: 1.22,
      stretchY: 0.9,
      glowBlur: 24,
      glowColor: '#fff1a6',
      opacity: 0.98,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 4.1,
      stretchX: 1.42,
      stretchY: 0.8,
      glowBlur: 20,
      glowColor: '#ffe27a',
      opacity: 0.96,
    },
  },
  holy_bolt_upgrade: {
    sourceKey: 'holy_bolt_upgrade',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.036,
      sizeMult: 5.4,
      stretchX: 1.28,
      stretchY: 0.9,
      glowBlur: 26,
      glowColor: '#fff6be',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.036,
      sizeMult: 4.5,
      stretchX: 1.5,
      stretchY: 0.8,
      glowBlur: 22,
      glowColor: '#ffeb9f',
      opacity: 0.98,
    },
  },
  ice_bolt: {
    sourceKey: 'ice_bolt',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.04,
      sizeMult: 5.1,
      stretchX: 1.24,
      stretchY: 0.9,
      glowBlur: 24,
      glowColor: '#a7e8ff',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.04,
      sizeMult: 4.2,
      stretchX: 1.44,
      stretchY: 0.82,
      glowBlur: 20,
      glowColor: '#7fd4ff',
      opacity: 0.98,
    },
  },
  ice_bolt_upgrade: {
    sourceKey: 'ice_bolt_upgrade',
    rotateWithVelocity: true,
    intro: {
      start: 0,
      end: 3,
      frameDuration: 0.038,
      sizeMult: 5.6,
      stretchX: 1.3,
      stretchY: 0.92,
      glowBlur: 26,
      glowColor: '#b8f0ff',
      opacity: 1,
    },
    flight: {
      start: 4,
      end: 11,
      loopStart: 4,
      loopEnd: 11,
      frameDuration: 0.038,
      sizeMult: 4.7,
      stretchX: 1.56,
      stretchY: 0.82,
      glowBlur: 22,
      glowColor: '#8de0ff',
      opacity: 0.99,
    },
  },
};

const EFFECT_FRAMES = {
  burst: {
    sourceKey: 'effects',
    x: 0,
    y: 0,
    w: DEFAULT_CELL,
    h: DEFAULT_CELL,
    drawMode: 'burst',
    sizeMult: 2.6,
  },
};

const EFFECT_SEQUENCE_DEFS = {
  magic_bolt_impact: {
    sourceKey: 'effects',
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
    sourceKey: 'effects',
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
  fire_bolt_impact: {
    sourceKey: 'fire_bolt',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.4,
    glowBlur: 26,
    glowColor: '#ff8b38',
    opacity: 1,
    growthMult: 1.38,
    alphaFloor: 0.3,
    fadeFactor: 0.5,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  fire_bolt_upgrade_impact: {
    sourceKey: 'fire_bolt_upgrade',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.8,
    glowBlur: 28,
    glowColor: '#ff9c42',
    opacity: 1,
    growthMult: 1.46,
    alphaFloor: 0.28,
    fadeFactor: 0.52,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  holy_bolt_impact: {
    sourceKey: 'holy_bolt',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.1,
    glowBlur: 24,
    glowColor: '#fff0ad',
    opacity: 1,
    growthMult: 1.34,
    alphaFloor: 0.3,
    fadeFactor: 0.5,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  holy_bolt_upgrade_impact: {
    sourceKey: 'holy_bolt_upgrade',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.5,
    glowBlur: 26,
    glowColor: '#fff3c4',
    opacity: 1,
    growthMult: 1.4,
    alphaFloor: 0.28,
    fadeFactor: 0.52,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  ice_bolt_impact: {
    sourceKey: 'ice_bolt',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.2,
    glowBlur: 24,
    glowColor: '#a9eeff',
    opacity: 1,
    growthMult: 1.36,
    alphaFloor: 0.3,
    fadeFactor: 0.5,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
  ice_bolt_upgrade_impact: {
    sourceKey: 'ice_bolt_upgrade',
    row: 3,
    drawMode: 'burst',
    sizeMult: 4.6,
    glowBlur: 26,
    glowColor: '#b8f4ff',
    opacity: 1,
    growthMult: 1.42,
    alphaFloor: 0.28,
    fadeFactor: 0.52,
    oneShot: {
      start: 12,
      end: 15,
    },
  },
};

function resolveSourceDef(sourceKey) {
  return VFX_SOURCE_DEFS[sourceKey] ?? null;
}

function buildProjectileAnimationFrame(visualId, sourceFrameIndex) {
  const def = PROJECTILE_ANIMATION_DEFS[visualId];
  const sourceDef = resolveSourceDef(def?.sourceKey);
  const maxFrameIndex = Math.max(def?.intro?.end ?? -1, def?.flight?.end ?? -1);
  if (!def || !sourceDef || !Number.isFinite(sourceFrameIndex) || sourceFrameIndex < 0 || sourceFrameIndex > maxFrameIndex) {
    return null;
  }

  const cellSize = sourceDef.cellSize ?? DEFAULT_CELL;
  const columns = def.columns ?? DEFAULT_SEQUENCE_COLUMNS;
  const style = sourceFrameIndex <= def.intro.end ? def.intro : def.flight;
  const localColumn = sourceFrameIndex % columns;
  const localRow = Math.floor(sourceFrameIndex / columns);

  return {
    sourceKey: def.sourceKey,
    x: ((def.columnOffset ?? 0) + localColumn) * cellSize,
    y: ((def.rowOffset ?? 0) + localRow) * cellSize,
    w: cellSize,
    h: cellSize,
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
  const sourceDef = resolveSourceDef(def?.sourceKey);
  const start = def?.oneShot?.start ?? 0;
  const end = def?.oneShot?.end ?? -1;
  if (!def || !sourceDef || !Number.isFinite(sourceFrameIndex) || sourceFrameIndex < start || sourceFrameIndex > end) {
    return null;
  }

  const cellSize = sourceDef.cellSize ?? DEFAULT_CELL;
  const columns = def.columns ?? DEFAULT_SEQUENCE_COLUMNS;
  const localIndex = sourceFrameIndex - start;
  const localColumn = localIndex % columns;
  const localRow = Math.floor(localIndex / columns);

  return {
    sourceKey: def.sourceKey,
    x: ((def.columnOffset ?? 0) + localColumn) * cellSize,
    y: ((def.row ?? 0) + localRow) * cellSize,
    w: cellSize,
    h: cellSize,
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
