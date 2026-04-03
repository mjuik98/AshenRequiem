const HUD_ROOT_STYLE = Object.freeze({
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
  zIndex: '18',
});

const JOYSTICK_BASE_STYLE = Object.freeze({
  position: 'absolute',
  width: '92px',
  height: '92px',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(5, 9, 16, 0.26)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  transform: 'translate(-50%, -50%)',
  display: 'none',
});

const JOYSTICK_KNOB_STYLE = Object.freeze({
  position: 'absolute',
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  background: 'rgba(242, 207, 132, 0.82)',
  transform: 'translate(-50%, -50%)',
  display: 'none',
});

const GUIDE_STYLE = Object.freeze({
  position: 'absolute',
  padding: '8px 12px',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(6, 10, 16, 0.34)',
  color: 'rgba(244, 237, 224, 0.76)',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.12em',
  pointerEvents: 'none',
});

const PAUSE_BUTTON_STYLE = Object.freeze({
  position: 'absolute',
  top: '14px',
  right: '14px',
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(6, 10, 16, 0.52)',
  color: '#f4ede0',
  fontWeight: '700',
  pointerEvents: 'auto',
});

function applyStyle(element, styleObject) {
  Object.assign(element.style, styleObject);
}

export function createTouchHudRuntime(canvas, { onPauseTap } = {}) {
  const documentRef = canvas?.ownerDocument ?? globalThis.document;
  if (!documentRef?.createElement) return null;

  const host = canvas?.parentNode ?? documentRef.body;
  if (!host?.appendChild) return null;

  const root = documentRef.createElement('div');
  root.className = 'touch-hud';
  applyStyle(root, HUD_ROOT_STYLE);

  const joystickBase = documentRef.createElement('div');
  joystickBase.className = 'touch-joystick-base';
  applyStyle(joystickBase, JOYSTICK_BASE_STYLE);

  const joystickKnob = documentRef.createElement('div');
  joystickKnob.className = 'touch-joystick-knob';
  applyStyle(joystickKnob, JOYSTICK_KNOB_STYLE);

  const moveGuide = documentRef.createElement('div');
  moveGuide.className = 'touch-move-guide';
  moveGuide.textContent = 'MOVE';
  applyStyle(moveGuide, {
    ...GUIDE_STYLE,
    left: '20px',
    bottom: '18px',
  });

  const actionGuide = documentRef.createElement('div');
  actionGuide.className = 'touch-action-guide';
  actionGuide.textContent = 'AIM / TAP';
  applyStyle(actionGuide, {
    ...GUIDE_STYLE,
    right: '20px',
    bottom: '18px',
  });

  const pauseButton = documentRef.createElement('button');
  pauseButton.className = 'touch-pause-button';
  pauseButton.type = 'button';
  pauseButton.textContent = 'II';
  applyStyle(pauseButton, PAUSE_BUTTON_STYLE);
  if (typeof onPauseTap === 'function') {
    pauseButton.addEventListener('click', onPauseTap);
    pauseButton.addEventListener('touchstart', onPauseTap, { passive: false });
    if (typeof pauseButton.click !== 'function') {
      pauseButton.click = () => {
        onPauseTap({ preventDefault() {} });
      };
    }
  }

  root.appendChild(moveGuide);
  root.appendChild(actionGuide);
  root.appendChild(joystickBase);
  root.appendChild(joystickKnob);
  root.appendChild(pauseButton);
  host.appendChild(root);

  return {
    root,
    joystickBase,
    joystickKnob,
    moveGuide,
    actionGuide,
    pauseButton,
    destroy() {
      if (typeof onPauseTap === 'function') {
        pauseButton.removeEventListener?.('click', onPauseTap);
        pauseButton.removeEventListener?.('touchstart', onPauseTap);
      }
      root.remove?.();
    },
  };
}

export function syncTouchHudRuntime(runtime, {
  active = false,
  originX = 0,
  originY = 0,
  currentX = 0,
  currentY = 0,
  maxDistance = 60,
} = {}) {
  if (!runtime?.joystickBase || !runtime?.joystickKnob) return;

  if (!active) {
    runtime.joystickBase.style.display = 'none';
    runtime.joystickKnob.style.display = 'none';
    return;
  }

  runtime.joystickBase.style.display = 'block';
  runtime.joystickKnob.style.display = 'block';
  runtime.joystickBase.style.left = `${originX}px`;
  runtime.joystickBase.style.top = `${originY}px`;

  const dx = currentX - originX;
  const dy = currentY - originY;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0;
  const clampedDist = Math.min(dist, maxDistance);
  const ratio = dist > 0 ? clampedDist / dist : 0;
  runtime.joystickKnob.style.left = `${originX + dx * ratio}px`;
  runtime.joystickKnob.style.top = `${originY + dy * ratio}px`;
}
