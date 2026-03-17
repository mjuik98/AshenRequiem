import { GameConfig } from '../core/GameConfig.js';
import { drawPlayer }             from './draw/drawPlayer.js';
import { drawEnemy }              from './draw/drawEnemy.js';
import { drawProjectile }         from './draw/drawProjectile.js';
import { drawEffect, drawPickup } from './draw/drawEffect.js';

/**
 * CanvasRenderer — Canvas 클리어 + 배경 그리기 및 IRenderer 구현
 *
 * PERF: drawBackground 그리드 — 수직선 / 수평선 경로를 각각 하나의 path로 묶어
 *   beginPath/stroke 호출 횟수를 O(n) → O(1) 으로 감소
 */
export class CanvasRenderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx    = ctx;
    this._lowQuality = false;
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

    // PERF: 수직선 전체를 하나의 path에 담아 stroke 1회
    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    ctx.stroke();

    // PERF: 수평선 전체를 하나의 path에 담아 stroke 1회
    ctx.beginPath();
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  // --- IRenderer Implementation ---

  drawPickups(pickups, camera) {
    const ctx = this.ctx;
    for (let i = 0; i < pickups.length; i++) {
      drawPickup(ctx, pickups[i], camera);
    }
  }

  drawEnemies(enemies, camera, timestamp) {
    const ctx = this.ctx;
    for (let i = 0; i < enemies.length; i++) {
      drawEnemy(ctx, enemies[i], camera, timestamp);
    }
  }

  drawProjectiles(projectiles, camera, lowQuality) {
    const ctx = this.ctx;
    for (let i = 0; i < projectiles.length; i++) {
      drawProjectile(ctx, projectiles[i], camera);
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

  setQuality(lowQuality) {
    this._lowQuality = lowQuality;
    if (this._lowQuality) {
      this.ctx.shadowBlur = 0;
      this.ctx.shadowColor = 'transparent';
    }
  }
}
