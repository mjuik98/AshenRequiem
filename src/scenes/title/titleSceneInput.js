import { matchesActionBinding } from '../../input/keyBindings.js';
import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';

function isStartLoadoutOpen(scene) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const loadoutEl = runtimeTarget?.loadoutView?._el;
  return Boolean(loadoutEl && loadoutEl.style?.display !== 'none');
}

export function bindTitleSceneInput(scene, {
  startGame,
  windowRef = window,
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);

  runtimeTarget.onKeyDown = (event) => {
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (isStartLoadoutOpen(scene)) return;
    if (matchesActionBinding('confirm', event, scene?.game?.session?.options?.keyBindings)) {
      event.preventDefault();
      startGame();
    }
  };
  windowRef.addEventListener('keydown', runtimeTarget.onKeyDown);

  runtimeTarget.onMouseMove = (event) => {
    runtimeTarget.background?.setPointer(event.clientX, event.clientY);
  };
  windowRef.addEventListener('mousemove', runtimeTarget.onMouseMove, { passive: true });

  runtimeTarget.onResize = () => {
    runtimeTarget.background?.resize();
  };
  windowRef.addEventListener('resize', runtimeTarget.onResize);
}
