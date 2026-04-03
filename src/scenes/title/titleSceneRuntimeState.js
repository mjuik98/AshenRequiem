import { createSceneNavigationGuard } from '../sceneNavigation.js';

export function createTitleSceneRuntimeState({
  createNavigationGuardImpl = createSceneNavigationGuard,
} = {}) {
  return {
    root: null,
    shellRefs: null,
    loadoutView: null,
    loadoutViewPromise: null,
    background: null,
    nav: createNavigationGuardImpl(),
    onMouseMove: null,
    onResize: null,
    onKeyDown: null,
  };
}

export function resolveTitleSceneRuntimeTarget(scene) {
  if (scene?._runtimeState) return scene._runtimeState;
  if (!scene) return {};

  const legacyTarget = {};
  Object.defineProperties(legacyTarget, {
    root: {
      get: () => scene._el ?? null,
      set: (value) => {
        scene._el = value;
      },
      enumerable: true,
    },
    shellRefs: {
      get: () => scene._shellRefs ?? null,
      set: (value) => {
        scene._shellRefs = value;
      },
      enumerable: true,
    },
    loadoutView: {
      get: () => scene._loadoutView ?? null,
      set: (value) => {
        scene._loadoutView = value;
      },
      enumerable: true,
    },
    loadoutViewPromise: {
      get: () => scene._loadoutViewPromise ?? null,
      set: (value) => {
        scene._loadoutViewPromise = value;
      },
      enumerable: true,
    },
    background: {
      get: () => scene._background ?? null,
      set: (value) => {
        scene._background = value;
      },
      enumerable: true,
    },
    nav: {
      get: () => scene._nav ?? null,
      set: (value) => {
        scene._nav = value;
      },
      enumerable: true,
    },
    onMouseMove: {
      get: () => scene._onMouseMove ?? null,
      set: (value) => {
        scene._onMouseMove = value;
      },
      enumerable: true,
    },
    onResize: {
      get: () => scene._onResize ?? null,
      set: (value) => {
        scene._onResize = value;
      },
      enumerable: true,
    },
    onKeyDown: {
      get: () => scene._onKeyDown ?? null,
      set: (value) => {
        scene._onKeyDown = value;
      },
      enumerable: true,
    },
  });
  return legacyTarget;
}
