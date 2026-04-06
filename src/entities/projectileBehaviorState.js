export function cloneProjectileBehaviorState(behaviorState) {
  if (!behaviorState || typeof behaviorState !== 'object') return null;
  return { ...behaviorState };
}

export function buildOrbitBehaviorState(lastHitResetAngle = 0) {
  return { lastHitResetAngle };
}

export function buildRicochetBehaviorState() {
  return { ricochetHitCount: 0 };
}

export function buildBoomerangBehaviorState() {
  return { reversed: false };
}

export function ensureProjectileBehaviorState(projectile, defaults = {}) {
  const nextState = projectile?.behaviorState && typeof projectile.behaviorState === 'object'
    ? projectile.behaviorState
    : {};

  for (const [key, value] of Object.entries(defaults)) {
    if (nextState[key] === undefined) {
      nextState[key] = value;
    }
  }

  projectile.behaviorState = nextState;
  return nextState;
}
