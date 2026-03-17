import { getXpForLevel } from '../../data/constants.js';

/**
 * DebugView — 백쿼트(`) 토글 디버그 패널
 *
 * PERF: innerHTML 전체 교체 → 생성자에서 DOM 1회 구성 후 textContent 만 갱신
 * PATCH: 갱신 주기 4프레임 1회 throttle
 */
export class DebugView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'debug-panel';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._dtBuffer        = [];
    this._backtickWasDown = false;
    this._updateCounter   = 0;
    this._vals            = {};
    this._buildDOM();
  }

  _buildDOM() {
    const sections = [
      ['PERFORMANCE', [['FPS','dbg-fps'],['Frame','dbg-frame']]],
      ['ENTITIES',    [['Enemies','dbg-enemies'],['Projectiles','dbg-proj'],['Pickups','dbg-pickups'],['Effects','dbg-effects'],['Pool Proj','dbg-pool-proj'],['Pool Effect','dbg-pool-fx']]],
      ['PLAYER',      [['HP','dbg-hp'],['Level','dbg-level'],['XP','dbg-xp'],['Speed','dbg-speed'],['Magnet','dbg-magnet'],['Status','dbg-status']]],
      ['WEAPONS',     [['Equipped','dbg-weapons']]],
      ['WAVE',        [['Time','dbg-time'],['Kills','dbg-kills'],['Rate','dbg-rate'],['Enemies','dbg-wave-enemies']]],
      ['BOSS',        [['Status','dbg-boss-status'],['Spawned at','dbg-boss-at'],['Suppressed','dbg-boss-sup']]],
    ];

    sections.forEach(([title, fields]) => {
      const sec = document.createElement('div');
      sec.className = 'dbg-section';

      const titleEl = document.createElement('div');
      titleEl.className   = 'dbg-title';
      titleEl.textContent = title;
      sec.appendChild(titleEl);

      fields.forEach(([key, id]) => {
        const row   = document.createElement('div');
        row.className = 'dbg-row';

        const keyEl = document.createElement('span');
        keyEl.className   = 'dbg-key';
        keyEl.textContent = key;

        const valEl = document.createElement('span');
        valEl.className = 'dbg-val';
        valEl.id        = id;

        row.appendChild(keyEl);
        row.appendChild(valEl);
        sec.appendChild(row);
        this._vals[id] = valEl;
      });

      this.el.appendChild(sec);
    });
  }

  handleInput(input) {
    const down = input.isDown('`');
    if (down && !this._backtickWasDown) {
      this.el.style.display = this.el.style.display === 'none' ? 'block' : 'none';
    }
    this._backtickWasDown = down;
  }

  update(world, pools, dt, waveData, spawnDebug) {
    this._dtBuffer.push(dt);
    if (this._dtBuffer.length > 60) this._dtBuffer.shift();

    if (this.el.style.display === 'none') return;

    this._updateCounter++;
    if (this._updateCounter % 4 !== 0) return;

    const fps = this._dtBuffer.length > 0
      ? Math.round(1 / (this._dtBuffer.reduce((a, b) => a + b, 0) / this._dtBuffer.length))
      : 0;
    const frameMs = dt > 0 ? (dt * 1000).toFixed(1) : '0';

    const player   = world.player;
    const xpNeeded = player ? getXpForLevel(player.level) : 0;

    // 활성 웨이브 탐색
    let activeWave = null;
    for (let i = 0; i < waveData.length; i++) {
      const w = waveData[i];
      if (world.elapsedTime >= w.from && world.elapsedTime < w.to) { activeWave = w; break; }
    }

    const set = (id, val) => { if (this._vals[id]) this._vals[id].textContent = val; };

    set('dbg-fps',        `${fps} fps`);
    set('dbg-frame',      `${frameMs} ms`);
    set('dbg-enemies',    world.enemies.length);
    set('dbg-proj',       world.projectiles.length);
    set('dbg-pickups',    world.pickups.length);
    set('dbg-effects',    world.effects.length);
    set('dbg-pool-proj',  pools.projectilePool?.available ?? '—');
    set('dbg-pool-fx',    pools.effectPool?.available     ?? '—');

    if (player) {
      set('dbg-hp',     `${Math.ceil(player.hp)} / ${player.maxHp}`);
      set('dbg-level',  player.level);
      set('dbg-xp',     `${player.xp} / ${xpNeeded}`);
      set('dbg-speed',  player.moveSpeed.toFixed(0));
      set('dbg-magnet', player.magnetRadius.toFixed(0));
      set('dbg-status', player.statusEffects.map(e => e.type).join(', ') || '—');
      set('dbg-weapons',player.weapons.map(w => `${w.name} Lv${w.level}`).join(' | ') || '—');
    }

    const elapsed = world.elapsedTime;
    const mm  = Math.floor(elapsed / 60);
    const sec = String(Math.floor(elapsed % 60)).padStart(2, '0');
    set('dbg-time',         `${mm}:${sec}`);
    set('dbg-kills',        world.killCount);
    set('dbg-rate',         activeWave ? activeWave.spawnPerSecond.toFixed(1) + '/s' : '—');
    set('dbg-wave-enemies', activeWave ? activeWave.enemyIds.join(', ') : '—');

    if (spawnDebug) {
      set('dbg-boss-status', spawnDebug.hasBossSpawned ? '등장' : '대기');
      set('dbg-boss-at',     spawnDebug.bossSpawnedAt !== null ? spawnDebug.bossSpawnedAt.toFixed(1) + 's' : '—');
      set('dbg-boss-sup',    spawnDebug.isSuppressed ? spawnDebug.suppressionRemaining.toFixed(1) + 's' : '—');
    }

    if (pools?.profiler) {
      if (!this._vals['dbg-profiler']) {
        const sec = document.createElement('div');
        sec.className = 'dbg-section';
        sec.id = 'dbg-profiler';
        this.el.appendChild(sec);
        this._vals['dbg-profiler'] = sec;
      }
      this._vals['dbg-profiler'].innerHTML = pools.profiler.toHtml();
    }
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('debug-styles')) return;
    const s = document.createElement('style');
    s.id = 'debug-styles';
    s.textContent = `
      #debug-panel {
        position: absolute; top: 60px; right: 12px;
        background: rgba(0,0,0,0.82); border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px; padding: 12px 14px;
        font-size: 11px; font-family: monospace; color: #ccc;
        z-index: 100; min-width: 220px; max-height: 80vh; overflow-y: auto;
        pointer-events: none;
      }
      .dbg-section { margin-bottom: 10px; }
      .dbg-title { color: #4fc3f7; font-size: 10px; letter-spacing: 1px; margin-bottom: 4px; }
      .dbg-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
      .dbg-key { color: #888; }
      .dbg-val { color: #eee; text-align: right; }
    `;
    document.head.appendChild(s);
  }
}
