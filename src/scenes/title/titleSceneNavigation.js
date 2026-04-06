import { resolveTitleSceneRuntimeTarget } from './titleSceneRuntimeState.js';

export function bindTitleActionButtons(scene, {
  onAction = () => {},
} = {}) {
  const runtimeTarget = resolveTitleSceneRuntimeTarget(scene);
  const root = runtimeTarget.root;
  if (!root?.addEventListener) return;

  root.addEventListener('click', (event) => {
    const target = event?.target?.closest?.('[data-action]') ?? event?.target;
    if (!root.contains?.(target) || !target?.dataset?.action) return;
    onAction(target.dataset.action, event);
  });
}
