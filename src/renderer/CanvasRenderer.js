import { GameConfig } from '../core/GameConfig.js';
import { RENDER }     from '../data/constants.js';
import { drawPlayer }             from './draw/drawPlayer.js';
import { drawEnemy }              from './draw/drawEnemy.js';
import { drawProjectile }         from './draw/drawProjectile.js';
import { drawEffect, drawPickup } from './draw/drawEffect.js';

/**
 * CanvasRenderer — Canvas 클리어 + 배경 그리기 및 IRenderer 구현
 *
 * CHANGE(Settings): 품질 프리셋 기능 추가
 *   - _qualityPreset: 'low' | 'medium' | 'high'  (기본 'medium')
 *   - setQualityPreset(preset): 외부에서 프리셋 설정
 *   - setQuality(low)에서 프리셋 강제 적용
 *     - 'low'  → 항상 lowQuality = true  (글로우 항상 비활성)
 *     - 'high' → 항상 lowQuality = false (글로우 항상 활성)
 *     - 'medium' → RenderSystem의 자동 판단 유지 (기존 동작)
 */
export class CanvasRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this._lowQuality    = false;
    this._qualityPreset = 'medium';  // 설정 화면에서 지정하는 품질 프리셋
    this._glowEnabled   = true;
  }

  // ── 품질 프리셋 ──────────────────────────────────────────────────────────

  /**
   * 렌더링 품질 프리셋을 설정한다.
   * PlayScene.enter()에서 session.options.quality 기반으로 호출된다.
   *
   * @param {'low'|'medium'|'high'} preset
   */
  setQualityPreset(preset) {
    this._qualityPreset = preset ?? 'medium';
    this.setQuality(this._lowQuality);
  }

  setGlowEnabled(enabled) {
    this._glowEnabled = enabled !== false;
    this.setQuality(this._lowQuality);
  }

  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  drawBackground(camera) {
    const ctx      = this.ctx;
    const w        = GameConfig.canvasWidth;
    const h        = GameConfig.canvasHeight;
    const gridSize = 50;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const offsetX = ((-camera.x % gridSize) + gridSize) % gridSize;
    const offsetY = ((-camera.y % gridSize) + gridSize) % gridSize;

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth   = 1;

    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  // ── IRenderer 구현 ───────────────────────────────────────────────────────

  drawPickups(pickups, camera, timestamp = 0) {
    const ctx = this.ctx;
    for (let i = 0; i < pickups.length; i++) {
      drawPickup(ctx, pickups[i], camera, timestamp);
    }
  }

  drawEnemies(enemies, camera, timestamp) {
    const ctx = this.ctx;
    for (let i = 0; i < enemies.length; i++) {
      drawEnemy(ctx, enemies[i], camera, timestamp);
    }
  }

  /**
   * [P2-③ FIX] lowQuality=true이면 투사체를 단순 원으로 렌더해 GPU 부하 절감.
   */
  drawProjectiles(projectiles, camera, lowQuality = false) {
    const ctx = this.ctx;

    if (lowQuality || this._lowQuality) {
      for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (!proj.isAlive) continue;

        const sx = proj.x - camera.x;
        const sy = proj.y - camera.y;

        ctx.fillStyle = proj.color ?? '#ffee58';
        ctx.beginPath();
        ctx.arc(sx, sy, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (let i = 0; i < projectiles.length; i++) {
        drawProjectile(ctx, projectiles[i], camera);
      }
    }
  }

  drawPlayer(player, camera) {
    drawPlayer(this.ctx, player, camera);
  }

  drawEffects(effects, camera, dpr) {
    const ctx = this.ctx;
    for (let i = 0; i < effects.length; i++) {
        drawEffect(ctx, effects[i], camera, dpr);
    }
  }

  /**
   * [P2-③] 투사체 수 기준으로 자동으로 lowQuality 모드 전환.
   * setQuality()에서 프리셋이 적용되므로 autoQuality도 프리셋을 존중한다.
   */
  autoQuality(projectileCount) {
    const shouldBeLow = projectileCount > RENDER.GLOW_THRESHOLD;
    if (shouldBeLow !== this._lowQuality) {
      this.setQuality(shouldBeLow);
    }
  }

  /**
   * 품질 모드를 설정한다.
   *
   * CHANGE(Settings): _qualityPreset에 따라 입력값을 강제 재정의한다.
   *   - 'low'  → lowQuality = true  (항상 글로우 OFF)
   *   - 'high' → lowQuality = false (항상 글로우 ON)
   *   - 'medium' → RenderSystem이 전달한 autoLow 값 그대로 사용
   *
   * @param {boolean} lowQuality  RenderSystem이 계산한 자동 품질 값
   */
  setQuality(lowQuality) {
    if (this._qualityPreset === 'low') {
      lowQuality = true;
    } else if (this._qualityPreset === 'high') {
      lowQuality = false;
    } else if (!this._glowEnabled) {
      lowQuality = true;
    }

    this._lowQuality = lowQuality;
    if (this._lowQuality || !this._glowEnabled) {
      this.ctx.shadowBlur  = 0;
      this.ctx.shadowColor = 'transparent';
    }
  }
}
