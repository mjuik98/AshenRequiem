import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[VfxSpriteRuntime]');

const { test, summary } = createRunner('VfxSpriteRuntime');

test('sprite manifest exposes projectile/effect atlases and keyed frames', async () => {
  const {
    VFX_ATLAS_DEFS,
    getProjectileSpriteFrame,
    getEffectSpriteFrame,
  } = await import('../src/renderer/sprites/vfxSpriteManifest.js');

  assert.equal(typeof VFX_ATLAS_DEFS.projectiles?.src, 'string', 'projectile atlas src가 필요함');
  assert.equal(typeof VFX_ATLAS_DEFS.effects?.src, 'string', 'effect atlas src가 필요함');
  assert.equal(VFX_ATLAS_DEFS.projectiles.src.includes('/assets/vfx/'), true, 'projectile atlas 경로가 public asset을 가리켜야 함');
  assert.equal(VFX_ATLAS_DEFS.effects.src.includes('/assets/vfx/'), true, 'effect atlas 경로가 public asset을 가리켜야 함');
  assert.equal(typeof getProjectileSpriteFrame('targetProjectile')?.w, 'number', 'targetProjectile frame 누락');
  assert.equal(typeof getEffectSpriteFrame('burst')?.h, 'number', 'burst frame 누락');
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
    behaviorId: 'targetProjectile',
    x: 10,
    y: 10,
    radius: 6,
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
    behaviorId: 'targetProjectile',
    x: 24,
    y: 36,
    radius: 8,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  atlas.complete = true;
  atlas.naturalWidth = 256;
  atlas.on_load?.();

  const didDraw = runtime.drawProjectileSprite(ctx, {
    behaviorId: 'targetProjectile',
    x: 24,
    y: 36,
    radius: 8,
    dirX: 1,
    dirY: 0,
  }, { x: 0, y: 0 });

  assert.equal(didDraw, true, 'ready atlas에서 sprite draw가 true여야 함');
  assert.equal(calls.length > 0, true, 'drawImage가 호출되지 않음');
});

summary();
