/**
 * PauseView — ESC 일시정지 오버레이 (뱀파이어 서바이벌 스타일)
 *
 * 레이아웃:
 *   좌측 패널 : 보유 무기(아이템) + 장신구 슬롯
 *   우측 패널 : 플레이어 체력/스탯 + 하단 버튼(재개 / 메인메뉴)
 *
 * 특징:
 *   - 무기/장신구를 VS처럼 아이콘+레벨 뱃지 형태로 표시
 *   - HP 바를 대형으로 상단에 배치
 *   - "메인메뉴로" 버튼 추가
 *   - 게임의 다크판타지 색감과 통일
 */
export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pv-overlay';
    this.el.style.display = 'none';
    this._onResume    = null;
    this._onMainMenu  = null;
    this._injectStyles();
    container.appendChild(this.el);
  }

  /**
   * @param {object}        player
   * @param {Function}      onResume     재개 콜백
   * @param {Function|null} onMainMenu   메인메뉴 복귀 콜백 (없으면 버튼 미표시)
   */
  show(player, onResume, onMainMenu = null) {
    this._onResume   = onResume;
    this._onMainMenu = onMainMenu;
    this._render(player);
    this.el.style.display = 'flex';
  }

  hide() {
    this.el.style.display = 'none';
    this._onResume   = null;
    this._onMainMenu = null;
  }

  isVisible() { return this.el.style.display !== 'none'; }

  destroy() { this.el.remove(); }

  // ── 내부 렌더 ──────────────────────────────────────────────────────

  _render(player) {
    const weapons     = player.weapons     ?? [];
    const accessories = player.accessories ?? [];

    const hp    = Math.ceil(player.hp    ?? 0);
    const maxHp = Math.ceil(player.maxHp ?? 100);
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

    const hpColor   = hpPct > 60 ? '#e53935' : hpPct > 30 ? '#fb8c00' : '#b71c1c';
    const hpGlow    = hpPct > 60 ? 'rgba(229,57,53,0.45)' : hpPct > 30 ? 'rgba(251,140,0,0.45)' : 'rgba(183,28,28,0.7)';

    const speedVal   = Math.round(player.moveSpeed     ?? 0);
    const magnetVal  = Math.round(player.magnetRadius  ?? 0);
    const lifesteal  = ((player.lifesteal ?? 0) * 100).toFixed(0);
    const level      = player.level ?? 1;

    this.el.innerHTML = `
      <div class="pv-backdrop"></div>

      <div class="pv-panel">

        <!-- ── 상단 타이틀 ── -->
        <header class="pv-header">
          <div class="pv-rune" aria-hidden="true">⏸</div>
          <h2 class="pv-title">PAUSED</h2>
          <div class="pv-rune" aria-hidden="true">⏸</div>
        </header>

        <!-- ── 체력 바 ── -->
        <section class="pv-hp-section" aria-label="플레이어 체력">
          <div class="pv-hp-meta">
            <span class="pv-hp-icon">❤</span>
            <span class="pv-hp-label">HP</span>
            <span class="pv-hp-frac">${hp} <span class="pv-hp-sep">/</span> ${maxHp}</span>
            <span class="pv-hp-pct" style="color:${hpColor}">${Math.round(hpPct)}%</span>
          </div>
          <div class="pv-hp-track">
            <div class="pv-hp-fill"
                 style="width:${hpPct}%; background:${hpColor}; box-shadow:0 0 12px ${hpGlow};"></div>
            <div class="pv-hp-shine"></div>
          </div>
        </section>

        <!-- ── 본문: 좌(아이템) / 우(스탯) ── -->
        <div class="pv-body">

          <!-- 좌측: 무기 + 장신구 -->
          <aside class="pv-left">

            <!-- 무기 -->
            <div class="pv-block">
              <div class="pv-block-title">
                <span class="pv-block-icon">⚔</span>무기
                <span class="pv-block-count">${weapons.length}</span>
              </div>
              <div class="pv-item-grid">
                ${weapons.length > 0
                  ? weapons.map(w => `
                      <div class="pv-item-card pv-item-weapon" title="${w.description ?? w.name}">
                        <div class="pv-item-icon">${_weaponEmoji(w.behaviorId)}</div>
                        <div class="pv-item-info">
                          <div class="pv-item-name">${w.name}</div>
                          <div class="pv-item-stats">
                            DMG&nbsp;<b>${w.damage}</b>&nbsp;&nbsp;CD&nbsp;<b>${w.cooldown?.toFixed(1)}s</b>
                          </div>
                        </div>
                        <div class="pv-item-lvl">Lv.${w.level}</div>
                      </div>
                    `).join('')
                  : `<div class="pv-item-empty">보유 무기 없음</div>`
                }
              </div>
            </div>

            <!-- 장신구 -->
            <div class="pv-block">
              <div class="pv-block-title">
                <span class="pv-block-icon">💍</span>장신구
                <span class="pv-block-count">${accessories.length}/2</span>
              </div>
              <div class="pv-acc-grid">
                ${[0, 1].map(i => {
                  const acc = accessories[i];
                  if (acc) {
                    return `
                      <div class="pv-acc-card pv-acc-filled pv-acc-rarity-${acc.rarity ?? 'common'}">
                        <div class="pv-acc-gem">💎</div>
                        <div class="pv-acc-info">
                          <div class="pv-acc-name">${acc.name}</div>
                          <div class="pv-acc-desc">${acc.description}</div>
                        </div>
                        <div class="pv-acc-badge">${_rarityLabel(acc.rarity)}</div>
                      </div>
                    `;
                  }
                  return `
                    <div class="pv-acc-card pv-acc-empty">
                      <div class="pv-acc-empty-icon">○</div>
                      <div class="pv-acc-empty-label">빈 슬롯 ${i + 1}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </aside>

          <!-- 우측: 스탯 -->
          <aside class="pv-right">
            <div class="pv-block">
              <div class="pv-block-title">
                <span class="pv-block-icon">📊</span>스탯
              </div>
              <ul class="pv-stat-list">
                ${_statRow('레벨',       `Lv.${level}`,       '#ffd54f')}
                ${_statRow('이동 속도',   speedVal,            '#4fc3f7')}
                ${_statRow('자석 반경',   `${magnetVal}px`,    '#aed581')}
                ${_statRow('흡혈',        `${lifesteal}%`,     '#ef9a9a')}
              </ul>
            </div>

            <div class="pv-hint">ESC 또는 버튼으로 재개</div>
          </aside>

        </div>

        <!-- ── 하단 버튼 ── -->
        <footer class="pv-footer">
          <button class="pv-btn pv-btn-resume" id="pv-resume-btn">
            <span class="pv-btn-icon">▶</span>재개
          </button>
          ${this._onMainMenu !== null
            ? `<button class="pv-btn pv-btn-menu" id="pv-menu-btn">
                 <span class="pv-btn-icon">⌂</span>메인메뉴
               </button>`
            : ''
          }
        </footer>

      </div>
    `;

    this.el.querySelector('#pv-resume-btn')
      .addEventListener('click', () => { if (this._onResume) this._onResume(); });

    const menuBtn = this.el.querySelector('#pv-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => { if (this._onMainMenu) this._onMainMenu(); });
    }
  }

  _injectStyles() {
    if (document.getElementById('pauseview-styles')) return;
    const s = document.createElement('style');
    s.id = 'pauseview-styles';
    s.textContent = `
      /* ── 오버레이 ─────────────────────────────────────────── */
      .pv-overlay {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        z-index: 35;
        font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
      }

      .pv-backdrop {
        position: absolute; inset: 0;
        background: rgba(4, 3, 10, 0.82);
        backdrop-filter: blur(3px);
      }

      /* ── 메인 패널 ────────────────────────────────────────── */
      .pv-panel {
        position: relative; z-index: 1;
        width: min(720px, calc(100vw - 24px));
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        background:
          linear-gradient(160deg, rgba(24,18,36,0.98) 0%, rgba(10,8,18,0.99) 100%);
        border: 1px solid rgba(180,140,90,0.22);
        border-radius: 20px;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.04) inset,
          0 32px 80px rgba(0,0,0,0.7),
          0 0 40px rgba(100,60,180,0.08);
        animation: pv-enter 0.24s cubic-bezier(0.34,1.56,0.64,1) both;
        padding: 0 0 24px;
      }

      @keyframes pv-enter {
        from { opacity:0; transform:scale(0.90) translateY(12px); }
        to   { opacity:1; transform:scale(1)    translateY(0);    }
      }

      /* ── 헤더 ─────────────────────────────────────────────── */
      .pv-header {
        display: flex; align-items: center; justify-content: center; gap: 14px;
        padding: 22px 28px 16px;
        border-bottom: 1px solid rgba(180,140,90,0.15);
      }

      .pv-title {
        font-size: 18px; font-weight: 800; letter-spacing: 6px;
        color: #c9a86c;
        text-shadow: 0 0 24px rgba(201,168,108,0.45);
        margin: 0;
      }

      .pv-rune {
        font-size: 14px; color: rgba(201,168,108,0.5);
        animation: pv-rune-pulse 2.4s ease-in-out infinite alternate;
      }
      @keyframes pv-rune-pulse {
        from { opacity: 0.4; } to { opacity: 1; }
      }

      /* ── HP 바 ────────────────────────────────────────────── */
      .pv-hp-section {
        padding: 18px 28px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }

      .pv-hp-meta {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 9px;
      }

      .pv-hp-icon { font-size: 14px; }

      .pv-hp-label {
        font-size: 12px; font-weight: 700; letter-spacing: 2px;
        color: rgba(240,220,190,0.6); text-transform: uppercase;
        flex: 1;
      }

      .pv-hp-frac {
        font-size: 16px; font-weight: 700; color: #f0dcc8;
      }
      .pv-hp-sep { color: rgba(240,220,200,0.3); font-size: 13px; margin: 0 2px; }

      .pv-hp-pct {
        font-size: 12px; font-weight: 700; width: 38px; text-align: right;
        transition: color 0.3s;
      }

      .pv-hp-track {
        position: relative; height: 12px;
        background: rgba(0,0,0,0.55);
        border-radius: 6px; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.07);
      }

      .pv-hp-fill {
        height: 100%; border-radius: 6px;
        transition: width 0.3s ease;
      }

      .pv-hp-shine {
        position: absolute; inset: 0;
        background: linear-gradient(180deg,
          rgba(255,255,255,0.12) 0%, transparent 55%);
        border-radius: 6px; pointer-events: none;
      }

      /* ── 본문 ─────────────────────────────────────────────── */
      .pv-body {
        display: grid; grid-template-columns: 1fr 200px;
        gap: 0; padding: 18px 28px 0;
      }

      .pv-left  { padding-right: 20px; border-right: 1px solid rgba(255,255,255,0.05); }
      .pv-right { padding-left: 20px; }

      /* ── 블록 공통 ────────────────────────────────────────── */
      .pv-block { margin-bottom: 18px; }

      .pv-block-title {
        display: flex; align-items: center; gap: 7px;
        font-size: 11px; font-weight: 700; letter-spacing: 2px;
        color: rgba(201,168,108,0.75); text-transform: uppercase;
        margin-bottom: 10px;
      }
      .pv-block-icon { font-size: 13px; }
      .pv-block-count {
        margin-left: auto;
        font-size: 11px; color: rgba(255,255,255,0.3);
      }

      /* ── 무기 카드 ────────────────────────────────────────── */
      .pv-item-grid { display: flex; flex-direction: column; gap: 7px; }

      .pv-item-card {
        display: flex; align-items: center; gap: 10px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,213,79,0.14);
        border-radius: 10px; padding: 9px 12px;
        position: relative; overflow: hidden;
        transition: border-color 0.2s, background 0.2s;
      }
      .pv-item-card::before {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(90deg,
          rgba(255,213,79,0.05) 0%, transparent 60%);
        pointer-events: none;
      }
      .pv-item-card:hover {
        border-color: rgba(255,213,79,0.3);
        background: rgba(255,213,79,0.06);
      }

      .pv-item-icon {
        font-size: 22px; width: 34px; text-align: center; flex-shrink: 0;
        filter: drop-shadow(0 0 6px rgba(255,213,79,0.3));
      }

      .pv-item-info { flex: 1; min-width: 0; }

      .pv-item-name {
        font-size: 13px; font-weight: 700; color: #f0dcc8;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        margin-bottom: 3px;
      }

      .pv-item-stats {
        font-size: 11px; color: rgba(255,255,255,0.45);
      }
      .pv-item-stats b { color: rgba(255,255,255,0.7); }

      .pv-item-lvl {
        font-size: 11px; font-weight: 800; color: #ffd54f;
        background: rgba(255,213,79,0.12);
        border: 1px solid rgba(255,213,79,0.25);
        border-radius: 20px; padding: 2px 8px;
        white-space: nowrap; flex-shrink: 0;
      }

      .pv-item-empty {
        font-size: 12px; color: rgba(255,255,255,0.2);
        padding: 8px 0; text-align: center;
      }

      /* ── 장신구 ───────────────────────────────────────────── */
      .pv-acc-grid { display: flex; flex-direction: column; gap: 7px; }

      .pv-acc-card {
        display: flex; align-items: center; gap: 10px;
        border-radius: 10px; padding: 9px 12px;
        border: 1px solid transparent;
        transition: border-color 0.2s;
      }

      .pv-acc-filled {
        background: rgba(255,255,255,0.04);
      }
      .pv-acc-rarity-common {
        border-color: rgba(173,216,230,0.2);
      }
      .pv-acc-rarity-rare {
        border-color: rgba(206,147,216,0.3);
        background: rgba(206,147,216,0.04);
      }

      .pv-acc-empty {
        border: 1px dashed rgba(255,255,255,0.1);
        opacity: 0.4;
      }

      .pv-acc-gem { font-size: 20px; flex-shrink: 0; }
      .pv-acc-empty-icon {
        font-size: 18px; color: rgba(255,255,255,0.2); flex-shrink: 0;
        width: 20px; text-align: center;
      }

      .pv-acc-info { flex: 1; min-width: 0; }
      .pv-acc-name {
        font-size: 13px; font-weight: 700; color: #e8d8f0;
        margin-bottom: 3px;
      }
      .pv-acc-desc { font-size: 11px; color: rgba(255,255,255,0.4); }
      .pv-acc-empty-label { font-size: 12px; color: rgba(255,255,255,0.2); }

      .pv-acc-badge {
        font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px;
        flex-shrink: 0;
        background: rgba(206,147,216,0.15); color: #ce93d8;
        border: 1px solid rgba(206,147,216,0.3);
      }
      .pv-acc-rarity-common .pv-acc-badge {
        background: rgba(144,202,249,0.12); color: #90caf9;
        border-color: rgba(144,202,249,0.25);
      }

      /* ── 스탯 리스트 ──────────────────────────────────────── */
      .pv-stat-list {
        list-style: none; margin: 0; padding: 0;
        display: flex; flex-direction: column; gap: 8px;
      }

      .pv-stat-row {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 12px;
      }
      .pv-stat-key  { color: rgba(255,255,255,0.4); }
      .pv-stat-val  { font-weight: 700; }

      .pv-hint {
        margin-top: 20px;
        font-size: 11px; color: rgba(255,255,255,0.2);
        text-align: center; line-height: 1.6;
      }

      /* ── 푸터 버튼 ────────────────────────────────────────── */
      .pv-footer {
        display: flex; justify-content: center; gap: 12px;
        padding: 20px 28px 0;
        border-top: 1px solid rgba(255,255,255,0.05);
        margin-top: 18px;
      }

      .pv-btn {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 32px; border: none; border-radius: 10px;
        font-size: 14px; font-weight: 700; letter-spacing: 1px;
        cursor: pointer;
        transition: transform 0.16s, box-shadow 0.16s, filter 0.16s;
      }
      .pv-btn:hover { transform: translateY(-2px); }

      .pv-btn-icon { font-size: 13px; }

      .pv-btn-resume {
        background: linear-gradient(135deg, #1565c0, #1976d2);
        color: #e3f2fd;
        box-shadow: 0 4px 18px rgba(21,101,192,0.4);
        border: 1px solid rgba(66,165,245,0.3);
      }
      .pv-btn-resume:hover {
        box-shadow: 0 6px 24px rgba(21,101,192,0.6);
        filter: brightness(1.1);
      }

      .pv-btn-menu {
        background: linear-gradient(135deg, rgba(40,28,18,0.9), rgba(30,20,12,0.95));
        color: #c9a86c;
        box-shadow: 0 4px 18px rgba(0,0,0,0.4);
        border: 1px solid rgba(201,168,108,0.3);
      }
      .pv-btn-menu:hover {
        background: linear-gradient(135deg, rgba(60,42,22,0.95), rgba(40,28,14,0.98));
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        border-color: rgba(201,168,108,0.55);
      }

      /* ── 반응형 ───────────────────────────────────────────── */
      @media (max-width: 540px) {
        .pv-body { grid-template-columns: 1fr; }
        .pv-left { padding-right: 0; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 16px; }
        .pv-right { padding-left: 0; padding-top: 16px; }
        .pv-footer { flex-direction: column-reverse; }
        .pv-btn { justify-content: center; }
      }

      @media (prefers-reduced-motion: reduce) {
        .pv-panel, .pv-btn, .pv-rune { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(s);
  }
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────

function _statRow(key, val, color) {
  return `
    <li class="pv-stat-row">
      <span class="pv-stat-key">${key}</span>
      <span class="pv-stat-val" style="color:${color}">${val}</span>
    </li>
  `;
}

function _rarityLabel(rarity) {
  return rarity === 'rare' ? '희귀' : '일반';
}

/** behaviorId → 무기 이모지 매핑 */
function _weaponEmoji(behaviorId) {
  const MAP = {
    targetProjectile: '🔵',
    orbit:            '⚡',
    areaBurst:        '✨',
    boomerangWeapon:  '🪃',
    chainLightning:   '⚡',
  };
  return MAP[behaviorId] ?? '⚔';
}
