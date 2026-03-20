/**
 * PauseView — ESC 일시정지 오버레이 (뱀파이어 서바이벌 스타일)
 *
 * CHANGE: 무기·장신구·시너지 JS 툴팁 추가
 *
 * FIX(TOOLTIP-LEAK): destroy() 시 this._tt 정리 누락 수정
 *   Before: destroy() { this.el.remove(); }
 *   After:  destroy() { this.el.remove(); this._tt?.remove(); this._tt = null; }
 *
 * FIX(R-18): synergyData / weaponEvolutionData 직접 import 제거
 *   Before: import { synergyData } from '../../data/synergyData.js';
 *   After:  show()의 data 파라미터로 DI 수신
 *
 * FIX(TOOLTIP-ACCNAME): 진화 조건 툴팁에서 accessoryId 원시값 대신 장신구 이름 표시
 *   data.accessoryData / data.weaponData에서 이름 조회
 *
 * FIX(TOOLTIP-SYNERGY): weaponId / up_{weaponId} / get_{weaponId} 패턴으로
 *   requires 배열을 정확히 매칭해 관련 시너지 수집
 *
 * A11Y: 무기·장신구 카드에 tabindex="0" + role="button" 추가,
 *       focusin/focusout으로 키보드에서도 툴팁 표시
 */
export class PauseView {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'pv-overlay';
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');
    this._onResume        = null;
    this._onMainMenu      = null;
    this._tt              = null;
    this._ttHideTimer     = null;
    this._data            = null;
    this._indexes         = null;
    this._isClosingToMenu = false;
    this._injectStyles();
    container.appendChild(this.el);
  }

  /**
   * @param {object}        player
   * @param {object}        data          GameDataLoader 반환값 (R-18: DI로 수신)
   * @param {Function}      onResume
   * @param {Function|null} onMainMenu
   */
  show(player, data, onResume, onMainMenu = null) {
    clearTimeout(this._ttHideTimer);
    this._isClosingToMenu = false;
    this._onResume   = onResume;
    this._onMainMenu = onMainMenu;
    this._data       = data;
    this._indexes    = this._buildIndexes(data);
    this._render(player);
    this._bindTooltips(player);
    this.el.setAttribute('aria-hidden', 'false');
    this.el.style.display = 'flex';
  }

  hide() {
    clearTimeout(this._ttHideTimer);
    this._hideTooltip();
    this.el.setAttribute('aria-hidden', 'true');
    this.el.style.display = 'none';
    this._onResume        = null;
    this._onMainMenu      = null;
    this._isClosingToMenu = false;
  }

  isVisible() {
    return this.el.style.display !== 'none';
  }

  /**
   * FIX(TOOLTIP-LEAK): this._tt를 document.body에서 반드시 제거
   */
  destroy() {
    clearTimeout(this._ttHideTimer);
    this._tt?.remove();
    this._tt = null;
    this._data = null;
    this._indexes = null;
    this._isClosingToMenu = false;
    this.el.remove();
  }

  _buildIndexes(data) {
    const weaponById = new Map((data?.weaponData ?? []).map(item => [item?.id, item]));
    const accessoryById = new Map((data?.accessoryData ?? []).map(item => [item?.id, item]));
    const synergiesByWeaponId = new Map();

    for (const synergy of data?.synergyData ?? []) {
      for (const req of synergy?.requires ?? []) {
        const normalizedWeaponId =
          typeof req === 'string'
            ? (req.startsWith('up_') ? req.slice(3)
              : req.startsWith('get_') ? req.slice(4)
              : req)
            : null;

        if (!normalizedWeaponId) continue;
        const list = synergiesByWeaponId.get(normalizedWeaponId) ?? [];
        list.push(synergy);
        synergiesByWeaponId.set(normalizedWeaponId, list);
      }
    }

    return { weaponById, accessoryById, synergiesByWeaponId };
  }

  // ── 툴팁 바인딩 ──────────────────────────────────────────────────────

  _bindTooltips(player) {
    if (!this._tt) {
      this._tt = document.createElement('div');
      this._tt.className = 'pv-tooltip';
      this._tt.style.display = 'none';
      document.body.appendChild(this._tt);
    }

    const showTip = (el, buildFn, e) => {
      clearTimeout(this._ttHideTimer);
      const html = buildFn(el, player);
      if (!html.trim()) return;
      this._tt.innerHTML = html;
      this._tt.style.display = 'block';
      this._positionTooltip(e);
    };
    const hideTip = () => {
      this._ttHideTimer = setTimeout(() => this._hideTooltip(), 80);
    };

    const bind = (selector, buildFn) => {
      this.el.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter',  e => showTip(el, buildFn, e));
        el.addEventListener('mousemove',   e => this._positionTooltip(e));
        el.addEventListener('mouseleave',  hideTip);
        // A11Y: 키보드 포커스
        el.addEventListener('focusin',     e => showTip(el, buildFn, e));
        el.addEventListener('focusout',    hideTip);
      });
    };

    bind('[data-tip-weapon]', (el) => this._buildWeaponTip(el.dataset.tipWeapon, player));
    bind('[data-tip-acc]',    (el) => this._buildAccTip(el.dataset.tipAcc, player));
  }

  _hideTooltip() {
    if (!this._tt) return;
    this._tt.style.display = 'none';
    this._tt.innerHTML = '';
  }

  _positionTooltip(e) {
    if (!this._tt) return;
    const pad = 14;
    const w   = this._tt.offsetWidth  || 220;
    const h   = this._tt.offsetHeight || 100;

    const rect = e.target?.getBoundingClientRect?.() ?? { left: 0, right: 0, top: 0, height: 0 };
    const cx   = e.clientX ?? rect.right;
    const cy   = e.clientY ?? (rect.top + rect.height / 2);

    let x = cx + pad;
    let y = cy - h / 2;

    if (x + w > window.innerWidth - 8) x = cx - w - pad;
    if (x < 8) x = 8;
    if (y + h > window.innerHeight - 8) y = window.innerHeight - h - 8;
    if (y < 8) y = 8;

    this._tt.style.left = `${x}px`;
    this._tt.style.top  = `${y}px`;
  }

  // ── 툴팁 HTML 빌더 ────────────────────────────────────────────────────

  /**
   * FIX(TOOLTIP-SYNERGY): requires 배열에서 weaponId 직접 참조 + up_/get_ 접두 패턴 모두 매칭
   * FIX(TOOLTIP-ACCNAME): data.accessoryData에서 장신구 이름 조회
   */
  _buildWeaponTip(weaponId, player) {
    const weapon = player.weapons?.find(w => w.id === weaponId);
    if (!weapon) return '';

    const weaponEvolutionData = this._data?.weaponEvolutionData ?? [];
    const accessoryById       = this._indexes?.accessoryById ?? new Map();
    const relatedSynergies    = this._indexes?.synergiesByWeaponId?.get(weaponId) ?? [];
    const activeSynergyIds    = new Set(player.activeSynergies ?? []);
    const totalProj           = (weapon.projectileCount ?? 1) + (player.bonusProjectileCount ?? 0);

    const statRows = [
      ['데미지', weapon.damage],
      ['쿨다운', _formatSeconds(weapon.cooldown, 2)],
      ['관통', weapon.pierce != null ? weapon.pierce : null],
      ['투사체', totalProj > 1 ? totalProj : null],
      ['사거리', weapon.range != null ? `${Math.round(weapon.range)}px` : null],
      ['오라 반경', weapon.orbitRadius != null ? `${Math.round(weapon.orbitRadius)}px` : null],
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');

    const statsHtml = statRows.map(([key, value]) =>
      `<div class="pvt-row"><span class="pvt-key">${_escapeHtml(key)}</span><span class="pvt-val">${_escapeHtml(String(value))}</span></div>`
    ).join('');

    let statusHtml = '';
    if (weapon.statusEffectId && weapon.statusEffectChance) {
      const labelMap = { slow: '슬로우', poison: '독', stun: '스턴' };
      const label = labelMap[weapon.statusEffectId] ?? weapon.statusEffectId;
      const pct = Math.round(weapon.statusEffectChance * 100);
      statusHtml =
        `<div class="pvt-row"><span class="pvt-key">상태이상</span><span class="pvt-val pvt-status">${_escapeHtml(label)} ${pct}%</span></div>`;
    }

    const synHtml = relatedSynergies.length > 0
      ? `<div class="pvt-divider"></div>` + relatedSynergies.map(synergy => {
          const active = activeSynergyIds.has(synergy.id);
          return `<div class="pvt-synergy ${active ? 'pvt-synergy-active' : ''}">
            <span class="pvt-syn-icon">${active ? '✦' : '◇'}</span>
            <div>
              <div class="pvt-syn-name">${_escapeHtml(synergy.name ?? synergy.id ?? '시너지')}</div>
              <div class="pvt-syn-desc">${_escapeHtml(synergy.description ?? '')}</div>
            </div>
          </div>`;
        }).join('')
      : '';

    const evoRecipe = weaponEvolutionData.find(recipe => recipe.requires?.weaponId === weaponId);
    const evoHtml = evoRecipe
      ? (() => {
          const alreadyEvolved = player.evolvedWeapons?.has(evoRecipe.id);
          const accessoryIds = evoRecipe.requires?.accessoryIds ?? [];
          const accNames = accessoryIds.map(id => accessoryById.get(id)?.name ?? id).join(', ');
          return `<div class="pvt-divider"></div>
            <div class="pvt-evo ${alreadyEvolved ? 'pvt-evo-done' : ''}">
              <span class="pvt-evo-icon">${alreadyEvolved ? '✓' : '✨'}</span>
              <div>
                <div class="pvt-evo-name">${alreadyEvolved ? '진화 완료' : '진화 조건'}</div>
                <div class="pvt-evo-desc">Lv.MAX${accNames ? ` + ${_escapeHtml(accNames)}` : ''} 보유 시 진화 가능</div>
              </div>
            </div>`;
        })()
      : '';

    return `
      <div class="pvt-header">${_escapeHtml(weapon.name ?? weapon.id ?? '무기')} <span class="pvt-lv">Lv.${_escapeHtml(String(weapon.level ?? 1))}</span></div>
      ${statsHtml}${statusHtml}${synHtml}${evoHtml}
    `;
  }

  /**
   * FIX(TOOLTIP-ACCNAME): 진화 레시피의 weaponId를 data.weaponData에서 이름 조회
   */
  _buildAccTip(accessoryId, player) {
    const acc = player.accessories?.find(item => item.id === accessoryId);
    if (!acc) return '';

    const weaponEvolutionData = this._data?.weaponEvolutionData ?? [];
    const weaponById          = this._indexes?.weaponById ?? new Map();

    const statLabel = {
      moveSpeed: '이동 속도',
      maxHp: '최대 HP',
      lifesteal: '흡혈',
      magnetRadius: '자석 반경',
      invincibleDuration: '무적 시간',
      damageMult: '데미지 배율',
      cooldownMult: '쿨다운 단축',
      projectileSpeedMult: '투사체 속도',
      projectileSizeMult: '투사체 크기',
      xpMult: '경험치 배율',
      critChance: '크리티컬 확률',
      critMultiplier: '크리티컬 배율',
      bonusProjectileCount: '추가 투사체',
    };

    const effHtml = (acc.effects ?? []).map(effect => {
      const statKey = typeof effect?.stat === 'string' ? effect.stat : '';
      const label = statLabel[statKey] ?? statKey;
      const isRatio = statKey.includes('Mult') || statKey === 'lifesteal' || statKey === 'critChance';
      const rawValue = Number.isFinite(effect?.value) ? effect.value : 0;
      const formattedValue = isRatio
        ? `${rawValue > 0 ? '+' : ''}${Math.round(rawValue * 100)}%`
        : `${rawValue > 0 ? '+' : ''}${rawValue}`;

      return `<div class="pvt-row"><span class="pvt-key">${_escapeHtml(label || '효과')}</span><span class="pvt-val">${_escapeHtml(formattedValue)}</span></div>`;
    }).join('');

    const evoRecipes = weaponEvolutionData.filter(recipe =>
      recipe.requires?.accessoryIds?.includes(accessoryId)
    );

    const evoHtml = evoRecipes.length > 0
      ? `<div class="pvt-divider"></div>` + evoRecipes.map(recipe => {
          const alreadyEvolved = player.evolvedWeapons?.has(recipe.id);
          const baseWeaponId = recipe.requires?.weaponId;
          const baseWeaponName = weaponById.get(baseWeaponId)?.name ?? baseWeaponId ?? '무기';
          return `<div class="pvt-evo ${alreadyEvolved ? 'pvt-evo-done' : ''}">
            <span class="pvt-evo-icon">${alreadyEvolved ? '✓' : '✨'}</span>
            <div>
              <div class="pvt-evo-name">${alreadyEvolved ? '진화 완료' : '진화 조건'}</div>
              <div class="pvt-evo-desc">${_escapeHtml(baseWeaponName)} Lv.MAX 달성 시 진화 가능</div>
            </div>
          </div>`;
        }).join('')
      : '';

    const rarityLabel = { rare: '희귀', common: '일반' }[acc.rarity] ?? acc.rarity ?? '일반';

    return `
      <div class="pvt-header">${_escapeHtml(acc.name ?? acc.id ?? '장신구')} <span class="pvt-rarity pvt-rarity-${_escapeAttr(acc.rarity ?? 'common')}">${_escapeHtml(rarityLabel)}</span></div>
      ${effHtml}${evoHtml}
    `;
  }

  // ── 렌더 ─────────────────────────────────────────────────────────────

  _render(player) {
    const weapons     = player.weapons ?? [];
    const accessories = player.accessories ?? [];
    const maxWpnSlots = player.maxWeaponSlots ?? 2;
    const maxAccSlots = player.maxAccessorySlots ?? 0;

    const hp = Math.ceil(player.hp ?? 0);
    const maxHp = Math.max(1, Math.ceil(player.maxHp ?? 100));
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

    const hpColor = hpPct > 60 ? '#e53935' : hpPct > 30 ? '#fb8c00' : '#b71c1c';
    const hpGlow  = hpPct > 60 ? 'rgba(229,57,53,0.45)' : hpPct > 30 ? 'rgba(251,140,0,0.45)' : 'rgba(183,28,28,0.7)';

    const speedVal   = Math.round(player.moveSpeed ?? 0);
    const magnetVal  = Math.round(player.magnetRadius ?? 0);
    const lifesteal  = ((player.lifesteal ?? 0) * 100).toFixed(0);
    const level      = player.level ?? 1;
    const critChance = ((player.critChance ?? 0.05) * 100).toFixed(0);
    const critMulti  = ((player.critMultiplier ?? 2.0) * 100).toFixed(0);
    const bonusProjs = player.bonusProjectileCount ?? 0;

    const synergyData      = this._data?.synergyData ?? [];
    const activeSynergyIds = new Set(player.activeSynergies ?? []);
    const activeSynergies  = synergyData.filter(synergy => activeSynergyIds.has(synergy.id));
    const synergyHtml = activeSynergies.length > 0
      ? `<div class="pv-block">
          <div class="pv-block-title">
            <span class="pv-block-icon">⚗</span>시너지
            <span class="pv-block-count">${activeSynergies.length}개 활성</span>
          </div>
          <ul class="pv-synergy-list">
            ${activeSynergies.map(synergy => `
              <li class="pv-synergy-item">
                <span class="pv-syn-dot"></span>
                <div>
                  <div class="pv-syn-name">${_escapeHtml(synergy.name ?? synergy.id ?? '시너지')}</div>
                  <div class="pv-syn-desc">${_escapeHtml(synergy.description ?? '')}</div>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>`
      : '';

    const tipHint = `<span class="pv-tip-hint">커서를 올리거나 포커스하세요</span>`;

    this.el.innerHTML = `
      <div class="pv-backdrop"></div>
      <div class="pv-panel">

        <header class="pv-header">
          <div class="pv-rune" aria-hidden="true">⏸</div>
          <h2 class="pv-title">PAUSED</h2>
          <div class="pv-rune" aria-hidden="true">⏸</div>
        </header>

        <section class="pv-hp-section" aria-label="플레이어 체력">
          <div class="pv-hp-meta">
            <span class="pv-hp-icon">❤</span>
            <span class="pv-hp-label">HP</span>
            <span class="pv-hp-frac">${hp} <span class="pv-hp-sep">/</span> ${maxHp}</span>
            <span class="pv-hp-pct" style="color:${hpColor}">${Math.round(hpPct)}%</span>
          </div>
          <div class="pv-hp-track">
            <div class="pv-hp-fill" style="width:${hpPct}%; background:${hpColor}; box-shadow:0 0 12px ${hpGlow};"></div>
            <div class="pv-hp-shine"></div>
          </div>
        </section>

        <div class="pv-body">

          <aside class="pv-left">

            <div class="pv-block">
              <div class="pv-block-title">
                <span class="pv-block-icon">⚔</span>무기
                <span class="pv-block-count">${weapons.length}/${maxWpnSlots}</span>
                ${weapons.length > 0 ? tipHint : ''}
              </div>
              <div class="pv-item-grid">
                ${weapons.length > 0
                  ? weapons.map(weapon => {
                      const totalProj = (weapon.projectileCount ?? 1) + bonusProjs;
                      const damage = Number.isFinite(weapon.damage) ? weapon.damage : '-';
                      const cooldown = _formatSeconds(weapon.cooldown, 1);
                      return `
                        <div class="pv-item-card pv-item-weapon ${weapon.isEvolved ? 'pv-evolved' : ''}"
                             data-tip-weapon="${_escapeAttr(weapon.id ?? '')}"
                             tabindex="0"
                             role="group"
                             aria-label="${_escapeAttr(`${weapon.name ?? weapon.id ?? '무기'} 상세 정보`)}">
                          <div class="pv-item-icon">${weapon.isEvolved ? '✨' : _weaponEmoji(weapon.behaviorId)}</div>
                          <div class="pv-item-info">
                            <div class="pv-item-name">${_escapeHtml(weapon.name ?? weapon.id ?? '무기')}</div>
                            <div class="pv-item-stats">
                              DMG&nbsp;<b>${_escapeHtml(String(damage))}</b>&nbsp;&nbsp;CD&nbsp;<b>${_escapeHtml(cooldown)}</b>
                              ${totalProj > 1 ? `&nbsp;&nbsp;PROJ&nbsp;<b>${_escapeHtml(String(totalProj))}</b>` : ''}
                            </div>
                          </div>
                          <div class="pv-item-lvl">Lv.${_escapeHtml(String(weapon.level ?? 1))}</div>
                        </div>
                      `;
                    }).join('')
                  : `<div class="pv-item-empty">보유 무기 없음</div>`
                }
              </div>
            </div>

            <div class="pv-block">
              <div class="pv-block-title">
                <span class="pv-block-icon">💍</span>장신구
                <span class="pv-block-count">${accessories.length}/${maxAccSlots}</span>
                ${accessories.length > 0 ? tipHint : ''}
              </div>
              <div class="pv-acc-grid">
                ${maxAccSlots === 0
                  ? `<div class="pv-item-empty">미해금 (레벨업에서 슬롯 해금 필요)</div>`
                  : Array.from({ length: maxAccSlots }).map((_, i) => {
                      const acc = accessories[i];
                      if (acc) {
                        return `
                          <div class="pv-acc-card pv-acc-filled pv-acc-rarity-${_escapeAttr(acc.rarity ?? 'common')}"
                               data-tip-acc="${_escapeAttr(acc.id ?? '')}"
                               tabindex="0"
                               role="group"
                               aria-label="${_escapeAttr(`${acc.name ?? acc.id ?? '장신구'} 상세 정보`)}">
                            <div class="pv-acc-gem">💎</div>
                            <div class="pv-acc-info">
                              <div class="pv-acc-name">${_escapeHtml(acc.name ?? acc.id ?? '장신구')}</div>
                              <div class="pv-acc-desc">${_escapeHtml(acc.description ?? '')}</div>
                            </div>
                            <div class="pv-acc-badge">${_escapeHtml(_rarityLabel(acc.rarity))}</div>
                          </div>
                        `;
                      }
                      return `
                        <div class="pv-acc-card pv-acc-empty">
                          <div class="pv-acc-empty-icon">○</div>
                          <div class="pv-acc-empty-label">빈 슬롯 ${i + 1}</div>
                        </div>
                      `;
                    }).join('')
                }
              </div>
            </div>

            ${synergyHtml}

          </aside>

          <aside class="pv-right">
            <div class="pv-block">
              <div class="pv-block-title"><span class="pv-block-icon">📊</span>스탯</div>
              <ul class="pv-stat-list">
                ${_statRow('레벨', `Lv.${level}`, '#ffd54f')}
                ${_statRow('이동 속도', speedVal, '#4fc3f7')}
                ${_statRow('자석 반경', `${magnetVal}px`, '#aed581')}
                ${_statRow('흡혈', `${lifesteal}%`, '#ef9a9a')}
                <hr style="border:0; border-top:1px solid rgba(255,255,255,0.05); margin:4px 0;">
                ${_statRow('크리티컬 확률', `${critChance}%`, '#ffd740')}
                ${_statRow('크리티컬 배율', `${critMulti}%`, '#ffb74d')}
                ${bonusProjs > 0 ? _statRow('추가 투사체', `+${bonusProjs}`, '#ce93d8') : ''}
              </ul>
            </div>
            <div class="pv-hint">ESC 또는 버튼으로 재개</div>
          </aside>

        </div>

        <footer class="pv-footer">
          <button class="pv-btn pv-btn-resume" id="pv-resume-btn" type="button">
            <span class="pv-btn-icon">▶</span>재개
          </button>
          ${this._onMainMenu !== null
            ? `<button class="pv-btn pv-btn-menu" id="pv-menu-btn" type="button">
                 <span class="pv-btn-icon">⌂</span>메인메뉴
               </button>`
            : ''
          }
        </footer>

      </div>
    `;

    const resumeBtn = this.el.querySelector('#pv-resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (this._isClosingToMenu) return;
        this._onResume?.();
      });
    }

    const menuBtn = this.el.querySelector('#pv-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (this._isClosingToMenu || !this._onMainMenu) return;
        this._isClosingToMenu = true;
        resumeBtn?.setAttribute('disabled', 'disabled');
        menuBtn.setAttribute('disabled', 'disabled');
        this._onMainMenu();
      });
    }
  }

  _injectStyles() {
    if (document.getElementById('pauseview-styles')) return;
    const s = document.createElement('style');
    s.id = 'pauseview-styles';
    s.textContent = `
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
      .pv-panel {
        position: relative; z-index: 1;
        width: min(720px, calc(100vw - 24px));
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        background: linear-gradient(160deg, rgba(24,18,36,0.98) 0%, rgba(10,8,18,0.99) 100%);
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
      @keyframes pv-rune-pulse { from { opacity: 0.4; } to { opacity: 1; } }
      .pv-hp-section { padding: 18px 28px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
      .pv-hp-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
      .pv-hp-icon { font-size: 14px; }
      .pv-hp-label { font-size: 12px; font-weight: 700; letter-spacing: 2px; color: rgba(240,220,190,0.6); text-transform: uppercase; flex: 1; }
      .pv-hp-frac { font-size: 16px; font-weight: 700; color: #f0dcc8; }
      .pv-hp-sep  { color: rgba(240,220,200,0.3); font-size: 13px; margin: 0 2px; }
      .pv-hp-pct  { font-size: 12px; font-weight: 700; width: 38px; text-align: right; transition: color 0.3s; }
      .pv-hp-track {
        position: relative; height: 12px;
        background: rgba(0,0,0,0.55); border-radius: 6px; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.07);
      }
      .pv-hp-fill  { height: 100%; border-radius: 6px; transition: width 0.3s ease; }
      .pv-hp-shine { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 55%); border-radius: 6px; pointer-events: none; }
      .pv-body { display: grid; grid-template-columns: 1fr 220px; gap: 0; padding: 18px 28px 0; }
      .pv-left  { padding-right: 20px; border-right: 1px solid rgba(255,255,255,0.05); }
      .pv-right { padding-left: 20px; }
      .pv-block { margin-bottom: 18px; }
      .pv-block-title {
        display: flex; align-items: center; gap: 7px;
        font-size: 11px; font-weight: 700; letter-spacing: 2px;
        color: rgba(201,168,108,0.75); text-transform: uppercase;
        margin-bottom: 10px;
      }
      .pv-block-icon { font-size: 13px; }
      .pv-block-count { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.3); }
      .pv-tip-hint { font-size: 10px; color: rgba(255,255,255,0.2); font-weight: 400; letter-spacing: 0; text-transform: none; }
      .pv-item-grid { display: flex; flex-direction: column; gap: 7px; }
      .pv-item-card {
        display: flex; align-items: center; gap: 10px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,213,79,0.14);
        border-radius: 10px; padding: 9px 12px;
        position: relative; overflow: hidden;
        transition: border-color 0.2s, background 0.2s;
        cursor: default; outline: none;
      }
      .pv-item-card::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, rgba(255,213,79,0.05) 0%, transparent 60%);
        pointer-events: none;
      }
      .pv-item-card:hover,
      .pv-item-card:focus-visible { border-color: rgba(255,213,79,0.45); background: rgba(255,213,79,0.07); }
      .pv-item-card.pv-evolved { border-color: rgba(224,64,251,0.4); background: rgba(224,64,251,0.05); }
      .pv-item-card.pv-evolved:hover,
      .pv-item-card.pv-evolved:focus-visible { border-color: rgba(224,64,251,0.65); background: rgba(224,64,251,0.09); }
      .pv-item-icon { font-size: 22px; width: 34px; text-align: center; flex-shrink: 0; }
      .pv-item-info { flex: 1; min-width: 0; }
      .pv-item-name { font-size: 13px; font-weight: 700; color: #f0dcc8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
      .pv-item-stats { font-size: 11px; color: rgba(255,255,255,0.45); }
      .pv-item-stats b { color: rgba(255,255,255,0.7); }
      .pv-item-lvl { font-size: 11px; font-weight: 800; color: #ffd54f; background: rgba(255,213,79,0.12); border: 1px solid rgba(255,213,79,0.25); border-radius: 20px; padding: 2px 8px; white-space: nowrap; flex-shrink: 0; }
      .pv-evolved .pv-item-lvl { color: #e040fb; background: rgba(224,64,251,0.12); border-color: rgba(224,64,251,0.25); }
      .pv-item-empty { font-size: 12px; color: rgba(255,255,255,0.2); padding: 12px 0; text-align: center; }
      .pv-acc-grid { display: flex; flex-direction: column; gap: 7px; }
      .pv-acc-card {
        display: flex; align-items: center; gap: 10px;
        border-radius: 10px; padding: 9px 12px;
        border: 1px solid transparent;
        transition: border-color 0.2s, background 0.2s;
        cursor: default; outline: none;
      }
      .pv-acc-filled { background: rgba(255,255,255,0.04); }
      .pv-acc-rarity-common { border-color: rgba(173,216,230,0.2); }
      .pv-acc-rarity-common:hover,
      .pv-acc-rarity-common:focus-visible { border-color: rgba(173,216,230,0.45); background: rgba(173,216,230,0.05); }
      .pv-acc-rarity-rare { border-color: rgba(206,147,216,0.3); background: rgba(206,147,216,0.04); }
      .pv-acc-rarity-rare:hover,
      .pv-acc-rarity-rare:focus-visible { border-color: rgba(206,147,216,0.55); background: rgba(206,147,216,0.08); }
      .pv-acc-empty { border: 1px dashed rgba(255,255,255,0.1); opacity: 0.4; }
      .pv-acc-gem { font-size: 20px; flex-shrink: 0; }
      .pv-acc-empty-icon { font-size: 18px; color: rgba(255,255,255,0.2); flex-shrink: 0; width: 20px; text-align: center; }
      .pv-acc-info { flex: 1; min-width: 0; }
      .pv-acc-name { font-size: 13px; font-weight: 700; color: #e8d8f0; margin-bottom: 3px; }
      .pv-acc-desc { font-size: 11px; color: rgba(255,255,255,0.4); }
      .pv-acc-empty-label { font-size: 12px; color: rgba(255,255,255,0.2); }
      .pv-acc-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; background: rgba(206,147,216,0.15); color: #ce93d8; border: 1px solid rgba(206,147,216,0.3); }
      .pv-acc-rarity-common .pv-acc-badge { background: rgba(144,202,249,0.12); color: #90caf9; border-color: rgba(144,202,249,0.25); }
      .pv-synergy-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .pv-synergy-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; padding: 7px 10px; background: rgba(255,183,77,0.06); border: 1px solid rgba(255,183,77,0.18); border-radius: 8px; }
      .pv-syn-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffb74d; flex-shrink: 0; margin-top: 3px; }
      .pv-syn-name { font-size: 12px; font-weight: 700; color: #ffb74d; margin-bottom: 2px; }
      .pv-syn-desc { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.4; }
      .pv-stat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .pv-stat-row  { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
      .pv-stat-key  { color: rgba(255,255,255,0.4); }
      .pv-stat-val  { font-weight: 700; }
      .pv-hint { margin-top: 20px; font-size: 11px; color: rgba(255,255,255,0.2); text-align: center; line-height: 1.6; }
      .pv-footer { display: flex; justify-content: center; gap: 12px; padding: 20px 28px 0; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 18px; }
      .pv-btn { display: flex; align-items: center; gap: 8px; padding: 12px 32px; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: transform 0.16s, box-shadow 0.16s, filter 0.16s; }
      .pv-btn:hover { transform: translateY(-2px); }
      .pv-btn-icon { font-size: 13px; }
      .pv-btn-resume { background: linear-gradient(135deg, #1565c0, #1976d2); color: #e3f2fd; box-shadow: 0 4px 18px rgba(21,101,192,0.4); border: 1px solid rgba(66,165,245,0.3); }
      .pv-btn-resume:hover { box-shadow: 0 6px 24px rgba(21,101,192,0.6); filter: brightness(1.1); }
      .pv-btn-menu { background: linear-gradient(135deg, rgba(40,28,18,0.9), rgba(30,20,12,0.95)); color: #c9a86c; box-shadow: 0 4px 18px rgba(0,0,0,0.4); border: 1px solid rgba(201,168,108,0.3); }
      .pv-btn-menu:hover { background: linear-gradient(135deg, rgba(60,42,22,0.95), rgba(40,28,14,0.98)); box-shadow: 0 6px 24px rgba(0,0,0,0.5); border-color: rgba(201,168,108,0.55); }
      .pv-btn:disabled { opacity: 0.55; cursor: wait; transform: none; filter: none; box-shadow: none; }

      /* ── JS 툴팁 ── */
      .pv-tooltip {
        position: fixed; z-index: 9999; pointer-events: none;
        background: #12101e; border: 1px solid rgba(201,168,108,0.28);
        border-radius: 10px; padding: 10px 13px;
        font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
        font-size: 12px; color: rgba(255,255,255,0.85);
        min-width: 180px; max-width: 250px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6); line-height: 1.5;
      }
      .pvt-header { font-size: 13px; font-weight: 700; color: #f0dcc8; margin-bottom: 8px; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .pvt-lv { font-size: 10px; font-weight: 700; color: #ffd54f; background: rgba(255,213,79,0.15); border-radius: 20px; padding: 1px 7px; border: 1px solid rgba(255,213,79,0.25); }
      .pvt-rarity { font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 7px; }
      .pvt-rarity-rare   { color: #ce93d8; background: rgba(206,147,216,0.15); border: 1px solid rgba(206,147,216,0.3); }
      .pvt-rarity-common { color: #90caf9; background: rgba(144,202,249,0.12); border: 1px solid rgba(144,202,249,0.25); }
      .pvt-row   { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 3px; }
      .pvt-key   { color: rgba(255,255,255,0.45); }
      .pvt-val   { color: rgba(255,255,255,0.85); font-weight: 500; text-align: right; }
      .pvt-status { color: #90caf9; }
      .pvt-divider { border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 8px 0; }
      .pvt-synergy { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 6px; padding: 6px 8px; border-radius: 6px; background: rgba(255,183,77,0.06); border: 1px solid rgba(255,183,77,0.12); }
      .pvt-synergy-active { background: rgba(255,183,77,0.12); border-color: rgba(255,183,77,0.28); }
      .pvt-syn-icon { color: #ffb74d; flex-shrink: 0; font-size: 10px; margin-top: 2px; }
      .pvt-syn-name { font-size: 11px; font-weight: 700; color: #ffb74d; margin-bottom: 1px; }
      .pvt-syn-desc { font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.4; }
      .pvt-evo { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 4px; padding: 6px 8px; border-radius: 6px; background: rgba(224,64,251,0.06); border: 1px solid rgba(224,64,251,0.15); }
      .pvt-evo-done { background: rgba(129,199,132,0.06); border-color: rgba(129,199,132,0.2); }
      .pvt-evo-icon { color: #ce93d8; flex-shrink: 0; font-size: 11px; }
      .pvt-evo-done .pvt-evo-icon { color: #81c784; }
      .pvt-evo-name { font-size: 11px; font-weight: 700; color: #ce93d8; margin-bottom: 1px; }
      .pvt-evo-done .pvt-evo-name { color: #81c784; }
      .pvt-evo-desc { font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.4; }

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

  // ── 도움말 도구 ──────────────────────────────────────────────────
}

function _statRow(key, val, color) {
  if (!val && val !== 0) return '';
  return `<li class="pv-stat-row"><span class="pv-stat-key">${_escapeHtml(String(key))}</span><span class="pv-stat-val" style="color:${color}">${_escapeHtml(String(val))}</span></li>`;
}
function _rarityLabel(rarity) {
  return rarity === 'rare' ? '희귀' : '일반';
}
function _escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function _escapeAttr(value) {
  return _escapeHtml(value).replaceAll('`', '&#96;');
}
function _formatSeconds(value, digits = 1) {
  return Number.isFinite(value) ? `${value.toFixed(digits)}s` : '-';
}
function _weaponEmoji(behaviorId) {
  const MAP = { targetProjectile: '🔵', orbit: '⚡', areaBurst: '✨', boomerang: '🪃', chainLightning: '⚡', omnidirectional: '🌀' };
  return MAP[behaviorId] ?? '⚔';
}
