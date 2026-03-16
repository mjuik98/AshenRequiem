import { getXpForLevel } from '../../data/constants.js';

/**
 * DebugView — 백쿼트(`) 토글 디버그 패널
 *
 * 규칙: 읽기 전용 표현 계층 — world / pools 상태를 직접 수정하지 않음
 * 위치: 화면 우상단
 *
 * PERF(refactor): innerHTML 전체 교체 → element 참조 기반 textContent 갱신.
 *   이전: 4프레임마다 패널 전체 innerHTML 을 문자열로 교체 → DOM 재파싱 비용.
 *   이후: 생성자에서 섹션/행 DOM 을 한 번만 구성 → update() 에서 값 노드만 교체.
 *         reflow 없이 텍스트 노드만 바뀌므로 개발 중 패널 오픈 상태에서도 성능 영향 최소화.
 *
 * PATCH(perf): DOM 갱신 주기를 매 4프레임 1회로 유지 (값 노드 교체도 throttle).
 * DEBUG(feature): PLAYER 섹션에 상태이상(Status) 항목 추가.
 * DEBUG(feature): BOSS 섹션 — 보스 억제 상태 실시간 표시.
 */
export class DebugView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.id = 'debug-panel';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._dtBuffer = [];
    this._backtickWasDown = false;
    this._updateCounter = 0;

    // 패널 내부 DOM 구조를 한 번만 생성
    this._buildDOM();
  }

  /** 패널 구조를 한 번만 생성하고 값 노드 참조를 저장 */
  _buildDOM() {
    const rows = [
      // [섹션 타이틀, [[key, valueId], ...]]
      ['PERFORMANCE', [
        ['FPS',   'dbg-fps'],
        ['Frame', 'dbg-frame'],
      ]],
      ['ENTITIES', [
        ['Enemies',     'dbg-enemies'],
        ['Projectiles', 'dbg-proj'],
        ['Pickups',     'dbg-pickups'],
        ['Effects',     'dbg-effects'],
        ['Pool Proj',   'dbg-pool-proj'],
        ['Pool Effect', 'dbg-pool-fx'],
      ]],
      ['PLAYER', [
        ['HP',     'dbg-hp'],
        ['Level',  'dbg-level'],
        ['XP',     'dbg-xp'],
        ['Speed',  'dbg-speed'],
        ['Magnet', 'dbg-magnet'],
        ['Status', 'dbg-status'],
      ]],
      ['WEAPONS', [
        ['Equipped', 'dbg-weapons'],
      ]],
      ['WAVE', [
        ['Time',    'dbg-time'],
        ['Kills',   'dbg-kills'],
        ['Rate',    'dbg-rate'],
        ['Enemies', 'dbg-wave-enemies'],
      ]],
      ['BOSS', [
        ['Status',    'dbg-boss-status'],
        ['Spawned at','dbg-boss-at'],
        ['Suppressed','dbg-boss-sup'],
      ]],
    ];

    this._vals = {};

    rows.forEach(([title, fields]) => {
      const section = document.createElement('div');
      section.className = 'dbg-section';

      const titleEl = document.createElement('div');
      titleEl.className = 'dbg-title';
      titleEl.textContent = title;
      section.appendChild(titleEl);

      fields.forEach(([key, id]) => {
        const row = document.createElement('div');
        row.className = 'dbg-row';

        const keyEl = document.createElement('span');
        keyEl.className = 'dbg-key';
        keyEl.textContent = key;

        const valEl = document.createElement('span');
        valEl.className = 'dbg-val';
        valEl.textContent = '-';

        row.appendChild(keyEl);
        row.appendChild(valEl);
        section.appendChild(row);

        this._vals[id] = valEl;
      });

      this.el.appendChild(section);
    });
  }

  /** 값 노드 참조를 통한 갱신 (textContent 만 교체 — reflow 없음) */
  _set(id, text, cls) {
    const el = this._vals[id];
    if (!el) return;
    el.textContent = text;
    if (cls) {
      el.className = 'dbg-val ' + cls;
    } else {
      el.className = 'dbg-val';
    }
  }

  update(world, pools, dt, waveData, spawnDebugInfo = null) {
    // FPS 버퍼 갱신은 항상 수행 (숨겨 있어도 데이터 유지)
    this._dtBuffer.push(dt);
    if (this._dtBuffer.length > 60) this._dtBuffer.shift();

    if (this.el.style.display === 'none') return;

    // PERF: 4프레임마다 1회만 DOM 갱신
    this._updateCounter++;
    if (this._updateCounter % 4 !== 0) return;

    const avgDt   = this._dtBuffer.reduce((a, b) => a + b, 0) / this._dtBuffer.length;
    const fps     = avgDt > 0 ? Math.round(1 / avgDt) : 0;
    const frameMs = (avgDt * 1000).toFixed(1);
    const fpsCls  = fps < 30 ? 'dbg-val dbg-warn' : fps < 50 ? 'dbg-val dbg-caution' : 'dbg-val dbg-ok';

    // PERFORMANCE
    const fpsEl = this._vals['dbg-fps'];
    if (fpsEl) { fpsEl.textContent = fps; fpsEl.className = fpsCls; }
    this._set('dbg-frame', `${frameMs} ms`);

    // ENTITIES
    const pp = pools.projectilePool;
    const ep = pools.effectPool;
    this._set('dbg-enemies',   world.enemies?.length     ?? 0);
    this._set('dbg-proj',      world.projectiles?.length ?? 0);
    this._set('dbg-pickups',   world.pickups?.length     ?? 0);
    this._set('dbg-effects',   world.effects?.length     ?? 0);
    this._set('dbg-pool-proj', pp ? `${pp.activeCount}/${pp.totalCount}` : '-');
    this._set('dbg-pool-fx',   ep ? `${ep.activeCount}/${ep.totalCount}` : '-');

    // PLAYER
    const p = world.player;
    const xpNeeded = p ? getXpForLevel(p.level) : 0;
    this._set('dbg-hp',     p ? `${Math.ceil(p.hp)}/${p.maxHp}` : '-');
    this._set('dbg-level',  p?.level ?? '-');
    this._set('dbg-xp',     p ? `${p.xp}/${xpNeeded}` : '-');
    this._set('dbg-speed',  p?.moveSpeed ?? '-');
    this._set('dbg-magnet', p?.magnetRadius ?? '-');
    const statusText = p?.statusEffects?.length
      ? p.statusEffects.map(e => `${e.type}(${e.remaining.toFixed(1)}s)`).join(' ')
      : '-';
    this._set('dbg-status', statusText);

    // WEAPONS
    const weaponText = p?.weapons?.length
      ? p.weapons.map(w => `${w.id} Lv${w.level ?? 1}`).join(', ')
      : '-';
    this._set('dbg-weapons', weaponText);

    // WAVE
    const elapsed = world.elapsedTime ?? 0;
    let activeWave = null;
    for (const wave of waveData) {
      if (elapsed >= wave.from && elapsed < wave.to) { activeWave = wave; break; }
    }
    this._set('dbg-time',         elapsed.toFixed(1) + 's');
    this._set('dbg-kills',        world.killCount ?? 0);
    this._set('dbg-rate',         activeWave ? activeWave.spawnPerSecond.toFixed(2) + '/s' : '-');
    this._set('dbg-wave-enemies', activeWave ? activeWave.enemyIds.join(', ') : '-');

    // BOSS
    if (spawnDebugInfo) {
      const { hasBossSpawned, isSuppressed, suppressionRemaining, bossSpawnedAt } = spawnDebugInfo;
      this._set('dbg-boss-status', !hasBossSpawned ? '미등장' : isSuppressed ? '억제 중' : '활성');
      this._set('dbg-boss-at',     bossSpawnedAt !== null ? bossSpawnedAt.toFixed(1) + 's' : '-');
      this._set('dbg-boss-sup',    isSuppressed ? suppressionRemaining.toFixed(1) + 's' : '-');
    }
  }

  handleInput(input) {
    const isDown = input.isKeyDown('Backquote') || input.isKeyDown('`');
    if (isDown && !this._backtickWasDown) {
      this.el.style.display = this.el.style.display === 'none' ? 'block' : 'none';
    }
    this._backtickWasDown = isDown;
  }

  destroy() { this.el.remove(); }

  _injectStyles() {
    if (document.getElementById('debug-styles')) return;
    const style = document.createElement('style');
    style.id = 'debug-styles';
    style.textContent = `
      #debug-panel {
        position: absolute; top: 8px; right: 8px;
        background: rgba(10,10,15,0.92);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        padding: 10px 14px;
        font-family: 'Consolas','Courier New',monospace;
        font-size: 11px;
        color: #ccc;
        z-index: 200;
        min-width: 240px;
        max-height: 90vh;
        overflow-y: auto;
        pointer-events: none;
      }
      .dbg-section { margin-bottom: 8px; }
      .dbg-title {
        color: #4fc3f7;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1px;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .dbg-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        line-height: 1.5;
      }
      .dbg-key { color: #888; white-space: nowrap; }
      .dbg-val { color: #eee; text-align: right; word-break: break-all; }
      .dbg-ok      { color: #66bb6a; }
      .dbg-caution { color: #ffa726; }
      .dbg-warn    { color: #ef5350; }
      .dbg-sep {
        border-top: 1px solid rgba(255,255,255,0.07);
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);
  }
}
