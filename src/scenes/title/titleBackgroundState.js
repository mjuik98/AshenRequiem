function buildTitleBackgroundLayers(state) {
  const starCount = Math.max(90, Math.floor(state.width * state.height / 12000));
  const rainCount = state.prefersReducedMotion ? 0 : Math.max(36, Math.floor(state.width / 18));

  state.stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height * 0.62,
    radius: 0.4 + Math.random() * 1.5,
    alpha: 0.2 + Math.random() * 0.6,
    speed: 0.25 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    layer: Math.random() < 0.55 ? 0.6 : 1,
  }));

  state.rain = Array.from({ length: rainCount }, () => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    length: 6 + Math.random() * 14,
    speed: 220 + Math.random() * 220,
    alpha: 0.06 + Math.random() * 0.12,
  }));

  state.fogBands = Array.from({ length: 3 }, (_, index) => ({
    baseY: state.height * (0.74 + index * 0.07),
    amplitude: 8 + index * 4,
    speed: 0.11 + index * 0.05,
    alpha: 0.05 + index * 0.03,
  }));
}

export function createTitleBackgroundState(win = window) {
  const prefersReducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    width: 0,
    height: 0,
    dpr: Math.min(win.devicePixelRatio || 1, 2),
    pointerX: win.innerWidth * 0.5,
    pointerY: win.innerHeight * 0.4,
    smoothedX: win.innerWidth * 0.5,
    smoothedY: win.innerHeight * 0.4,
    stars: [],
    rain: [],
    fogBands: [],
    lastTime: 0,
    prefersReducedMotion,
  };
}

export function resizeTitleBackgroundState(state, canvas, ctx, win = window) {
  if (!state || !canvas || !ctx) return state;

  state.width = win.innerWidth;
  state.height = win.innerHeight;
  state.dpr = Math.min(win.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  buildTitleBackgroundLayers(state);
  return state;
}
