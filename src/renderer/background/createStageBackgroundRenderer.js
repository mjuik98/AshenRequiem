import { buildStageBackgroundTheme } from './stageBackgroundTheme.js';

function getWrappedOffset(value, size) {
  return ((-value % size) + size) % size;
}

function drawTileBase(ctx, theme, x, y, tileSize) {
  ctx.fillStyle = theme.palette.base;
  ctx.fillRect(x, y, tileSize, tileSize);

  if (theme.palette.stone) {
    ctx.fillStyle = theme.palette.stone;
    ctx.fillRect(x, y, tileSize, Math.max(18, tileSize * 0.18));
    ctx.fillRect(x, y + tileSize * 0.44, tileSize, Math.max(14, tileSize * 0.12));
  }

  if (theme.palette.dust) {
    ctx.fillStyle = theme.palette.dust;
    ctx.fillRect(x + tileSize * 0.08, y + tileSize * 0.12, tileSize * 0.28, tileSize * 0.08);
    ctx.fillRect(x + tileSize * 0.58, y + tileSize * 0.7, tileSize * 0.24, tileSize * 0.06);
  }

  if (theme.palette.crack) {
    ctx.strokeStyle = theme.palette.crack;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + tileSize * 0.16, y + tileSize * 0.18);
    ctx.lineTo(x + tileSize * 0.38, y + tileSize * 0.36);
    ctx.lineTo(x + tileSize * 0.31, y + tileSize * 0.56);
    ctx.lineTo(x + tileSize * 0.54, y + tileSize * 0.8);
    ctx.moveTo(x + tileSize * 0.72, y + tileSize * 0.12);
    ctx.lineTo(x + tileSize * 0.82, y + tileSize * 0.28);
    ctx.lineTo(x + tileSize * 0.76, y + tileSize * 0.48);
    ctx.stroke();
  }
}

function drawTileLayers(ctx, theme, x, y, tileSize, camera = { x: 0, y: 0 }) {
  for (let index = 0; index < theme.layers.length; index += 1) {
    const layer = theme.layers[index];
    const alpha = Number.isFinite(layer.alpha) ? layer.alpha : 0.15;
    const drift = Number.isFinite(layer.drift) ? layer.drift : 0;
    const driftX = ((camera.x * drift) % tileSize + tileSize) % tileSize;
    const driftY = ((camera.y * drift * 0.6) % tileSize + tileSize) % tileSize;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = theme.palette.ember;
    ctx.fillRect(
      x + ((tileSize * 0.12 + driftX + index * 17) % tileSize),
      y + ((tileSize * 0.18 + driftY + index * 13) % tileSize),
      tileSize * 0.16,
      tileSize * 0.05,
    );

    if (layer.type === 'mist_drift') {
      ctx.fillStyle = theme.palette.dust ?? theme.palette.grid;
      ctx.fillRect(
        x + ((tileSize * 0.42 + driftX * 0.5) % tileSize),
        y + ((tileSize * 0.62 + driftY * 0.5) % tileSize),
        tileSize * 0.22,
        tileSize * 0.08,
      );
    }
  }
  ctx.globalAlpha = 1;
}

export function createStageBackgroundRenderer() {
  return {
    draw(ctx, camera, stage, viewport) {
      const theme = buildStageBackgroundTheme(stage?.background);
      if (theme.mode !== 'seamless_tile') return false;

      const tileSize = theme.tileSize;
      const width = viewport?.width ?? 800;
      const height = viewport?.height ?? 600;
      const offsetX = getWrappedOffset(camera?.x ?? 0, tileSize);
      const offsetY = getWrappedOffset(camera?.y ?? 0, tileSize);

      ctx.save();
      ctx.translate(offsetX - tileSize, offsetY - tileSize);

      for (let x = 0; x < width + tileSize * 2; x += tileSize) {
        for (let y = 0; y < height + tileSize * 2; y += tileSize) {
          drawTileBase(ctx, theme, x, y, tileSize);
          drawTileLayers(ctx, theme, x, y, tileSize, camera);
        }
      }

      ctx.restore();
      return true;
    },
  };
}
