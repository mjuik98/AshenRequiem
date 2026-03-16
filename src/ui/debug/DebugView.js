import { getXpForLevel } from '../../data/constants.js';

/**
 * DebugView — 백쿼트(`) 토글 디버그 패널
 *
 * PERF: innerHTML 전체 교체 → 생성자에서 DOM 1회 구성 후 textContent 만 갱신
 *       (reflow 없이 텍스트 노드만 바뀌어 개발 중 오픈 상태에서도 성능 영향 최소화)
 * PATCH: 갱신 주기 4프레임 1회 throttle 유지
 */
export class DebugView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'debug-panel';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._dtBuffer       = [];
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
        const row  = document.createElement('div');
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
    // FPS 버퍼 갱신 (항상)
    this._dtBuffer.push(dt);
    if (this._dtBuffer.length > 60) this._dtBuffer.shift();

    if (this.el.style.display === 'none') return;

    // throttle: 4프레임 1회
    this._updateCounter++;
    if (this._updateCounter % 4 !== 0) return;

    const fps = this._dtBuffer.length > 0
      ? Math.round(1 / (this._dtBuffer.reduce((a, b) => a + b, 0) / this._dtBuffer.length))
      : 0;
    const frameMs = dt > 0 ? (dt * 1000).toFixed(1) : '-';

    const player  = world.player;
    const secs    = Math.floor(world.elapsedTime);
    const mm      = Math.floor(secs / 60);
    const ss      = String(secs % 60).padStart(2, '0');

    let activeWaveRate = '-';
    if (waveData) {
      const w = waveData.find(w => world.elapsedTime >= w.from && world.elapsedTime < w.to);
      if (w) activeWaveRate = w.spawnPerSecond.toFixed(1) + '/s';
    }

    const waveEnemies = waveData
      ? (waveData.find(w => world.elapsedTime >= w.from && world.elapsedTime < w.to)?.enemyIds?.join(', ') ?? '-')
      : '-';

    const set = (id, val) => { if (this._vals[id]) this._vals[id].textContent = val; };

    set('dbg-fps',         `${fps} FPS`);
    set('dbg-frame',       `${frameMs} ms`);
    set('dbg-enemies',     world.enemies.length);
    set('dbg-proj',        world.projectiles.length);
    set('dbg-pickups',     world.pickups.length);
    set('dbg-effects',     world.effects.length);
    set('dbg-pool-proj',   pools.projectilePool?.available ?? '-');
    set('dbg-pool-fx',     pools.effectPool?.available ?? '-');
    set('dbg-hp',          player ? `${Math.ceil(player.hp)} / ${player.maxHp}` : '-');
    set('dbg-level',       player?.level ?? '-');
    set('dbg-xp',          player ? `${player.xp} / ${getXpForLevel(player.level)}` : '-');
    set('dbg-speed',       player ? player.moveSpeed.toFixed(0) : '-');
    set('dbg-magnet',      player ? player.magnetRadius.toFixed(0) : '-');
    set('dbg-status',      player?.statusEffects?.map(e => e.type).join(', ') || 'none');
    set('dbg-weapons',     player?.weapons?.map(w => `${w.id}(Lv${w.level})`).join(', ') || '-');
    set('dbg-time',        `${mm}:${ss}`);
    set('dbg-kills',       world.killCount);
    set('dbg-rate',        activeWaveRate);
    set('dbg-wave-enemies',waveEnemies);
    set('dbg-boss-status', spawnDebug?.hasBossSpawned ? '등장함' : '미등장');
    set('dbg-boss-at',     spawnDebug?.bossSpawnedAt != null ? spawnDebug.bossSpawnedAt.toFixed(0) + 's' : '-');
    set('dbg-boss-sup',    spawnDebug?.isSuppressed ? `${spawnDebug.suppressionRemaining.toFixed(1)}s 남음` : 'No');
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('debug-styles')) return;
    const s = document.createElement('style');
    s.id = 'debug-styles';
    s.textContent = `
      #debug-panel {
        position: absolute; top: 8px; right: 8px;
        background: rgba(10,12,20,0.88); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px; padding: 10px 14px;
        font-size: 11px; font-family: 'Consolas', monospace; color: #ccc;
        min-width: 220px; z-index: 50; pointer-events: none;
        line-height: 1.6;
      }
      .dbg-section { margin-bottom: 8px; }
      .dbg-title {
        font-size: 10px; font-weight: 700; color: #4fc3f7;
        letter-spacing: 1px; border-bottom: 1px solid rgba(79,195,247,0.2);
        padding-bottom: 2px; margin-bottom: 2px;
      }
      .dbg-row { display: flex; justify-content: space-between; gap: 12px; }
      .dbg-key { color: #888; }
      .dbg-val { color: #fff; font-weight: 600; }
    `;
    document.head.appendChild(s);
  }
}
