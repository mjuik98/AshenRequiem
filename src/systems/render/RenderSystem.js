import { GameConfig, }            from '../../core/GameConfig.js';
import { RENDER_CULL_MARGIN }     from '../../data/constants.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * PERF: effects 이중 순회 → 단일 순회 + _damageTextBuffer/다른 이펙트 별도 렌더
 * PERF: 화면 밖 적 / 투사체 / 픽업 렌더 스킵 (culling)
 */
const GLOW_THRESHOLD = 50;

export const RenderSystem = {
  // PERF: 매 프레임 재사용 버퍼 (new Array 할당 방지)
  _damageTextBuffer: [],
  _effectBuffer: [],
  _pickupBuffer: [],
  _enemyBuffer: [],
  _projectileBuffer: [],

  update({ world, camera, renderer, dpr }) {
    renderer.clear();
    renderer.drawBackground(camera);

    const lowQuality = world.projectiles.length > GLOW_THRESHOLD;
    renderer.setQuality(lowQuality);

    const timestamp = performance.now() / 1000;

    // 컬링 경계 계산
    const cMinX = camera.x - RENDER_CULL_MARGIN;
    const cMaxX = camera.x + GameConfig.canvasWidth  + RENDER_CULL_MARGIN;
    const cMinY = camera.y - RENDER_CULL_MARGIN;
    const cMaxY = camera.y + GameConfig.canvasHeight + RENDER_CULL_MARGIN;

    // 픽업
    this._pickupBuffer.length = 0;
    for (let i = 0; i < world.pickups.length; i++) {
      const pk = world.pickups[i];
      if (!pk.isAlive || pk.pendingDestroy) continue;
      if (pk.x < cMinX || pk.x > cMaxX || pk.y < cMinY || pk.y > cMaxY) continue;
      this._pickupBuffer.push(pk);
    }
    renderer.drawPickups(this._pickupBuffer, camera);

    // PERF: 단일 순회 — damageText는 버퍼로 수집, 나머지는 즉시 렌더
    this._damageTextBuffer.length = 0;
    this._effectBuffer.length = 0;
    for (let i = 0; i < world.effects.length; i++) {
      const e = world.effects[i];
      if (!e.isAlive) continue;
      if (e.effectType === 'damageText') {
        this._damageTextBuffer.push(e);
      } else {
        this._effectBuffer.push(e);
      }
    }
    renderer.drawEffects(this._effectBuffer, camera, dpr);

    // 적 (컬링 적용)
    this._enemyBuffer.length = 0;
    for (let i = 0; i < world.enemies.length; i++) {
      const e = world.enemies[i];
      if (!e.isAlive || e.pendingDestroy) continue;
      if (e.x < cMinX || e.x > cMaxX || e.y < cMinY || e.y > cMaxY) continue;
      this._enemyBuffer.push(e);
    }
    renderer.drawEnemies(this._enemyBuffer, camera, timestamp);

    // 투사체 (컬링 적용)
    this._projectileBuffer.length = 0;
    for (let i = 0; i < world.projectiles.length; i++) {
      const p = world.projectiles[i];
      if (!p.isAlive) continue;
      if (p.x < cMinX || p.x > cMaxX || p.y < cMinY || p.y > cMaxY) continue;
      this._projectileBuffer.push(p);
    }
    renderer.drawProjectiles(this._projectileBuffer, camera, lowQuality);

    // 플레이어
    if (world.player?.isAlive) {
      renderer.drawPlayer(world.player, camera);
    }

    // 데미지 텍스트 — 최상단 레이어
    renderer.drawEffects(this._damageTextBuffer, camera, dpr);
  },
};
