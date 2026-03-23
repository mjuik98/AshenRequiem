/**
 * src/ui/codex/CodexView.js — 도감 DOM UI
 *
 * 세 가지 탭으로 구성된 게임 내 도감 화면.
 *
 * 탭 구성:
 *   - 적 도감   : 조우한 적의 스탯·드롭·처치 기록 열람
 *   - 무기 도감 : 획득·진화한 무기 목록 및 스탯 열람
 *   - 기록      : 런 통계 및 업적 진행도 열람
 *
 * 사용법:
 *   const view = new CodexView(container);
 *   view.show(gameData, session, onBack);
 *   view.destroy();
 *
 * 의존:
 *   - src/data/enemyData.js   → enemyData 배열
 *   - src/data/weaponData.js  → weaponData 배열
 *   - src/state/createSessionState.js → SessionState 타입
 *
 * session.meta 확장 필드 (CodexScene이 관리):
 *   session.meta.enemyKills  : Record<enemyId, number>  — 적별 처치 수
 *   session.meta.killedBosses: string[]                 — 처치한 보스 ID 목록
 *   session.meta.weaponsUsedAll: string[]               — 획득한 무기 ID 목록
 */
import {
  SUBSCREEN_SHARED_CSS,
  renderSubscreenFooter,
  renderSubscreenHeader,
} from '../shared/subscreenTheme.js';
import {
  buildCodexAchievements,
  buildCodexRecordSummary,
  buildCodexUnlockEntries,
  countCodexDiscovered,
  isCodexWeaponUnlocked,
} from './codexRecords.js';

export class CodexView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'cx-root ss-root';
    this.el.style.display = 'none';
    this._injectStyles();
    container.appendChild(this.el);

    this._onBack       = null;
    this._currentTier  = 'all';
    this._currentWType = 'all';
    this._selectedEnemy  = null;
    this._selectedWeapon = null;
    this._gameData = null;
    this._session  = null;

    this._handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this._onBack?.();
      }
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * @param {object} gameData  GameDataLoader 반환값 (enemyData, weaponData 포함)
   * @param {import('../../state/createSessionState.js').SessionState} session
   * @param {Function} onBack
   */
  show(gameData, session, onBack) {
    this._onBack   = onBack;
    this._gameData = gameData;
    this._session  = session;

    this._selectedEnemy  = null;
    this._selectedWeapon = null;
    this._currentTier    = 'all';
    this._currentWType   = 'all';

    this._render();
    this.el.style.display = 'block';
    window.addEventListener('keydown', this._handleKeyDown, true);
  }

  destroy() { 
    window.removeEventListener('keydown', this._handleKeyDown, true);
    this.el.remove(); 
  }

  // ── 전체 렌더 ─────────────────────────────────────────────────────────────

  _render() {
    const discovered  = countCodexDiscovered(this._session);
    const totalEnemies = (this._gameData?.enemyData ?? []).length;
    const totalWeapons = (this._gameData?.weaponData ?? []).length;

    this.el.innerHTML = `
      <div class="cx-panel ss-panel">

        ${renderSubscreenHeader({
          headerClass: 'cx-header',
          leftClass: 'cx-header-left',
          runeClass: 'cx-rune',
          titleClass: 'cx-title',
          titleTag: 'h2',
          rune: '📖',
          title: 'Codex',
          right: `<span class="cx-prog-pill ss-pill">${discovered} / ${totalEnemies + totalWeapons} 발견됨</span>`,
        })}

        <!-- 탭 네비 -->
        <nav class="cx-tabs" role="tablist" aria-label="도감 탭">
          <button class="cx-tab active" role="tab" aria-selected="true" data-tab="enemy">
            적 도감 <span class="cx-tab-cnt">${totalEnemies}</span>
          </button>
          <button class="cx-tab" role="tab" aria-selected="false" data-tab="weapon">
            무기 도감 <span class="cx-tab-cnt">${totalWeapons}</span>
          </button>
          <button class="cx-tab" role="tab" aria-selected="false" data-tab="records">
            기록
          </button>
        </nav>

        <!-- 콘텐츠 -->
        <div class="cx-content ss-scroll">
          <div class="cx-tab-content active" id="cx-tab-enemy"  role="tabpanel"></div>
          <div class="cx-tab-content"        id="cx-tab-weapon" role="tabpanel"></div>
          <div class="cx-tab-content"        id="cx-tab-records"role="tabpanel"></div>
        </div>

        ${renderSubscreenFooter({
          footerClass: 'cx-footer',
          backButtonClass: 'cx-back-btn',
          backButtonId: 'cx-back-btn',
        })}

      </div>
    `;

    this._bindTabEvents();
    this._renderEnemyTab();
    this._renderWeaponTab();
    this._renderRecordsTab();

    this.el.querySelector('#cx-back-btn')
      .addEventListener('click', () => this._onBack?.());
  }

  // ── 탭 전환 ───────────────────────────────────────────────────────────────

  _bindTabEvents() {
    this.el.querySelectorAll('.cx-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.tab;
        this.el.querySelectorAll('.cx-tab').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        this.el.querySelectorAll('.cx-tab-content').forEach(c => {
          c.classList.toggle('active', c.id === `cx-tab-${name}`);
        });
      });
    });
  }

  // ── 적 도감 탭 ────────────────────────────────────────────────────────────

  _renderEnemyTab() {
    const panel = this.el.querySelector('#cx-tab-enemy');
    panel.innerHTML = `
      <div class="cx-search-row">
        <input class="cx-search" id="cx-enemy-search" placeholder="적 이름 검색..." aria-label="적 검색">
        <div class="cx-tier-filter">
          <button class="cx-tf active" data-tier="all">전체</button>
          <button class="cx-tf" data-tier="normal">일반</button>
          <button class="cx-tf" data-tier="elite">엘리트</button>
          <button class="cx-tf" data-tier="boss">보스</button>
        </div>
      </div>
      <p class="cx-section-label" id="cx-enemy-label"></p>
      <div class="cx-enemy-grid" id="cx-enemy-grid"></div>
      <div id="cx-enemy-detail"></div>
    `;

    panel.querySelector('#cx-enemy-search')
      .addEventListener('input', e => this._refreshEnemyGrid(e.target.value));

    panel.querySelectorAll('.cx-tf').forEach(btn => {
      btn.addEventListener('click', () => {
        this._currentTier   = btn.dataset.tier;
        this._selectedEnemy = null;
        panel.querySelectorAll('.cx-tf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._refreshEnemyGrid('');
        panel.querySelector('#cx-enemy-detail').innerHTML = '';
        panel.querySelector('#cx-enemy-search').value = '';
      });
    });

    this._refreshEnemyGrid('');
  }

  _refreshEnemyGrid(search) {
    const enemies  = this._gameData?.enemyData ?? [];
    const kills    = this._session?.meta?.enemyKills ?? {};
    const met      = this._session?.meta?.enemiesEncountered ?? [];

    const tierMap  = { normal: '일반', elite: '엘리트', boss: '보스' };
    const tierText = this._currentTier === 'all' ? '전체' : tierMap[this._currentTier];

    const filtered = enemies.filter(e => {
      const tier = this._getEnemyTier(e);
      const matchTier   = this._currentTier === 'all' || tier === this._currentTier;
      const matchSearch = !search || (e.name ?? '').includes(search);
      return matchTier && matchSearch;
    });

    const panel = this.el.querySelector('#cx-tab-enemy');
    panel.querySelector('#cx-enemy-label').textContent = `${tierText} · ${filtered.length}종`;

    panel.querySelector('#cx-enemy-grid').innerHTML = filtered.map(e => {
      const tier      = this._getEnemyTier(e);
      const killCount = kills[e.id] ?? 0;
      const discovered = killCount > 0 || met.includes(e.id);
      const isSelected = this._selectedEnemy === e.id;
      const borderColor = e.isBoss ? 'rgba(255,64,129,0.7)' : e.isElite ? 'rgba(255,215,64,0.6)' : (e.color ?? '#888');

      return `
        <div class="cx-ecard ${tier} ${isSelected ? 'selected' : ''} ${!discovered ? 'locked' : ''}"
             data-id="${e.id}" role="button" tabindex="0"
             aria-label="${discovered ? e.name : '미발견 적'} 상세 보기">
          <div class="cx-eavatar" style="background:${(e.color??'#888')}22;border-color:${borderColor};color:${e.color??'#888'}">
            ${e.isBoss ? 'B' : e.isElite ? 'E' : (e.name?.[0] ?? '?')}
          </div>
          <div class="cx-ename">${discovered ? e.name : '???'}</div>
          <div class="cx-etype-row">
            <span class="cx-ebadge badge-${tier}">${tierMap[tier] ?? tier}</span>
          </div>
          ${discovered ? `
            <div class="cx-estats">
              <div class="cx-estat"><span class="v">${e.hp}</span><span class="k">HP</span></div>
              <div class="cx-estat"><span class="v">${e.damage}</span><span class="k">DMG</span></div>
              <div class="cx-estat"><span class="v">${e.moveSpeed}</span><span class="k">SPD</span></div>
              <div class="cx-estat"><span class="v">${e.xpValue}</span><span class="k">XP</span></div>
            </div>
            <div class="cx-ekills">처치 <span>${killCount.toLocaleString()}</span>회</div>
          ` : `
            <div class="cx-lock-overlay" aria-label="미발견">
              <div class="cx-lock-icon"><div class="arc"></div><div class="body"></div></div>
              <span class="cx-lock-text">미발견</span>
            </div>
          `}
        </div>`;
    }).join('');

    panel.querySelectorAll('.cx-ecard').forEach(card => {
      const activate = () => {
        this._selectedEnemy = this._selectedEnemy === card.dataset.id ? null : card.dataset.id;
        this._refreshEnemyGrid(panel.querySelector('#cx-enemy-search').value);
        this._renderEnemyDetail(panel.querySelector('#cx-enemy-detail'));
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
    });
  }

  _renderEnemyDetail(container) {
    if (!this._selectedEnemy) { container.innerHTML = ''; return; }

    const enemies  = this._gameData?.enemyData ?? [];
    const kills    = this._session?.meta?.enemyKills ?? {};
    const e        = enemies.find(x => x.id === this._selectedEnemy);
    const met      = this._session?.meta?.enemiesEncountered ?? [];
    if (!e) { container.innerHTML = ''; return; }

    const discovered = (kills[e.id] ?? 0) > 0 || met.includes(e.id);
    if (!discovered) { container.innerHTML = ''; return; }

    const killCount   = kills[e.id] ?? 0;
    const tier        = this._getEnemyTier(e);
    const tierMap     = { normal: '일반', elite: '엘리트', boss: '보스' };
    const borderColor = e.isBoss ? 'rgba(255,64,129,0.7)' : e.isElite ? 'rgba(255,215,64,0.6)' : (e.color ?? '#888');
    const milestones  = [10, 50, 100, 300, 500];
    const msPips      = milestones.map(m => `<div class="dp-ms ${killCount >= m ? 'done' : ''}" title="${m}회"></div>`).join('');

    const drops = e.deathSpawn
      ? [`미니 ${e.deathSpawn.enemyId} ×${e.deathSpawn.count}`, '경험치 젬']
      : (e.isBoss ? ['보스 크리스탈', '대량 통화'] : e.isElite ? ['엘리트 젬', '통화'] : ['경험치 젬']);

    const effects = [];
    if (e.knockbackResist >= 1)  effects.push('넉백무효');
    if (e.knockbackResist > 0)   effects.push('넉백저항');
    if (e.behaviorId === 'dash') effects.push('돌진');
    if (e.behaviorId === 'circle_dash') effects.push('궤도돌진');
    if (e.projectileConfig) effects.push('투사체');
    if (e.deathSpawn) effects.push('분열');
    if (e.isBoss && e.phases?.length) effects.push(`페이즈×${e.phases.length}`);

    container.innerHTML = `
      <div class="cx-detail">
        <div class="cx-dh">
          <div class="cx-davatar" style="background:${(e.color??'#888')}22;border-color:${borderColor};color:${e.color??'#888'}">
            ${e.isBoss ? 'B' : e.isElite ? 'E' : (e.name?.[0] ?? '?')}
          </div>
          <div>
            <div class="cx-dname">${e.name}</div>
            <div class="cx-dtier"><span class="cx-ebadge badge-${tier}">${tierMap[tier]}</span></div>
          </div>
        </div>
        <div class="cx-dstat-grid">
          <div class="cx-dstat"><div class="v">${e.hp}</div><div class="k">최대 HP</div></div>
          <div class="cx-dstat"><div class="v">${e.moveSpeed}</div><div class="k">이동 속도</div></div>
          <div class="cx-dstat"><div class="v">${e.damage}</div><div class="k">데미지</div></div>
          <div class="cx-dstat"><div class="v">${e.xpValue}</div><div class="k">XP 보상</div></div>
        </div>
        <div class="cx-drops-row">
          <span class="cx-drop-label">드롭:</span>
          ${drops.map(d => `<span class="cx-drop-pill">${d}</span>`).join('')}
        </div>
        ${effects.length ? `<div class="cx-effects-row">${effects.map(s => `<span class="cx-effect-pill">${s}</span>`).join('')}</div>` : ''}
        <div class="cx-kills-row">
          <div>
            <div class="cx-kills-key">총 처치 횟수</div>
            <div class="cx-kills-val">${killCount.toLocaleString()}</div>
          </div>
          <div>
            <div class="cx-kills-key" style="text-align:right;margin-bottom:4px">마일스톤</div>
            <div class="cx-milestone">${msPips}</div>
          </div>
        </div>
      </div>`;
  }

  // ── 무기 도감 탭 ──────────────────────────────────────────────────────────

  _renderWeaponTab() {
    const panel   = this.el.querySelector('#cx-tab-weapon');
    const weapons = this._gameData?.weaponData ?? [];

    const base = weapons.filter(w => !w.isEvolved);
    const evo  = weapons.filter(w =>  w.isEvolved);

    const evoData = this._gameData?.weaponEvolutionData ?? [];

    panel.innerHTML = `
      <div class="cx-search-row">
        <div class="cx-tier-filter">
          <button class="cx-tf active" data-wtype="all">전체</button>
          <button class="cx-tf" data-wtype="normal">기본</button>
          <button class="cx-tf" data-wtype="evolved">진화</button>
        </div>
      </div>
      <p class="cx-section-label">기본 무기 · ${base.length}종</p>
      <div class="cx-weapon-grid" id="cx-wgrid-base"></div>
      <p class="cx-section-label" style="margin-top:14px">진화 무기 · ${evo.length}종</p>
      <div class="cx-weapon-grid" id="cx-wgrid-evo"></div>
    `;

    const TYPE_LABEL = {
      targetProjectile:'투사체', areaBurst:'폭발형', orbit:'궤도형',
      boomerang:'부메랑', chainLightning:'연쇄', omnidirectional:'전방향',
    };
    const EMOJI = {
      targetProjectile:'🔵', orbit:'⚡', areaBurst:'✨',
      boomerang:'🪃', chainLightning:'⚡', omnidirectional:'🌀',
    };

    const renderCard = (w) => {
      const unlocked   = isCodexWeaponUnlocked(w, this._session);
      const recipe     = evoData.find(r => r.resultWeaponId === w.id);
      const dmgPct     = Math.min(100, w.damage * 5);
      const cdPct      = Math.round((1 - (w.cooldown - 0.5) / 3.5) * 100);
      const isSelected = this._selectedWeapon === w.id;

      return `
        <div class="cx-wcard ${w.isEvolved ? 'evolved' : ''} ${!unlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}"
             data-wid="${w.id}" role="button" tabindex="0" aria-label="${w.name} 상세 보기">
          <div class="cx-whead">
            <div class="cx-wicon">${EMOJI[w.behaviorId] ?? '⚔'}</div>
            <div>
              <div class="cx-wname">${w.name}</div>
              <div class="cx-wtype">${TYPE_LABEL[w.behaviorId] ?? w.behaviorId}</div>
            </div>
          </div>
          ${unlocked ? `
            <div class="cx-wbar-row"><span class="cx-wbar-lbl">DMG</span>
              <div class="cx-wbar-track"><div class="cx-wbar-fill" style="width:${dmgPct}%;background:#ef5350"></div></div>
            </div>
            <div class="cx-wbar-row"><span class="cx-wbar-lbl">속도</span>
              <div class="cx-wbar-track"><div class="cx-wbar-fill" style="width:${cdPct}%;background:#42a5f5"></div></div>
            </div>
            ${recipe ? `<div class="cx-wrequires">${recipe.requires?.weaponId ?? ''} Lv.MAX + 장신구</div>` : ''}
          ` : `<div class="cx-wlocked">아직 미발견</div>`}
        </div>`;
    };

    panel.querySelector('#cx-wgrid-base').innerHTML = base.map(renderCard).join('');
    panel.querySelector('#cx-wgrid-evo').innerHTML  = evo.map(renderCard).join('');

    panel.querySelectorAll('.cx-wcard').forEach(card => {
      const activate = () => {
        this._selectedWeapon = this._selectedWeapon === card.dataset.wid ? null : card.dataset.wid;
        panel.querySelectorAll('.cx-wcard').forEach(c => c.classList.toggle('selected', c.dataset.wid === this._selectedWeapon));
      };
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
    });

    panel.querySelectorAll('.cx-tf').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.wtype;
        panel.querySelectorAll('.cx-tf').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const showBase = t === 'all' || t === 'normal';
        const showEvo  = t === 'all' || t === 'evolved';
        panel.querySelector('#cx-wgrid-base').style.display = showBase ? '' : 'none';
        panel.querySelector('#cx-wgrid-evo').style.display  = showEvo  ? '' : 'none';
      });
    });
  }

  // ── 기록 탭 ──────────────────────────────────────────────────────────────

  _renderRecordsTab() {
    const panel   = this.el.querySelector('#cx-tab-records');
    const summary = buildCodexRecordSummary(this._session);
    const achievements = buildCodexAchievements(this._session, this._gameData);
    const unlocks = buildCodexUnlockEntries(this._session);

    panel.innerHTML = `
      <p class="cx-section-label">런 기록</p>
      <div class="cx-records-grid" style="margin-bottom:18px">
        <div class="cx-rec"><div class="cx-rec-icon">☠</div><div class="cx-rec-val">${summary.kills.toLocaleString()}</div><div class="cx-rec-key">총 처치 수</div></div>
        <div class="cx-rec"><div class="cx-rec-icon">⏱</div><div class="cx-rec-val">${summary.mm}:${summary.ss}</div><div class="cx-rec-key">최장 생존</div></div>
        <div class="cx-rec"><div class="cx-rec-icon">★</div><div class="cx-rec-val">Lv.${summary.best.level ?? 1}</div><div class="cx-rec-key">최고 레벨</div></div>
        <div class="cx-rec"><div class="cx-rec-icon">💰</div><div class="cx-rec-val">${summary.currency.toLocaleString()}</div><div class="cx-rec-key">누적 재화</div></div>
        <div class="cx-rec"><div class="cx-rec-icon">🏃</div><div class="cx-rec-val">${summary.totalRuns}</div><div class="cx-rec-key">총 런 수</div></div>
        <div class="cx-rec"><div class="cx-rec-icon">⚔</div><div class="cx-rec-val">${summary.bossKills}</div><div class="cx-rec-key">보스 처치</div></div>
      </div>
      <p class="cx-section-label">업적</p>
      <div class="cx-ach-list">
        ${achievements.map(a => `
          <div class="cx-ach ${a.done ? 'done' : ''}">
            <div class="cx-ach-icon">${a.icon}</div>
            <div class="cx-ach-body">
              <div class="cx-ach-name">${a.name}</div>
              <div class="cx-ach-desc">${a.desc}</div>
            </div>
            ${a.done
              ? `<div class="cx-ach-check">✓ 완료</div>`
              : `<div class="cx-ach-prog">
                   <div class="cx-prog-bar"><div class="cx-prog-fill" style="width:${Math.min(100, a.pct)}%"></div></div>
                   <div class="cx-prog-text">${Math.round(a.pct)}%</div>
                 </div>`}
          </div>`).join('')}
      </div>
      <p class="cx-section-label" style="margin-top:18px">해금 보상</p>
      <div class="cx-ach-list">
        ${unlocks.map((unlock) => `
          <div class="cx-ach ${unlock.done ? 'done' : ''}">
            <div class="cx-ach-icon">${unlock.icon}</div>
            <div class="cx-ach-body">
              <div class="cx-ach-name">${unlock.title}</div>
              <div class="cx-ach-desc">${unlock.description}</div>
              <div class="cx-ach-reward">${unlock.rewardText}</div>
            </div>
            ${unlock.done
              ? `<div class="cx-ach-check">해금 완료</div>`
              : `<div class="cx-ach-prog">
                   <div class="cx-prog-bar"><div class="cx-prog-fill" style="width:${Math.min(100, unlock.pct)}%"></div></div>
                   <div class="cx-prog-text">${unlock.progressText}</div>
                 </div>`}
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── 내부 헬퍼 ────────────────────────────────────────────────────────────

  _getEnemyTier(e) {
    if (e.isBoss)  return 'boss';
    if (e.isElite) return 'elite';
    return 'normal';
  }

  // ── 스타일 ────────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('codex-view-styles')) return;
    const s = document.createElement('style');
    s.id = 'codex-view-styles';
    s.textContent = `
      ${SUBSCREEN_SHARED_CSS}

      /* ── 루트 ── */
      .cx-root {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        overflow: hidden;
      }

      /* ── 패널 ── */
      .cx-panel {
        width: min(840px, 100%);
        max-height: 100%;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-sizing: border-box;
      }

      /* ── 헤더 ── */
      .cx-header {
        display: flex; align-items: center; justify-content: space-between;
        padding-bottom: 16px;
      }
      .cx-header-left { display: flex; align-items: center; gap: 10px; }
      .cx-prog-pill {
        letter-spacing: 0.5px;
      }

      /* ── 탭 ── */
      .cx-tabs {
        display: flex; padding: 0 24px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }
      .cx-tab {
        padding: 12px 20px; font-size: 11px; font-weight: 600; letter-spacing: 2px;
        text-transform: uppercase; color: rgba(244,237,224,0.4); cursor: pointer;
        border: none; background: none; border-bottom: 2px solid transparent;
        transition: color 0.15s, border-color 0.15s; margin-bottom: -1px;
      }
      .cx-tab.active { color: #d4af6a; border-bottom-color: #d4af6a; }
      .cx-tab:hover:not(.active) { color: rgba(244,237,224,0.7); }
      .cx-tab-cnt {
        display: inline-block; font-size: 9px; letter-spacing: 0;
        background: rgba(255,255,255,0.08); border-radius: 10px;
        padding: 1px 6px; margin-left: 5px; font-weight: 400;
      }
      .cx-tab.active .cx-tab-cnt {
        background: rgba(212,175,106,0.16); color: rgba(212,175,106,0.6);
      }

      /* ── 탭 콘텐츠 ── */
      .cx-content { 
        padding: 22px 26px; 
        flex: 1; 
        min-height: 0;
        overflow-y: auto; 
      }
      
      .cx-tab-content { display: none; }
      .cx-tab-content.active { display: block; }

      /* ── 검색/필터 ── */
      .cx-search-row {
        display: flex; gap: 10px; margin-bottom: 16px;
        align-items: center; flex-wrap: wrap;
      }
      .cx-search {
        flex: 1; min-width: 140px; height: 34px; padding: 0 12px;
        border: 0.5px solid rgba(255,255,255,0.14); border-radius: 8px;
        font-size: 13px; background: rgba(255,255,255,0.05);
        color: rgba(244,237,224,0.9); outline: none;
        transition: border-color 0.15s;
      }
      .cx-search::placeholder { color: rgba(244,237,224,0.25); }
      .cx-search:focus { border-color: rgba(212,175,106,0.4); }
      .cx-tier-filter { display: flex; gap: 6px; flex-wrap: wrap; }
      .cx-tf {
        padding: 5px 12px; font-size: 11px; border-radius: 20px;
        border: 0.5px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.04);
        color: rgba(244,237,224,0.4); cursor: pointer; transition: all 0.15s;
      }
      .cx-tf.active {
        border-color: rgba(212,175,106,0.5); background: rgba(212,175,106,0.1); color: #d4af6a;
      }
      .cx-tf:hover:not(.active) {
        border-color: rgba(255,255,255,0.22); color: rgba(244,237,224,0.7);
      }

      /* ── 섹션 라벨 ── */
      .cx-section-label {
        font-size: 9px; font-weight: 600; letter-spacing: 2.5px;
        text-transform: uppercase; color: rgba(244,237,224,0.25); margin: 0 0 10px;
      }

      /* ── 적 그리드 ── */
      .cx-enemy-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 8px; margin-bottom: 18px;
      }
      .cx-ecard {
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
        background: rgba(255,255,255,0.04); padding: 12px 10px;
        cursor: pointer; transition: border-color 0.15s, background 0.15s;
        position: relative; overflow: hidden; outline: none;
      }
      .cx-ecard:hover, .cx-ecard:focus-visible {
        border-color: rgba(212,175,106,0.3); background: rgba(255,255,255,0.07);
      }
      .cx-ecard:focus-visible { box-shadow: 0 0 0 2px rgba(212,175,106,0.4); }
      .cx-ecard.elite  { border-color: rgba(255,215,64,0.2); }
      .cx-ecard.boss   { border-color: rgba(255,64,129,0.22); }
      .cx-ecard.selected {
        border-color: rgba(212,175,106,0.6) !important;
        background: rgba(212,175,106,0.06) !important;
      }
      .cx-eavatar {
        width: 44px; height: 44px; border-radius: 50%; margin: 0 auto 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 17px; font-weight: 600; border: 2px solid;
      }
      .cx-ename {
        font-size: 12px; font-weight: 600; text-align: center;
        color: rgba(244,237,224,0.88); margin-bottom: 4px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cx-etype-row { display: flex; justify-content: center; margin-bottom: 8px; }
      .cx-ebadge {
        font-size: 9px; padding: 2px 7px; border-radius: 10px; font-weight: 600; letter-spacing: 0.5px;
      }
      .badge-normal { background: rgba(100,181,246,0.12); color: #64b5f6; border: 0.5px solid rgba(100,181,246,0.25); }
      .badge-elite  { background: rgba(255,215,64,0.12);  color: #ffd740; border: 0.5px solid rgba(255,215,64,0.3); }
      .badge-boss   { background: rgba(255,64,129,0.12);  color: #ff4081; border: 0.5px solid rgba(255,64,129,0.3); }
      .cx-estats { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
      .cx-estat {
        display: flex; flex-direction: column; align-items: center;
        background: rgba(255,255,255,0.03); border-radius: 5px; padding: 3px 4px;
      }
      .cx-estat .v { font-size: 12px; font-weight: 600; color: rgba(244,237,224,0.88); }
      .cx-estat .k { font-size: 9px; color: rgba(244,237,224,0.28); }
      .cx-ekills { margin-top: 7px; text-align: center; font-size: 10px; color: rgba(244,237,224,0.28); }
      .cx-ekills span { color: #d4af6a; font-weight: 600; }

      /* ── 잠금 오버레이 ── */
      .cx-lock-overlay {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        background: rgba(0,0,0,0.62); border-radius: 11px; gap: 5px;
      }
      .cx-lock-icon { display: flex; flex-direction: column; align-items: center; gap: 1px; }
      .cx-lock-icon .arc {
        width: 14px; height: 8px; border: 2px solid rgba(255,255,255,0.3);
        border-bottom: none; border-radius: 7px 7px 0 0;
      }
      .cx-lock-icon .body { width: 16px; height: 11px; background: rgba(255,255,255,0.2); border-radius: 3px; }
      .cx-lock-text { font-size: 9px; color: rgba(255,255,255,0.3); letter-spacing: 1px; }

      /* ── 적 상세 패널 ── */
      .cx-detail {
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 16px; background: rgba(255,255,255,0.04); margin-top: 4px;
      }
      .cx-dh { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
      .cx-davatar {
        width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: 700; border: 2px solid;
      }
      .cx-dname { font-size: 16px; font-weight: 600; color: rgba(244,237,224,0.9); margin-bottom: 5px; }
      .cx-dstat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
      .cx-dstat {
        background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1);
        border-radius: 8px; padding: 8px 6px; text-align: center;
      }
      .cx-dstat .v { font-size: 16px; font-weight: 600; color: rgba(244,237,224,0.9); }
      .cx-dstat .k { font-size: 10px; color: rgba(244,237,224,0.28); margin-top: 2px; }
      .cx-drops-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
      .cx-drop-label { font-size: 11px; color: rgba(244,237,224,0.28); }
      .cx-drop-pill {
        font-size: 11px; padding: 3px 10px; border-radius: 20px;
        background: rgba(102,187,106,0.1); border: 0.5px solid rgba(102,187,106,0.25); color: #6dba72;
      }
      .cx-effects-row { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .cx-effect-pill {
        font-size: 10px; padding: 3px 10px; border-radius: 20px;
        background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.12);
        color: rgba(244,237,224,0.5);
      }
      .cx-kills-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-top: 12px; padding-top: 10px; border-top: 0.5px solid rgba(255,255,255,0.08);
      }
      .cx-kills-val { font-size: 22px; font-weight: 600; color: #d4af6a; }
      .cx-kills-key { font-size: 11px; color: rgba(244,237,224,0.28); }
      .cx-milestone { display: flex; gap: 6px; }
      .dp-ms {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(212,175,106,0.2); border: 1px solid rgba(212,175,106,0.35);
      }
      .dp-ms.done { background: #d4af6a; border-color: #d4af6a; }

      /* ── 무기 그리드 ── */
      .cx-weapon-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
        gap: 8px; margin-bottom: 8px;
      }
      .cx-wcard {
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 12px; background: rgba(255,255,255,0.04);
        cursor: pointer; transition: all 0.15s; outline: none;
      }
      .cx-wcard:hover, .cx-wcard:focus-visible {
        border-color: rgba(212,175,106,0.3); background: rgba(255,255,255,0.07);
      }
      .cx-wcard:focus-visible { box-shadow: 0 0 0 2px rgba(212,175,106,0.4); }
      .cx-wcard.evolved { border-color: rgba(212,175,106,0.22); }
      .cx-wcard.selected { border-color: rgba(212,175,106,0.6) !important; background: rgba(212,175,106,0.06) !important; }
      .cx-wcard.locked { opacity: 0.45; }
      .cx-whead { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .cx-wicon {
        width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
        background: rgba(212,175,106,0.08); border: 0.5px solid rgba(212,175,106,0.2);
        display: flex; align-items: center; justify-content: center; font-size: 18px;
      }
      .cx-wname { font-size: 13px; font-weight: 600; color: rgba(244,237,224,0.88); }
      .cx-wtype { font-size: 9px; color: rgba(244,237,224,0.28); margin-top: 2px; }
      .cx-wbar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
      .cx-wbar-lbl { font-size: 10px; color: rgba(244,237,224,0.28); width: 28px; }
      .cx-wbar-track { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; }
      .cx-wbar-fill { height: 100%; border-radius: 2px; }
      .cx-wrequires { font-size: 10px; color: rgba(212,175,106,0.55); margin-top: 6px; line-height: 1.5; }
      .cx-wlocked { text-align: center; padding: 12px 0; font-size: 11px; color: rgba(244,237,224,0.28); }

      /* ── 기록 ── */
      .cx-records-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .cx-rec {
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 14px; background: rgba(255,255,255,0.04); text-align: center;
      }
      .cx-rec-icon { font-size: 22px; margin-bottom: 8px; }
      .cx-rec-val { font-size: 20px; font-weight: 600; color: rgba(244,237,224,0.88); }
      .cx-rec-key { font-size: 11px; color: rgba(244,237,224,0.28); margin-top: 3px; }

      /* ── 업적 ── */
      .cx-ach-list { display: flex; flex-direction: column; gap: 8px; }
      .cx-ach {
        display: flex; align-items: center; gap: 12px;
        border: 0.5px solid rgba(255,255,255,0.1); border-radius: 10px;
        padding: 10px 14px; background: rgba(255,255,255,0.04);
      }
      .cx-ach.done { border-color: rgba(212,175,106,0.28); }
      .cx-ach-icon {
        width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; font-size: 16px;
        background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.1);
      }
      .cx-ach.done .cx-ach-icon {
        background: rgba(212,175,106,0.12); border-color: rgba(212,175,106,0.25);
      }
      .cx-ach-body { flex: 1; min-width: 0; }
      .cx-ach-name { font-size: 13px; font-weight: 600; color: rgba(244,237,224,0.88); margin-bottom: 2px; }
      .cx-ach-desc { font-size: 11px; color: rgba(244,237,224,0.45); }
      .cx-ach-check { font-size: 12px; font-weight: 600; color: #d4af6a; margin-left: auto; flex-shrink: 0; }
      .cx-ach-prog { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
      .cx-prog-bar { width: 80px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; }
      .cx-prog-fill { height: 100%; border-radius: 2px; background: #d4af6a; }
      .cx-prog-text { font-size: 10px; color: rgba(244,237,224,0.28); }

      /* ── 하단 버튼 ── */
      .cx-footer {
        padding: 18px 26px 24px; border-top: 1px solid rgba(255,255,255,0.06);
        text-align: center;
      }

      /* ── 반응형 ── */
      @media (max-width: 540px) {
        .cx-content { padding: 14px; }
        .cx-dstat-grid { grid-template-columns: 1fr 1fr; }
        .cx-records-grid { grid-template-columns: 1fr 1fr; }
      }
    `;
    document.head.appendChild(s);
  }
}
