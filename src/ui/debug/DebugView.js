import { getXpForLevel } from '../../data/constants.js';

/**
 * DebugView — 백쿼트(`) 토글 디버그 패널
 *
 * 규칙: 읽기 전용 표현 계층 — world / pools 상태를 직접 수정하지 않음
 * 위치: 화면 우상단
 *
 * 표시 항목:
 *   PERFORMANCE  — FPS, 프레임 시간
 *   ENTITIES     — 적·투사체·픽업·이펙트 수, 풀 잔여
 *   PLAYER       — HP, 레벨, XP, 속도, 흡수 범위
 *   WEAPONS      — 보유 무기별 레벨·데미지·쿨다운
 *   WAVE         — 경과 시간, 킬수, 현재 spawnPerSecond, 적 종류
 */
export class DebugView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'debug-panel';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    // FPS 측정: 최근 60프레임 dt 보관
    this._dtBuffer = [];
  }

  /**
   * 매 프레임 호출 (visible 일 때만 DOM 갱신)
   * @param {object} world    — 월드 상태 (읽기 전용)
   * @param {object} pools    — { projectilePool, effectPool }
   * @param {number} dt       — 이번 프레임 deltaTime (초)
   * @param {Array}  waveData — waveData 배열
   */
  update(world, pools, dt, waveData) {
    // FPS 버퍼 갱신은 항상 수행 (숨겨 있어도 데이터 유지)
    this._dtBuffer.push(dt);
    if (this._dtBuffer.length > 60) this._dtBuffer.shift();

    // 패널이 숨겨져 있으면 DOM 갱신 생략 (비용 절감)
    if (this.el.style.display === 'none') return;

    const avgDt  = this._dtBuffer.reduce((a, b) => a + b, 0) / this._dtBuffer.length;
    const fps    = avgDt > 0 ? Math.round(1 / avgDt) : 0;
    const frameMs = (avgDt * 1000).toFixed(1);
    const fpsClass = fps < 30 ? 'dbg-warn' : fps < 50 ? 'dbg-caution' : 'dbg-ok';

    const elapsed = world.elapsedTime ?? 0;
    let activeWave = null;
    for (const wave of waveData) {
      if (elapsed >= wave.from && elapsed < wave.to) { activeWave = wave; break; }
    }

    const p       = world.player;
    const xpNeeded = p ? getXpForLevel(p.level) : 0;

    this.el.innerHTML = `
      <div class="dbg-section">
        <div class="dbg-title">PERFORMANCE</div>
        <div class="dbg-row">
          <span class="dbg-key">FPS</span>
          <span class="dbg-val ${fpsClass}">${fps}</span>
        </div>
        <div class="dbg-row">
          <span class="dbg-key">Frame</span>
          <span class="dbg-val">${frameMs} ms</span>
        </div>
      </div>

      <div class="dbg-section">
        <div class="dbg-title">ENTITIES</div>
        <div class="dbg-row"><span class="dbg-key">Enemies</span>     <span class="dbg-val">${world.enemies.length}</span></div>
        <div class="dbg-row"><span class="dbg-key">Projectiles</span> <span class="dbg-val">${world.projectiles.length}</span></div>
        <div class="dbg-row"><span class="dbg-key">Pickups</span>     <span class="dbg-val">${world.pickups.length}</span></div>
        <div class="dbg-row"><span class="dbg-key">Effects</span>     <span class="dbg-val">${world.effects.length}</span></div>
        <div class="dbg-sep"></div>
        <div class="dbg-row"><span class="dbg-key">Pool proj</span>   <span class="dbg-val">${pools.projectilePool?.available ?? '-'} avail</span></div>
        <div class="dbg-row"><span class="dbg-key">Pool effect</span> <span class="dbg-val">${pools.effectPool?.available ?? '-'} avail</span></div>
      </div>

      <div class="dbg-section">
        <div class="dbg-title">PLAYER</div>
        ${p ? `
        <div class="dbg-row"><span class="dbg-key">HP</span>       <span class="dbg-val">${Math.ceil(p.hp)} / ${p.maxHp}</span></div>
        <div class="dbg-row"><span class="dbg-key">Level</span>    <span class="dbg-val">${p.level}</span></div>
        <div class="dbg-row"><span class="dbg-key">XP</span>       <span class="dbg-val">${p.xp} / ${xpNeeded}</span></div>
        <div class="dbg-row"><span class="dbg-key">Speed</span>    <span class="dbg-val">${Math.round(p.moveSpeed)} px/s</span></div>
        <div class="dbg-row"><span class="dbg-key">Magnet</span>   <span class="dbg-val">${Math.round(p.magnetRadius)} px</span></div>
        <div class="dbg-row"><span class="dbg-key">Lifesteal</span><span class="dbg-val">${((p.lifesteal || 0) * 100).toFixed(0)}%</span></div>
        ` : '<div class="dbg-row"><span class="dbg-key">-</span></div>'}
      </div>

      <div class="dbg-section">
        <div class="dbg-title">WEAPONS</div>
        ${p?.weapons?.length ? p.weapons.map(w => `
          <div class="dbg-row">
            <span class="dbg-key">${w.id}</span>
            <span class="dbg-val">Lv${w.level} dmg:${w.damage} cd:${w.cooldown.toFixed(2)}s</span>
          </div>`).join('') : '<div class="dbg-row"><span class="dbg-key">없음</span></div>'}
      </div>

      <div class="dbg-section">
        <div class="dbg-title">WAVE</div>
        <div class="dbg-row"><span class="dbg-key">Time</span>     <span class="dbg-val">${Math.floor(elapsed)}s</span></div>
        <div class="dbg-row"><span class="dbg-key">Kills</span>    <span class="dbg-val">${world.killCount}</span></div>
        <div class="dbg-row"><span class="dbg-key">Spawn/s</span>  <span class="dbg-val">${activeWave?.spawnPerSecond ?? '-'}</span></div>
        <div class="dbg-row"><span class="dbg-key">EliteChance</span><span class="dbg-val">${activeWave?.eliteChance ? (activeWave.eliteChance * 100).toFixed(0) + '%' : '-'}</span></div>
        <div class="dbg-row"><span class="dbg-key">Types</span>    <span class="dbg-val dbg-small">${activeWave?.enemyIds?.join(', ') ?? '-'}</span></div>
      </div>

      <div class="dbg-hint">\` 로 토글</div>
    `;
  }

  show()   { this.el.style.display = 'block'; }
  hide()   { this.el.style.display = 'none';  }
  toggle() { this.el.style.display === 'none' ? this.show() : this.hide(); }
  get visible() { return this.el.style.display !== 'none'; }
  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('debug-styles')) return;
    const style = document.createElement('style');
    style.id = 'debug-styles';
    style.textContent = `
      #debug-panel {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 256px;
        background: rgba(0, 0, 0, 0.80);
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 6px;
        padding: 8px 10px;
        font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
        font-size: 11px;
        color: #c0c0c0;
        pointer-events: none;
        z-index: 200;
        user-select: none;
        line-height: 1;
      }
      .dbg-section  { margin-bottom: 9px; }
      .dbg-title {
        font-size: 9px;
        font-weight: bold;
        color: #555;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        margin-bottom: 4px;
        padding-bottom: 2px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .dbg-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        line-height: 1.75;
      }
      .dbg-sep {
        height: 4px;
        border-top: 1px solid rgba(255,255,255,0.06);
        margin: 2px 0;
      }
      .dbg-key   { color: #666; }
      .dbg-val   { color: #ddd; text-align: right; max-width: 155px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dbg-small { font-size: 10px; }
      .dbg-ok      { color: #81c784; }
      .dbg-caution { color: #ffb74d; }
      .dbg-warn    { color: #e57373; }
      .dbg-hint {
        text-align: center;
        color: #333;
        font-size: 9px;
        margin-top: 2px;
        letter-spacing: 0.5px;
      }
    `;
    document.head.appendChild(style);
  }
}
