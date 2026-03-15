import { GameConfig } from '../core/GameConfig.js';
export class CanvasRenderer {
  constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; }
  clear() {
    const ctx = this.ctx;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }
  drawBackground(camera) {
    const ctx = this.ctx;
    const w = GameConfig.canvasWidth, h = GameConfig.canvasHeight;
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, w, h);
    const gridSize = 50;
    const offsetX = -camera.x % gridSize, offsetY = -camera.y % gridSize;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (let x = offsetX; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = offsetY; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  }
}
