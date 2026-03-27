import { matchesActionBinding } from '../../input/keyBindings.js';

export function bindTitleSceneInput(scene, {
  startGame,
  windowRef = window,
} = {}) {
  scene._onKeyDown = (event) => {
    if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (matchesActionBinding('confirm', event, scene?.game?.session?.options?.keyBindings)) {
      event.preventDefault();
      startGame();
    }
  };
  windowRef.addEventListener('keydown', scene._onKeyDown);

  scene._onMouseMove = (event) => {
    scene._background?.setPointer(event.clientX, event.clientY);
  };
  windowRef.addEventListener('mousemove', scene._onMouseMove, { passive: true });

  scene._onResize = () => {
    scene._background?.resize();
  };
  windowRef.addEventListener('resize', scene._onResize);
}
