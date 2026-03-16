import { drawPlayer }             from '../../renderer/draw/drawPlayer.js';
import { drawEnemy }              from '../../renderer/draw/drawEnemy.js';
import { drawProjectile }         from '../../renderer/draw/drawProjectile.js';
import { drawEffect, drawPickup } from '../../renderer/draw/drawEffect.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * PATCH(perf): lowQuality 모드 추가.
 *   투사체 수가 GLOW_THRESHOLD 초과 시 ctx.shadowBlur 를 전역으로 비활성화.
 *
 * FIX(balance): GLOW_THRESHOLD 30 → 50.
 *   초반부터 glow 가 꺼지는 문제 수정.
 *
 * FIX(bug): dpr 파라미터를 drawEffect 에 전달.
 *
 * PERF(refactor): effects 배열 이중 순회 → 단일 순회로 최적화.
 *   이전: effects 를 두 번 순회 — 1회차(non-damageText), 2회차(damageText 최상단 레이어).
 *         effects 가 많을 때 O(2n) 순회 비용 + 가독성 저하.
 *   이후: 단일 순회에서 damageText 를 별도 배열로 수집 후 마지막에 일괄 렌더링.
 *         레이어 순서는 동일하게 유지 (damageText 는 최상단).
 *         단, _damageTextBuffer 는 매 프레임 재사용하여 GC 압박 최소화.
 */

/** 투사체 수 기준: 초과 시 glow 비활성화 */
const GLOW_THRESHOLD = 50;

export const RenderSystem = {
  // PERF: 매 프레임 재사용하는 damageText 버퍼 (new Array 할당 방지)
  _damageTextBuffer: [],

  update({ world, camera, renderer, dpr }) {
    const ctx = renderer.ctx;
    renderer.clear();
    renderer.drawBackground(camera);

    // PATCH(perf): 투사체 다수 시 shadowBlur 전역 비활성화
    const lowQuality = world.projectiles.length > GLOW_THRESHOLD;
    if (lowQuality) {
      ctx.shadowBlur = 0;
    }

    // FIX: 프레임당 1회만 계산
    const timestamp = performance.now() / 1000;

    for (let i = 0; i < world.pickups.length; i++) {
      drawPickup(ctx, world.pickups[i], camera);
    }

    // PERF: 단일 순회 — non-damageText 즉시 렌더링, damageText 는 버퍼에 수집
    this._damageTextBuffer.length = 0;
    for (let i = 0; i < world.effects.length; i++) {
      const e = world.effects[i];
      if (e.effectType === 'damageText') {
        this._damageTextBuffer.push(e);
      } else {
        drawEffect(ctx, e, camera, dpr);
      }
    }

    for (let i = 0; i < world.enemies.length; i++) {
      drawEnemy(ctx, world.enemies[i], camera, timestamp);
    }

    for (let i = 0; i < world.projectiles.length; i++) {
      drawProjectile(ctx, world.projectiles[i], camera);
    }

    if (world.player && world.player.isAlive) {
      drawPlayer(ctx, world.player, camera);
    }

    // 데미지 텍스트 — 최상단 레이어 (버퍼에서 일괄 렌더링)
    for (let i = 0; i < this._damageTextBuffer.length; i++) {
      drawEffect(ctx, this._damageTextBuffer[i], camera, dpr);
    }

    // lowQuality 해제 — 다음 프레임을 위해 초기화
    if (lowQuality) {
      ctx.shadowBlur  = 0;
      ctx.shadowColor = 'transparent';
    }
  },
};
