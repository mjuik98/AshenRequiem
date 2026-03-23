function nextTitleRandom(state) {
  return typeof state?.rng === 'function' ? state.rng() : Math.random();
}

function drawTitleSky(ctx, state, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, '#090512');
  gradient.addColorStop(0.25, '#120c1c');
  gradient.addColorStop(0.55, '#160d0e');
  gradient.addColorStop(1, '#050308');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  const glowX = state.width * 0.5 + (state.smoothedX - state.width * 0.5) * 0.02;
  const glowY = state.height * 0.22 + (state.smoothedY - state.height * 0.5) * 0.01;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(state.width, state.height) * 0.4);
  glow.addColorStop(0, 'rgba(161,52,35,0.12)');
  glow.addColorStop(0.25, 'rgba(161,52,35,0.04)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  for (const star of state.stars) {
    const twinkle = state.prefersReducedMotion ? 1 : (0.65 + Math.sin(time * star.speed + star.phase) * 0.35);
    const starX = star.x + (state.smoothedX - state.width * 0.5) * 0.004 * star.layer;
    const starY = star.y + (state.smoothedY - state.height * 0.5) * 0.002 * star.layer;
    ctx.globalAlpha = star.alpha * twinkle;
    ctx.fillStyle = '#f3e1b8';
    ctx.beginPath();
    ctx.arc(starX, starY, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTitleMoon(ctx, state, time) {
  const x = state.width * 0.5 + (state.smoothedX - state.width * 0.5) * 0.012;
  const y = state.height * 0.22 + (state.smoothedY - state.height * 0.5) * 0.006;
  const radius = Math.min(state.width, state.height) * 0.07;

  const corona = ctx.createRadialGradient(x, y, radius * 0.65, x, y, radius * 4.5);
  corona.addColorStop(0, 'rgba(178,51,30,0.16)');
  corona.addColorStop(0.3, 'rgba(178,51,30,0.07)');
  corona.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(x, y, radius * 4.5, 0, Math.PI * 2);
  ctx.fill();

  const moon = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.2, 0, x, y, radius);
  moon.addColorStop(0, '#f0dec2');
  moon.addColorStop(0.38, '#d09961');
  moon.addColorStop(0.76, '#92441f');
  moon.addColorStop(1, '#45120b');
  ctx.fillStyle = moon;
  ctx.shadowColor = 'rgba(180,72,22,0.35)';
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const pulse = state.prefersReducedMotion ? 0.28 : (0.18 + (Math.sin(time * 0.7) + 1) * 0.08);
  ctx.strokeStyle = `rgba(242,176,110,${pulse})`;
  ctx.lineWidth = Math.max(4, radius * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.06, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTitleTower(ctx, x, y, halfWidth, height) {
  ctx.fillStyle = '#08050a';
  ctx.fillRect(x - halfWidth, y, halfWidth * 2, height);
  for (let index = 0; index < 4; index += 1) {
    ctx.clearRect(x - halfWidth + index * (halfWidth * 0.5), y - 7, halfWidth * 0.55, 7);
  }
}

function drawTitleWindow(ctx, x, y, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
  const rgb = parseInt(color.slice(1), 16);
  const [r, g, b] = [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
  glow.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, y - 10, 6, 12);
}

function drawTitleCastle(ctx, state) {
  const offsetX = (state.smoothedX - state.width * 0.5) * 0.014;
  const offsetY = (state.smoothedY - state.height * 0.5) * 0.006;
  const centerX = state.width * 0.5 + offsetX;
  const baseY = state.height * 0.8 + offsetY;
  const width = state.width;
  const height = state.height;

  ctx.fillStyle = '#060408';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height * 0.8);
  ctx.lineTo(width * 0.14, height * 0.74);
  ctx.lineTo(width * 0.28, height * 0.69);
  ctx.lineTo(width * 0.5, height * 0.67);
  ctx.lineTo(width * 0.72, height * 0.69);
  ctx.lineTo(width * 0.86, height * 0.74);
  ctx.lineTo(width, height * 0.8);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#09060d';
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, baseY);
  ctx.lineTo(centerX - 160, baseY);
  ctx.lineTo(centerX - 160, height * 0.52);
  ctx.lineTo(centerX - 92, height * 0.52);
  ctx.lineTo(centerX - 92, height * 0.42);
  ctx.lineTo(centerX - 54, height * 0.42);
  ctx.lineTo(centerX - 54, height * 0.33);
  ctx.lineTo(centerX - 28, height * 0.33);
  ctx.lineTo(centerX - 28, height * 0.22);
  ctx.lineTo(centerX - 10, height * 0.22);
  ctx.lineTo(centerX, height * 0.1);
  ctx.lineTo(centerX + 10, height * 0.22);
  ctx.lineTo(centerX + 28, height * 0.22);
  ctx.lineTo(centerX + 28, height * 0.33);
  ctx.lineTo(centerX + 54, height * 0.33);
  ctx.lineTo(centerX + 54, height * 0.42);
  ctx.lineTo(centerX + 92, height * 0.42);
  ctx.lineTo(centerX + 92, height * 0.52);
  ctx.lineTo(centerX + 160, baseY);
  ctx.lineTo(width, baseY);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  drawTitleTower(ctx, centerX - 260, height * 0.57, 22, 120);
  drawTitleTower(ctx, centerX + 260, height * 0.57, 22, 120);
  drawTitleTower(ctx, centerX - 360, height * 0.62, 18, 92);
  drawTitleTower(ctx, centerX + 360, height * 0.62, 18, 92);

  drawTitleWindow(ctx, centerX - 88, height * 0.61, '#f6b259');
  drawTitleWindow(ctx, centerX + 88, height * 0.61, '#f6b259');
  drawTitleWindow(ctx, centerX, height * 0.47, '#ffd786');
  drawTitleWindow(ctx, centerX, height * 0.29, '#fff0b1');
}

function drawTitleGround(ctx, state, time) {
  const ground = ctx.createLinearGradient(0, state.height * 0.68, 0, state.height);
  ground.addColorStop(0, 'rgba(0,0,0,0)');
  ground.addColorStop(0.3, 'rgba(8,3,4,0.32)');
  ground.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, state.height * 0.68, state.width, state.height * 0.32);

  for (let index = 0; index < state.fogBands.length; index += 1) {
    const band = state.fogBands[index];
    ctx.beginPath();
    ctx.moveTo(0, state.height);
    for (let x = 0; x <= state.width; x += 8) {
      const wave = Math.sin(x * 0.006 + time * band.speed + index) * band.amplitude;
      ctx.lineTo(x, band.baseY + wave);
    }
    ctx.lineTo(state.width, state.height);
    ctx.closePath();
    ctx.fillStyle = `rgba(56,28,18,${band.alpha})`;
    ctx.fill();
  }
}

function drawTitleRain(ctx, state, delta) {
  if (!state.rain.length) return;

  ctx.strokeStyle = 'rgba(178,189,222,1)';
  ctx.lineWidth = 0.75;
  for (const drop of state.rain) {
    drop.y += drop.speed * delta;
    drop.x += drop.speed * delta * 0.12;
    if (drop.y > state.height + drop.length) {
      drop.y = -drop.length;
      drop.x = nextTitleRandom(state) * state.width;
    }
    ctx.globalAlpha = drop.alpha;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + drop.length * 0.16, drop.y + drop.length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawTitleBackgroundFrame(ctx, state, time, delta) {
  if (!ctx || !state) return;

  ctx.clearRect(0, 0, state.width, state.height);
  drawTitleSky(ctx, state, time);
  drawTitleMoon(ctx, state, time);
  drawTitleCastle(ctx, state);
  drawTitleGround(ctx, state, time);
  drawTitleRain(ctx, state, delta);
}
