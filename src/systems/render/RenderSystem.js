import { drawPlayer }             from '../../renderer/draw/drawPlayer.js';
import { drawEnemy }              from '../../renderer/draw/drawEnemy.js';
import { drawProjectile }         from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * PERF: effects 이중 순회 → 단일 순회 + _damageTextBuffer 배열 재사용
 * PERF: 투사체 수 > GLOW_THRESHOLD 시 shadowBlur 전역 비활성화
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

    // 픽업
    for (let i = 0; i < world.pickups.length; i++) {
      drawPickup(ctx, world.pickups[i], camera);
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

    // 적
    for (let i = 0; i < world.enemies.length; i++) {
      drawEnemy(ctx, world.enemies[i], camera, timestamp);
    }

    // 투사체
    for (let i = 0; i < world.projectiles.length; i++) {
      drawProjectile(ctx, world.projectiles[i], camera);
    }

    // 플레이어
    if (world.player?.isAlive) {
      drawPlayer(ctx, world.player, camera);
    }

    // 데미지 텍스트 — 최상단 레이어 (버퍼에서 일괄 렌더)
    for (let i = 0; i < this._damageTextBuffer.length; i++) {
      drawEffect(ctx, this._damageTextBuffer[i], camera, dpr);
    }

    if (lowQuality) {
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    }
  },
};
