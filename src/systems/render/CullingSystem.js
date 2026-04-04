/**
 * src/systems/render/CullingSystem.js
 *
 * 렌더링 최적화를 위해 화면 안의 엔티티들만 필터링한다.
 * RenderSystem 이전에 실행되어 그리기에 필요한 버퍼를 준비한다.
 */
import { RENDER }     from '../../data/constants.js';
import { resolveViewportDimensions } from '../../utils/viewportState.js';

export function createCullingSystem() {
  const visible = {
    enemies:      [],
    projectiles:  [],
    pickups:      [],
    effects:      [],
    damageTexts:  [],
  };

  const clearBuffers = () => {
    visible.enemies.length     = 0;
    visible.projectiles.length = 0;
    visible.pickups.length     = 0;
    visible.effects.length     = 0;
    visible.damageTexts.length = 0;
  };

  return {
    update({ world }) {
      const camera = world.presentation.camera;
      const { width, height } = resolveViewportDimensions({ camera });
      const cMinX  = camera.x - RENDER.CULL_MARGIN;
      const cMaxX  = camera.x + width + RENDER.CULL_MARGIN;
      const cMinY  = camera.y - RENDER.CULL_MARGIN;
      const cMaxY  = camera.y + height + RENDER.CULL_MARGIN;

      clearBuffers();

      // 1. 적
      for (const e of world.entities.enemies) {
        if (!e.isAlive || e.pendingDestroy) continue;
        if (e.x < cMinX || e.x > cMaxX || e.y < cMinY || e.y > cMaxY) continue;
        visible.enemies.push(e);
      }

      // 2. 투사체
      for (const p of world.entities.projectiles) {
        if (!p.isAlive || p.pendingDestroy) continue;
        if (p.x < cMinX || p.x > cMaxX || p.y < cMinY || p.y > cMaxY) continue;
        visible.projectiles.push(p);
      }

      // 3. 픽업
      for (const pk of world.entities.pickups) {
        if (!pk.isAlive || pk.pendingDestroy) continue;
        if (pk.x < cMinX || pk.x > cMaxX || pk.y < cMinY || pk.y > cMaxY) continue;
        visible.pickups.push(pk);
      }

      // 4. 이펙트 (분리 로직 포함)
      for (const e of world.entities.effects) {
        if (!e.isAlive) continue;

        // levelFlash 등 특수 이펙트는 컬링 제외 (항상 표시)
        if (e.effectType === 'levelFlash') {
          visible.effects.push(e);
          continue;
        }

        if (e.x < cMinX || e.x > cMaxX || e.y < cMinY || e.y > cMaxY) continue;

        if (e.effectType === 'damageText') {
          visible.damageTexts.push(e);
        } else {
          visible.effects.push(e);
        }
      }
    },

    getVisible() {
      return visible;
    },

    /** @debug */
    getDebugInfo() {
      return {
        enemies:     visible.enemies.length,
        projectiles: visible.projectiles.length,
      };
    }
  };
}
