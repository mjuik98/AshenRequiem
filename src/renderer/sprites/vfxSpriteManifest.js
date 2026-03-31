const CELL = 64;

export const VFX_ATLAS_DEFS = {
  projectiles: {
    src: '/assets/vfx/projectiles-atlas.png',
    cellSize: CELL,
    width: CELL * 4,
    height: CELL * 2,
  },
  effects: {
    src: '/assets/vfx/effects-atlas.png',
    cellSize: CELL,
    width: CELL * 4,
    height: CELL * 2,
  },
};

const PROJECTILE_FRAMES = {
  default: {
    atlas: 'projectiles',
    x: 0,
    y: 0,
    w: CELL,
    h: CELL,
    sizeMult: 3.2,
    rotateWithVelocity: true,
  },
  targetProjectile: {
    atlas: 'projectiles',
    x: 0,
    y: 0,
    w: CELL,
    h: CELL,
    sizeMult: 3.2,
    rotateWithVelocity: true,
  },
  orbit: {
    atlas: 'projectiles',
    x: CELL,
    y: 0,
    w: CELL,
    h: CELL,
    sizeMult: 3.0,
  },
  boomerang: {
    atlas: 'projectiles',
    x: CELL * 2,
    y: 0,
    w: CELL,
    h: CELL,
    sizeMult: 3.4,
    rotateFromAngle: true,
  },
  ricochetProjectile: {
    atlas: 'projectiles',
    x: CELL * 3,
    y: 0,
    w: CELL,
    h: CELL,
    sizeMult: 3.0,
    rotateWithVelocity: true,
  },
  laserBeam: {
    atlas: 'projectiles',
    x: 0,
    y: CELL,
    w: CELL,
    h: CELL,
    drawMode: 'beam',
    minThickness: 18,
  },
  groundZone: {
    atlas: 'projectiles',
    x: CELL,
    y: CELL,
    w: CELL,
    h: CELL,
    drawMode: 'zone',
    sizeMult: 2.35,
  },
  areaBurst: {
    atlas: 'projectiles',
    x: CELL * 2,
    y: CELL,
    w: CELL,
    h: CELL,
    drawMode: 'zone',
    sizeMult: 2.2,
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

export function getProjectileSpriteFrame(behaviorId = 'default') {
  return PROJECTILE_FRAMES[behaviorId] ?? PROJECTILE_FRAMES.default ?? null;
}

export function getEffectSpriteFrame(effectType) {
  return EFFECT_FRAMES[effectType] ?? null;
}
