import { TITLE_SCREEN_HTML } from './titleScreenContent.js';

function captureTitleSceneShellRefs(root) {
  return {
    canvas: root.querySelector('#title-bg-canvas'),
    flash: root.querySelector('#title-flash'),
    live: root.querySelector('#title-live'),
  };
}

export function resetTitleSceneShellState(runtimeTarget) {
  if (runtimeTarget) {
    runtimeTarget.shellRefs = null;
  }
}

export function syncTitleSceneShellState(runtimeTarget, {
  documentRef = document,
  titleScreenHtml = TITLE_SCREEN_HTML,
} = {}) {
  if (!runtimeTarget?.root) {
    runtimeTarget.root = documentRef.createElement('div');
    runtimeTarget.root.id = 'title-screen';
  }

  if (!runtimeTarget.root.parentNode) {
    documentRef.getElementById('ui-container')?.appendChild(runtimeTarget.root);
  }

  if (!runtimeTarget.shellRefs?.canvas || !runtimeTarget.shellRefs?.flash || !runtimeTarget.shellRefs?.live) {
    runtimeTarget.root.innerHTML = titleScreenHtml;
    runtimeTarget.shellRefs = captureTitleSceneShellRefs(runtimeTarget.root);
  }

  return runtimeTarget.root;
}
