function cloneLayers(layers = []) {
  return layers.map((layer) => ({ ...layer }));
}

export function buildStageBackgroundTheme(background = {}) {
  const mode = background.mode ?? 'legacy_grid';

  return {
    mode,
    tileSize: background.tileSize ?? 512,
    palette: {
      base: background.palette?.base ?? background.fillStyle ?? '#0d1117',
      grid: background.palette?.grid ?? background.gridColor ?? 'rgba(255,255,255,0.04)',
      ember: background.palette?.ember ?? background.accentColor ?? 'rgba(0,0,0,0)',
      stone: background.palette?.stone ?? null,
      crack: background.palette?.crack ?? null,
      dust: background.palette?.dust ?? null,
    },
    layers: cloneLayers(Array.isArray(background.layers) ? background.layers : []),
  };
}
