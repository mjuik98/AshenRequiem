import { drawPlayer }             from '../../renderer/draw/drawPlayer.js';
import { drawEnemy }              from '../../renderer/draw/drawEnemy.js';
import { drawProjectile }         from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';
import { GameConfig, }            from '../../core/GameConfig.js';
import { RENDER_CULL_MARGIN }     from '../../data/constants.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * PERF: effects 이중 순회 → 단일 순회 + _damageTextBuffer 배열 재사용
 * PERF: 투사체 수 > GLOW_THRESHOLD 시 shadowBlur 전역 비활성화
 * PERF: 화면 밖 적 / 투사체 / 픽업 렌더 스킵 (culling)
 */
const GLOW_THRESHOLD = 50;

export const RenderSystem = {
  // PERF: 매 프레임 재사용 버퍼 (new Array 할당 방지)
  _damageTextBuffer: [],

  update({ world, camera, renderer, dpr }) {
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground(camera);

    const lowQuality = world.projectiles.length > GLOW_THRESHOLD;
    if (lowQuality) ctx.shadowBlur = 0;

    const timestamp = performance.now() / 1000;

    // 컬링 경계 계산
    const cMinX = camera.x - RENDER_CULL_MARGIN;
    const cMaxX = camera.x + GameConfig.canvasWidth  + RENDER_CULL_MARGIN;
    const cMinY = camera.y - RENDER_CULL_MARGIN;
    const cMaxY = camera.y + GameConfig.canvasHeight + RENDER_CULL_MARGIN;

    // 픽업
    for (let i = 0; i < world.pickups.length; i++) {
      const pk = world.pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;
      if (pk.x < cMinX || pk.x > cMaxX || pk.y < cMinY || pk.y > cMaxY) continue;
      drawPickup(ctx, pk, camera);
    }

    // PERF: 단일 순회 — damageText는 버퍼로 수집, 나머지는 즉시 렌더
    this._damageTextBuffer.length = 0;
    for (let i = 0; i < world.effects.length; i++) {
      const e = world.effects[i];
      if (!e.isAlive) continue;
      if (e.effectType === 'damageText') {
        this._damageTextBuffer.push(e);
      } else {
        drawEffect(ctx, e, camera, dpr);
      }
    }

    // 적 (컬링 적용)
    for (let i = 0; i < world.enemies.length; i++) {
      const e = world.enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.x < cMinX || e.x > cMaxX || e.y < cMinY || e.y > cMaxY) continue;
      drawEnemy(ctx, e, camera, timestamp);
    }

    // 투사체 (컬링 적용)
    for (let i = 0; i < world.projectiles.length; i++) {
      const p = world.projectiles[i];
      if (!p.isAlive) continue;
      if (p.x < cMinX || p.x > cMaxX || p.y < cMinY || p.y > cMaxY) continue;
      drawProjectile(ctx, p, camera);
    }

    // 플레이어
    if (world.player?.isAlive) {
      drawPlayer(ctx, world.player, camera);
    }

    // 데미지 텍스트 — 최상단 레이어
    for (let i = 0; i < this._damageTextBuffer.length; i++) {
      drawEffect(ctx, this._damageTextBuffer[i], camera, dpr);
    }

    if (lowQuality) {
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    }
  },
};
