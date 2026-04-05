import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[VfxSpriteRuntime]');

const { test, summary } = createRunner('VfxSpriteRuntime');

test('sprite manifest exposes projectile/effect atlases and keyed frames', async () => {
  const {
    VFX_ATLAS_DEFS,
    VFX_SOURCE_DEFS,
    getProjectileSpriteAnimationDef,
    getProjectileAnimationFrame,
    getProjectileSpriteFrame,
    getEffectSpriteSequenceDef,
    getEffectSequenceFrame,
    getEffectSpriteFrame,
  } = await import('../src/renderer/sprites/vfxSpriteManifest.js');

  assert.equal(typeof VFX_ATLAS_DEFS.projectiles?.src, 'string', 'projectile atlas src가 필요함');
  assert.equal(typeof VFX_ATLAS_DEFS.effects?.src, 'string', 'effect atlas src가 필요함');
  assert.equal(VFX_ATLAS_DEFS.projectiles.src.includes('/assets/vfx/'), true, 'projectile atlas 경로가 public asset을 가리켜야 함');
  assert.equal(VFX_ATLAS_DEFS.effects.src.includes('/assets/vfx/'), true, 'effect atlas 경로가 public asset을 가리켜야 함');
  assert.equal(VFX_ATLAS_DEFS.projectiles.cellSize, 256, 'projectile atlas cellSize가 256이어야 함');
  assert.equal(VFX_ATLAS_DEFS.projectiles.width, 2048, 'projectile atlas width가 8x256이어야 함');
  assert.equal(VFX_ATLAS_DEFS.projectiles.height, 768, 'projectile atlas height가 3x256이어야 함');
  assert.equal(VFX_ATLAS_DEFS.effects.cellSize, 256, 'effect atlas cellSize가 256이어야 함');
  assert.equal(VFX_ATLAS_DEFS.effects.width, 1024, 'effect atlas width가 4x256이어야 함');
  assert.equal(VFX_ATLAS_DEFS.effects.height, 768, 'effect atlas height가 3x256이어야 함');
  assert.equal(typeof VFX_SOURCE_DEFS.holy_bolt?.src, 'string', 'holy_bolt standalone source가 필요함');
  assert.equal(typeof VFX_SOURCE_DEFS.ice_bolt_upgrade?.src, 'string', 'ice_bolt_upgrade standalone source가 필요함');
  assert.equal(VFX_SOURCE_DEFS.holy_bolt.src.includes('/assets/vfx/holy_bolt.png'), true, 'holy_bolt source 경로가 기대값과 다름');
  assert.equal(VFX_SOURCE_DEFS.ice_bolt_upgrade.src.includes('/assets/vfx/ice_bolt_upgrade.png'), true, 'ice_bolt_upgrade source 경로가 기대값과 다름');
  assert.equal(VFX_SOURCE_DEFS.fire_bolt?.src, '/assets/vfx/fire_bolt.png', 'fire_bolt sprite sheet src가 필요함');
  assert.equal(VFX_SOURCE_DEFS.fire_bolt?.width, 1024, 'fire_bolt sprite sheet width가 1024여야 함');
  assert.equal(VFX_SOURCE_DEFS.fire_bolt?.height, 1024, 'fire_bolt sprite sheet height가 1024여야 함');
  assert.equal(VFX_SOURCE_DEFS.fire_bolt_upgrade?.src, '/assets/vfx/fire_bolt_upgrade.png', 'fire_bolt_upgrade sprite sheet src가 필요함');
  assert.equal(VFX_SOURCE_DEFS.fire_bolt_upgrade?.cellSize, 256, 'fire_bolt_upgrade sprite sheet cellSize가 256이어야 함');
  assert.equal(getProjectileSpriteAnimationDef('magic_bolt')?.flight.loopEnd, 11, 'magic_bolt projectile animation def 누락');
  assert.equal(getProjectileSpriteAnimationDef('arcane_nova')?.intro.end, 3, 'arcane_nova intro sequence 누락');
  assert.equal(getProjectileSpriteAnimationDef('fire_bolt')?.sourceKey, 'fire_bolt', 'fire_bolt projectile sourceKey 누락');
  assert.equal(getProjectileSpriteAnimationDef('fire_bolt_upgrade')?.sourceKey, 'fire_bolt_upgrade', 'fire_bolt_upgrade projectile sourceKey 누락');
  assert.equal(getProjectileSpriteAnimationDef('holy_bolt')?.sourceKey, 'holy_bolt', 'holy_bolt projectile sourceKey 누락');
  assert.equal(getEffectSpriteSequenceDef('ice_bolt_upgrade_impact')?.sourceKey, 'ice_bolt_upgrade', 'ice_bolt_upgrade impact sourceKey 누락');
  assert.equal(getEffectSpriteSequenceDef('magic_bolt_impact')?.oneShot.end, 15, 'magic_bolt impact sequence 누락');
  assert.equal(getEffectSpriteSequenceDef('fire_bolt_impact')?.sourceKey, 'fire_bolt', 'fire_bolt impact sourceKey 누락');
  assert.equal(getEffectSpriteSequenceDef('fire_bolt_upgrade_impact')?.sourceKey, 'fire_bolt_upgrade', 'fire_bolt_upgrade impact sourceKey 누락');
  assert.equal(typeof getEffectSpriteFrame('burst')?.h, 'number', 'burst frame 누락');
  assert.equal(getProjectileSpriteFrame('targetProjectile'), null, 'generic targetProjectile frame는 animated 전용 구조에서 제거되어야 함');

  const magicBoltIntro = getProjectileAnimationFrame('magic_bolt', 0);
  const magicBoltFlight = getProjectileAnimationFrame('magic_bolt', 7);
  const arcaneNovaFlight = getProjectileAnimationFrame('arcane_nova', 7);
  const arcaneNovaImpact = getEffectSequenceFrame('arcane_nova_impact', 15);

  assert.equal(magicBoltIntro.sizeMult > magicBoltFlight.sizeMult, true, 'magic_bolt intro는 flight보다 더 크게 보여야 함');
  assert.equal(magicBoltFlight.stretchX > 1, true, 'magic_bolt flight는 진행 방향으로 늘어나야 함');
  assert.equal(arcaneNovaFlight.sizeMult > magicBoltFlight.sizeMult, true, 'arcane_nova는 magic_bolt보다 더 크게 보여야 함');
  assert.equal(arcaneNovaImpact.growthMult > 1, true, 'arcane_nova impact는 성장형 burst 연출이 필요함');
  assert.equal(arcaneNovaImpact.glowBlur > 18, true, 'arcane_nova impact는 더 강한 glow blur가 필요함');
  assert.equal(getProjectileAnimationFrame('holy_bolt', 7)?.w, 256, 'holy_bolt standalone projectile frame 누락');
  assert.equal(getEffectSequenceFrame('holy_bolt_impact', 15)?.h, 256, 'holy_bolt standalone impact frame 누락');
});

test('runtime loads standalone fire_bolt sprite sources lazily and resolves both projectile and impact frames', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  const created = [];
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      const image = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      created.push(image);
      return image;
    },
  });

  const projectileCtx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage() {},
  };
  const effectCalls = [];
  const effectCtx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      effectCalls.push(args);
    },
  };

  const firstDraw = runtime.drawProjectileSprite(projectileCtx, {
    projectileVisualId: 'fire_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 0,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  assert.equal(firstDraw, false, 'fire_bolt 초기 draw는 로딩 전 false여야 함');
  assert.equal(created.length, 1, 'fire_bolt source image가 생성되지 않음');
  assert.equal(created[0].src, '/assets/vfx/fire_bolt.png', 'fire_bolt source image가 올바른 asset path를 가리켜야 함');
  assert.equal(runtime.peekAtlasStatus('fire_bolt'), 'loading', 'fire_bolt source status가 loading 이어야 함');

  created[0].complete = true;
  created[0].naturalWidth = 1024;
  created[0].on_load?.();

  const effectDraw = runtime.drawEffectSprite(effectCtx, {
    effectType: 'fire_bolt_impact',
    x: 0,
    y: 0,
    radius: 16,
    lifetime: 0.39,
    maxLifetime: 0.4,
  }, { x: 0, y: 0 });

  assert.equal(effectDraw, true, 'fire_bolt impact sprite draw가 완료되어야 함');
  assert.equal(effectCalls.length, 1, 'fire_bolt impact drawImage 호출 수가 기대값과 다름');
  assert.equal(effectCalls[0][1], 768, 'fire_bolt impact 마지막 프레임은 x=768이어야 함');
  assert.equal(effectCalls[0][2], 768, 'fire_bolt impact는 마지막 row를 사용해야 함');
});

test('runtime is lazy: first draw queues atlas load and returns false until ready', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  const created = [];
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      const image = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      created.push(image);
      return image;
    },
  });

  const ctx = { drawImage() {} };
  const didDraw = runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 10,
    y: 10,
    radius: 6,
    speed: 200,
    distanceTraveled: 0,
  }, { x: 0, y: 0 });

  assert.equal(didDraw, false, '초기 로딩 단계에서는 sprite draw가 되면 안 됨');
  assert.equal(created.length, 1, 'lazy atlas image가 생성되지 않음');
  assert.equal(runtime.peekAtlasStatus('projectiles'), 'loading', 'atlas status가 loading 이어야 함');
});

test('runtime draws projectile sprite frame once atlas is ready', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  let atlas = null;
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      atlas = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      return atlas;
    },
  });

  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      calls.push(args);
    },
  };

  runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 0,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  atlas.complete = true;
  atlas.naturalWidth = 256;
  atlas.on_load?.();

  const didDraw = runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 0,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  assert.equal(didDraw, true, 'ready atlas에서 sprite draw가 true여야 함');
  assert.equal(calls.length > 0, true, 'drawImage가 호출되지 않음');
});

test('runtime resolves animated projectile intro and loop frames from projectileVisualId', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  let atlas = null;
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      atlas = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      return atlas;
    },
  });

  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      calls.push(args);
    },
  };

  runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 0,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  atlas.complete = true;
  atlas.naturalWidth = 2048;
  atlas.on_load?.();

  runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 0,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });
  runtime.drawProjectileSprite(ctx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 32,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  assert.equal(calls.length >= 2, true, 'animated projectile drawImage 호출이 부족함');
  assert.equal(calls[0][1], 0, 'intro 첫 프레임은 atlas x=0이어야 함');
  assert.equal(calls[1][1], 0, 'flight loop 첫 프레임은 다음 행의 첫 셀을 사용해야 함');
  assert.equal(calls[1][2], 256, 'flight loop 첫 프레임은 atlas y=256이어야 함');
});

test('runtime applies elongated flight sizing and stronger glow metadata for keyed projectile/effect sprites', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  const atlases = [];
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      const atlas = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      atlases.push(atlas);
      return atlas;
    },
  });

  const projectileCalls = [];
  const effectCalls = [];
  const projectileCtx = {
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      projectileCalls.push(args);
    },
  };
  const effectCtx = {
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1,
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      effectCalls.push(args);
    },
  };

  runtime.drawProjectileSprite(projectileCtx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 48,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  atlases[0].complete = true;
  atlases[0].naturalWidth = 2048;
  atlases[0].on_load?.();

  const projectileDrawn = runtime.drawProjectileSprite(projectileCtx, {
    projectileVisualId: 'magic_bolt',
    x: 24,
    y: 36,
    radius: 8,
    speed: 200,
    distanceTraveled: 48,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  runtime.drawEffectSprite(effectCtx, {
    effectType: 'arcane_nova_impact',
    x: 0,
    y: 0,
    radius: 18,
    lifetime: 0,
    maxLifetime: 0.45,
    color: '#e040fb',
  }, { x: 0, y: 0 });

  atlases[1].complete = true;
  atlases[1].naturalWidth = 1024;
  atlases[1].on_load?.();

  const effectDrawn = runtime.drawEffectSprite(effectCtx, {
    effectType: 'arcane_nova_impact',
    x: 0,
    y: 0,
    radius: 18,
    lifetime: 0.18,
    maxLifetime: 0.45,
    color: '#e040fb',
  }, { x: 0, y: 0 });

  assert.equal(projectileDrawn, true, 'magic_bolt projectile sprite draw가 완료되어야 함');
  assert.equal(effectDrawn, true, 'arcane_nova impact sprite draw가 완료되어야 함');
  assert.equal(projectileCalls.length > 0, true, 'projectile drawImage가 호출되지 않음');
  assert.equal(effectCalls.length > 0, true, 'effect drawImage가 호출되지 않음');
  assert.equal(projectileCalls[0][7] > projectileCalls[0][8], true, 'magic_bolt flight는 가로로 더 길게 그려져야 함');
  assert.equal(projectileCtx.shadowBlur >= 18, true, 'magic_bolt projectile glow blur가 약함');
  assert.equal(effectCtx.shadowBlur >= 22, true, 'arcane_nova impact glow blur가 약함');
  assert.equal(effectCtx.globalAlpha < 1, true, 'burst effect는 진행도에 따라 alpha가 조절되어야 함');
});

test('runtime lazy-loads standalone projectile/effect sprite sources independently from shared atlases', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  const created = [];
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      const image = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      created.push(image);
      return image;
    },
  });

  const projectileCtx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage() {},
  };
  const effectCtx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage() {},
  };

  const projectileDrawn = runtime.drawProjectileSprite(projectileCtx, {
    projectileVisualId: 'holy_bolt',
    x: 12,
    y: 20,
    radius: 6,
    speed: 220,
    distanceTraveled: 24,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  const effectDrawn = runtime.drawEffectSprite(effectCtx, {
    effectType: 'holy_bolt_impact',
    x: 12,
    y: 20,
    radius: 12,
    lifetime: 0.1,
    maxLifetime: 0.4,
  }, { x: 0, y: 0 });

  assert.equal(projectileDrawn, false, 'standalone projectile source loading 전에는 draw가 되면 안 됨');
  assert.equal(effectDrawn, false, 'standalone effect source loading 전에는 draw가 되면 안 됨');
  assert.equal(created.length, 1, '같은 sourceKey를 공유하는 projectile/effect는 이미지 1개만 생성해야 함');
  assert.equal(runtime.peekAtlasStatus('holy_bolt'), 'loading', 'standalone source status가 loading 이어야 함');
});

test('runtime resolves impact effect sequence frames from effectType lifetime progress', async () => {
  const { createVfxSpriteRuntime } = await import('../src/renderer/sprites/vfxSpriteRuntime.js');

  let atlas = null;
  const runtime = createVfxSpriteRuntime({
    imageFactory() {
      atlas = {
        complete: false,
        naturalWidth: 0,
        addEventListener(type, handler) {
          this[`on_${type}`] = handler;
        },
      };
      return atlas;
    },
  });

  const calls = [];
  const ctx = {
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    drawImage(...args) {
      calls.push(args);
    },
  };

  runtime.drawEffectSprite(ctx, {
    effectType: 'arcane_nova_impact',
    x: 0,
    y: 0,
    radius: 16,
    lifetime: 0,
    maxLifetime: 0.4,
  }, { x: 0, y: 0 });

  atlas.complete = true;
  atlas.naturalWidth = 1024;
  atlas.on_load?.();

  runtime.drawEffectSprite(ctx, {
    effectType: 'arcane_nova_impact',
    x: 0,
    y: 0,
    radius: 16,
    lifetime: 0.39,
    maxLifetime: 0.4,
  }, { x: 0, y: 0 });

  assert.equal(calls.length, 1, 'impact effect drawImage 호출 수가 기대값과 다름');
  assert.equal(calls[0][2], 512, 'arcane_nova impact는 row 2를 사용해야 함');
  assert.equal(calls[0][1], 768, 'impact sequence 마지막 프레임은 atlas x=768이어야 함');
});

summary();
