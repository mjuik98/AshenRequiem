import { GameConfig } from '../core/GameConfig.js';

/**
 * CanvasRenderer — Canvas 2D 기반 렌더러
 *
 * 읽기 전용: 게임 상태를 그리기만 한다.
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /** 화면 클리어 */
  clear() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  /** 배경 그리기 (격자 패턴) */
  drawBackground(camera) {
    const ctx = this.ctx;
    const w = GameConfig.canvasWidth;
    const h = GameConfig.canvasHeight;

    // 어두운 배경
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // 격자 패턴
    const gridSize = 50;
    const offsetX = -camera.x % gridSize;
    const offsetY = -camera.y % gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let x = offsetX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
}
