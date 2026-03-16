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
 *   PLAYER       — HP, 레벨, XP, 속도, 흡수 범위, 상태이상
 *   WEAPONS      — 보유 무기별 레벨·데미지·쿨다운
 *   WAVE         — 경과 시간, 킬수, 현재 spawnPerSecond, 적 종류
 *   BOSS         — 보스 등장 여부, 억제 구간 잔여 시간 (DEBUG 추가)
 *
 * PATCH(perf): DOM 갱신 주기를 매 4프레임 1회로 제한.
 * DEBUG(feature): PLAYER 섹션에 상태이상(Status) 항목 추가.
 * DEBUG(feature): BOSS 섹션 추가 — 보스 억제 상태를 실시간으로 확인.
 *   입력: spawnDebugInfo = SpawnSystem.getDebugInfo(elapsedTime)
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
    this._backtickWasDown = false;

    // PATCH(perf): DOM 갱신 throttle 카운터
    this._updateCounter = 0;
  }

  /**
   * 매 프레임 호출 (visible 일 때만 DOM 갱신)
   * @param {object} world          — 월드 상태 (읽기 전용)
   * @param {object} pools          — { projectilePool, effectPool }
   * @param {number} dt             — 이번 프레임 deltaTime (초)
   * @param {Array}  waveData       — waveData 배열
   * @param {object} spawnDebugInfo — SpawnSystem.getDebugInfo() 결과 (보스 억제 상태)
   */
  update(world, pools, dt, waveData, spawnDebugInfo = null) {
    // FPS 버퍼 갱신은 항상 수행 (숨겨 있어도 데이터 유지)
    this._dtBuffer.push(dt);
    if (this._dtBuffer.length > 60) this._dtBuffer.shift();

    if (this.el.style.display === 'none') return;

    // PATCH(perf): 4프레임마다 1회만 innerHTML 갱신
    this._updateCounter++;
    if (this._updateCounter % 4 !== 0) return;

    const avgDt   = this._dtBuffer.reduce((a, b) => a + b, 0) / this._dtBuffer.length;
    const fps     = avgDt > 0 ? Math.round(1 / avgDt) : 0;
    const frameMs = (avgDt * 1000).toFixed(1);
    const fpsClass = fps < 30 ? 'dbg-warn' : fps < 50 ? 'dbg-caution' : 'dbg-ok';

    const elapsed = world.elapsedTime ?? 0;
    let activeWave = null;
    for (const wave of waveData) {
      if (elapsed >= wave.from && elapsed < wave.to) { activeWave = wave; break; }
    }

    const p        = world.player;
    const xpNeeded = p ? getXpForLevel(p.level) : 0;

    // PLAYER 섹션: 상태이상 포맷팅 — "type(남은초s)" 형식
    const statusText = p?.statusEffects?.length
      ? p.statusEffects.map(e => `${e.type}(${e.remaining.toFixed(1)}s)`).join(' ')
      : '-';

    // BOSS 섹션: 억제 상태 포맷팅
    let bossHtml = '';
    if (spawnDebugInfo) {
      const { hasBossSpawned, isSuppressed, suppressionRemaining, bossSpawnedAt } = spawnDebugInfo;
      const bossStatus = !hasBossSpawned
        ? '<span class="dbg-val">미등장</span>'
        : isSuppressed
          ? `<span class="dbg-val dbg-warn">억제 중 (${suppressionRemaining.toFixed(1)}s)</span>`
          : '<span class="dbg-val dbg-ok">정상</span>';
      const spawnAtText = bossSpawnedAt !== null
        ? `${bossSpawnedAt.toFixed(1)}s`
        : '-';

      bossHtml = `
      <div class="dbg-section">
        <div class="dbg-title">BOSS</div>
        <div class="dbg-row"><span class="dbg-key">Status</span>${bossStatus}</div>
        <div class="dbg-row"><span class="dbg-key">Spawned at</span><span class="dbg-val">${spawnAtText}</span></div>
      </div>`;
    }

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
        <div class="dbg-row"><span class="dbg-key">HP</span>        <span class="dbg-val">${Math.ceil(p.hp)} / ${p.maxHp}</span></div>
        <div class="dbg-row"><span class="dbg-key">Level</span>     <span class="dbg-val">${p.level}</span></div>
        <div class="dbg-row"><span class="dbg-key">XP</span>        <span class="dbg-val">${p.xp} / ${xpNeeded}</span></div>
        <div class="dbg-row"><span class="dbg-key">Speed</span>     <span class="dbg-val">${Math.round(p.moveSpeed)} px/s</span></div>
        <div class="dbg-row"><span class="dbg-key">Magnet</span>    <span class="dbg-val">${Math.round(p.magnetRadius)} px</span></div>
        <div class="dbg-row"><span class="dbg-key">Lifesteal</span> <span class="dbg-val">${((p.lifesteal || 0) * 100).toFixed(0)}%</span></div>
        <div class="dbg-row"><span class="dbg-key">Invincible</span><span class="dbg-val">${p.invincibleTimer > 0 ? p.invincibleTimer.toFixed(2) + 's' : '-'}</span></div>
        <div class="dbg-row"><span class="dbg-key">Status</span>    <span class="dbg-val">${statusText}</span></div>
        ` : '<div class="dbg-row"><span class="dbg-val">없음</span></div>'}
      </div>

      <div class="dbg-section">
        <div class="dbg-title">WEAPONS</div>
        ${p?.weapons?.length ? p.weapons.map(w => `
          <div class="dbg-row"><span class="dbg-key">${w.name}</span><span class="dbg-val">Lv${w.level} | ${w.damage}dmg | ${w.cooldown.toFixed(2)}s</span></div>
        `).join('') : '<div class="dbg-row"><span class="dbg-val">없음</span></div>'}
      </div>

      <div class="dbg-section">
        <div class="dbg-title">WAVE</div>
        <div class="dbg-row"><span class="dbg-key">Time</span>     <span class="dbg-val">${elapsed.toFixed(1)}s</span></div>
        <div class="dbg-row"><span class="dbg-key">Kills</span>    <span class="dbg-val">${world.killCount ?? 0}</span></div>
        <div class="dbg-row"><span class="dbg-key">Rate</span>     <span class="dbg-val">${activeWave?.spawnPerSecond?.toFixed(2) ?? '-'}/s</span></div>
        <div class="dbg-row"><span class="dbg-key">Enemies</span>  <span class="dbg-val">${activeWave?.enemyIds?.join(', ') ?? '-'}</span></div>
      </div>

      ${bossHtml}
    `;
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
