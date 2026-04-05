import {
  VFX_SOURCE_DEFS,
  getProjectileSpriteAnimationDef,
  getProjectileAnimationFrame,
  getProjectileSpriteFrame,
  getEffectSpriteSequenceDef,
  getEffectSequenceFrame,
  getEffectSpriteFrame,
} from './vfxSpriteManifest.js';

function defaultImageFactory() {
  const ImageCtor = globalThis?.Image;
  if (typeof ImageCtor !== 'function') return null;
  return new ImageCtor();
}

function bindImageEvent(image, type, handler) {
  if (typeof image?.addEventListener === 'function') {
    image.addEventListener(type, handler);
    return;
  }
  image[`on${type}`] = handler;
}

function createEmptyAtlasState() {
  return {
    status: 'idle',
    image: null,
  };
}

function computeRotation(entity, frame) {
  if (frame.rotateFromAngle && Number.isFinite(entity?.angle)) {
    return entity.angle;
  }
  if (frame.rotateWithVelocity) {
    const dirX = entity?.dirX ?? 0;
    const dirY = entity?.dirY ?? 0;
    if (dirX !== 0 || dirY !== 0) {
      return Math.atan2(dirY, dirX);
    }
  }
  if (frame.drawMode === 'beam' && Number.isFinite(entity?.beamAngle)) {
    return entity.beamAngle;
  }
  return 0;
}

function applyGlow(ctx, color, blur = 18) {
  ctx.shadowColor = color ?? 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = blur;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resolveProjectileElapsedSeconds(projectile) {
  const speed = projectile?.speed ?? 0;
  const distance = projectile?.distanceTraveled ?? 0;
  if (speed > 0 && Number.isFinite(distance)) {
    return Math.max(0, distance / speed);
  }
  return Math.max(0, projectile?.lifetime ?? 0);
}

function resolveAnimatedProjectileFrame(projectile) {
  const visualId = projectile?.projectileVisualId;
  const def = getProjectileSpriteAnimationDef(visualId);
  if (!def) return null;

  const elapsed = resolveProjectileElapsedSeconds(projectile);
  const introCount = (def.intro.end - def.intro.start) + 1;
  const introDuration = introCount * def.intro.frameDuration;

  if (elapsed < introDuration) {
    const introOffset = Math.min(
      introCount - 1,
      Math.floor(elapsed / def.intro.frameDuration),
    );
    return getProjectileAnimationFrame(visualId, def.intro.start + introOffset);
  }

  const loopCount = (def.flight.loopEnd - def.flight.loopStart) + 1;
  const loopElapsed = elapsed - introDuration;
  const loopOffset = loopCount > 0
    ? Math.floor(loopElapsed / def.flight.frameDuration) % loopCount
    : 0;

  return getProjectileAnimationFrame(visualId, def.flight.loopStart + loopOffset);
}

function resolveEffectSequenceFrame(effect) {
  const def = getEffectSpriteSequenceDef(effect?.effectType);
  if (!def) return null;

  const frameCount = (def.oneShot.end - def.oneShot.start) + 1;
  const progress = clamp(
    (effect?.lifetime ?? 0) / Math.max(effect?.maxLifetime ?? 0.4, 0.001),
    0,
    0.999999,
  );
  const frameOffset = Math.min(frameCount - 1, Math.floor(progress * frameCount));
  return getEffectSequenceFrame(effect.effectType, def.oneShot.start + frameOffset);
}

export function createVfxSpriteRuntime({
  imageFactory = defaultImageFactory,
} = {}) {
  const sourceStates = new Map();

  function ensureSource(sourceKey) {
    const sourceDef = VFX_SOURCE_DEFS[sourceKey];
    if (!sourceDef) return null;

    let state = sourceStates.get(sourceKey);
    if (!state) {
      state = createEmptyAtlasState();
      sourceStates.set(sourceKey, state);
    }

    if (state.status !== 'idle') return state;

    const image = imageFactory?.();
    if (!image) {
      state.status = 'error';
      return state;
    }

    state.status = 'loading';
    state.image = image;

    bindImageEvent(image, 'load', () => {
      state.status = 'ready';
    });
    bindImageEvent(image, 'error', () => {
      state.status = 'error';
    });

    image.src = sourceDef.src;

    if (image.complete && (image.naturalWidth ?? 0) > 0) {
      state.status = 'ready';
    }

    return state;
  }

  function peekSourceStatus(sourceKey) {
    return sourceStates.get(sourceKey)?.status ?? 'idle';
  }

  function peekAtlasStatus(sourceKey) {
    return peekSourceStatus(sourceKey);
  }

  function drawFrame(ctx, sourceKey, frame, entity, camera) {
    if (!ctx?.drawImage || !frame) return false;

    const sourceState = ensureSource(sourceKey);
    if (!sourceState || sourceState.status !== 'ready' || !sourceState.image) {
      return false;
    }

    const sx = (entity?.x ?? 0) - (camera?.x ?? 0);
    const sy = (entity?.y ?? 0) - (camera?.y ?? 0);
    const rotation = computeRotation(entity, frame);

    const baseSize = Math.max(18, (entity?.radius ?? 6) * (frame.sizeMult ?? 3));
    const stretchX = Math.max(0.2, frame.stretchX ?? 1);
    const stretchY = Math.max(0.2, frame.stretchY ?? 1);
    let width = baseSize * stretchX;
    let height = baseSize * stretchY;
    const opacity = frame.opacity ?? 1;

    if (frame.drawMode === 'beam') {
      width = Math.max(frame.w * 0.9, entity?.beamLength ?? width * 3);
      height = Math.max(frame.minThickness ?? 14, (entity?.radius ?? 8) * 1.8);
    } else if (frame.drawMode === 'zone') {
      width = Math.max(frame.w * 0.8, (entity?.radius ?? 16) * (frame.sizeMult ?? 2.2));
      height = width;
    } else if (frame.drawMode === 'burst') {
      const progress = Math.min(1, (entity?.lifetime ?? 0) / Math.max(entity?.maxLifetime ?? 0.5, 0.001));
      const growthMult = frame.growthMult ?? 0.85;
      width = Math.max(frame.w * 0.8, (entity?.radius ?? 18) * (frame.sizeMult ?? 2.6) * (1 + progress * growthMult));
      height = width;
    }

    ctx.save();
    applyGlow(ctx, frame.glowColor ?? entity?.color, frame.glowBlur ?? (frame.drawMode === 'beam' ? 20 : 14));
    if (frame.drawMode === 'burst') {
      const progress = Math.min(1, (entity?.lifetime ?? 0) / Math.max(entity?.maxLifetime ?? 0.5, 0.001));
      const alphaFloor = frame.alphaFloor ?? 0.2;
      const fadeFactor = frame.fadeFactor ?? 0.7;
      ctx.globalAlpha = Math.max(alphaFloor, 1 - progress * fadeFactor) * opacity;
    } else {
      ctx.globalAlpha = opacity;
    }
    ctx.translate(sx, sy);
    if (rotation) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(
      sourceState.image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      -width / 2,
      -height / 2,
      width,
      height,
    );
    ctx.restore();
    return true;
  }

  function drawProjectileSprite(ctx, projectile, camera) {
    const frame = resolveAnimatedProjectileFrame(projectile)
      ?? getProjectileSpriteFrame(projectile?.behaviorId ?? 'default');
    if (!frame) return false;
    return drawFrame(ctx, frame.sourceKey, frame, projectile, camera);
  }

  function drawEffectSprite(ctx, effect, camera) {
    const frame = resolveEffectSequenceFrame(effect)
      ?? getEffectSpriteFrame(effect?.effectType);
    if (!frame) return false;
    return drawFrame(ctx, frame.sourceKey, frame, effect, camera);
  }

  return {
    peekSourceStatus,
    peekAtlasStatus,
    drawProjectileSprite,
    drawEffectSprite,
  };
}

export const sharedVfxSpriteRuntime = createVfxSpriteRuntime();
