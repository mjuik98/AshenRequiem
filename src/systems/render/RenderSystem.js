import { GameConfig }  from '../../core/GameConfig.js';
import { RENDER }       from '../../data/constants.js';
import { getNowSeconds } from '../../adapters/browser/runtimeEnv.js';

/**
 * RenderSystem — 렌더링 순서 제어
 *
 * FIX(P0-A): _projectileBuffer 선언 누락 수정
 *   Before: _projectileBuffer가 선언되지 않아 update() 호출 시
 *           `Cannot set properties of undefined` 런타임 크래시 발생.
 *   After:  다른 버퍼(_damageTextBuffer 등)와 동일하게 인스턴스 프로퍼티로 선언.
 *
 * PERF: effects 이중 순회 → 단일 순회 + damageText 최상단 레이어 분리
 * PERF: 화면 밖 엔티티 렌더 스킵 (culling)
 */
export const RenderSystem = {

  update({ world, services, dpr = 1 }) {
    const renderer = services.renderer;
    const culling  = services.cullingSystem;
    const camera   = world.presentation.camera;

    if (!renderer || !culling) return;

    const visible = culling.getVisible();

    renderer.clear();
    renderer.drawBackground(camera);

    const lowQuality = world.entities.projectiles.length > RENDER.GLOW_THRESHOLD;
    renderer.setQuality(lowQuality);

    const timestamp = getNowSeconds();

    // ── 픽업 ────────────────────────────────────────────────────────────
    renderer.drawPickups(visible.pickups, camera, timestamp);

    // ── 일반 이펙트 ─────────────────────────────────────────────────────
    renderer.drawEffects(visible.effects, camera, dpr);

    // ── 적 ──────────────────────────────────────────────────────────────
    renderer.drawEnemies(visible.enemies, camera, timestamp);

    // ── 투사체 ──────────────────────────────────────────────────────────
    renderer.drawProjectiles(visible.projectiles, camera, lowQuality);

    // ── 플레이어 ────────────────────────────────────────────────────────
    if (world.entities.player?.isAlive) {
      renderer.drawPlayer(world.entities.player, camera);
    }

    // ── 데미지 텍스트 — 최상단 레이어 ───────────────────────────────────
    renderer.drawEffects(visible.damageTexts, camera, dpr);
  },
};
