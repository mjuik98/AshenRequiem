export class StartLoadoutView {
  constructor(container) {
    this._container = container;
    this._el = document.createElement('div');
    this._el.className = 'sl-root';
    this._el.style.display = 'none';
    this._selectedWeaponId = 'magic_bolt';
    this._weapons = [];
    this._onStart = null;
    this._onCancel = null;
    this._injectStyles();
    container.appendChild(this._el);
  }

  show({ weapons = [], selectedWeaponId = 'magic_bolt', onStart, onCancel }) {
    this._weapons = weapons;
    this._selectedWeaponId = selectedWeaponId;
    this._onStart = onStart;
    this._onCancel = onCancel;
    this._render();
    this._el.style.display = 'flex';
  }

  hide() {
    this._el.style.display = 'none';
    this._el.innerHTML = '';
  }

  destroy() {
    this._el.remove();
  }

  _render() {
    const cards = this._weapons.map((weapon) => `
      <button
        class="sl-card ${weapon.id === this._selectedWeaponId ? 'selected' : ''}"
        data-weapon-id="${weapon.id}"
        type="button"
      >
        <div class="sl-card-top">
          <span class="sl-icon">${_getWeaponEmoji(weapon.behaviorId)}</span>
          <span class="sl-name">${weapon.name}</span>
        </div>
        <div class="sl-tag-row">
          <span class="sl-tag">${_getWeaponTag(weapon.behaviorId)}</span>
        </div>
        <p class="sl-desc">${weapon.description ?? ''}</p>
      </button>
    `).join('');

    this._el.innerHTML = `
      <div class="sl-backdrop" data-action="cancel"></div>
      <section class="sl-panel" role="dialog" aria-modal="true" aria-labelledby="sl-title">
        <p class="sl-eyebrow">Loadout</p>
        <h2 class="sl-title" id="sl-title">시작 무기 선택</h2>
        <p class="sl-copy">해금한 기본 무기 중 하나를 고르고 전투를 시작합니다.</p>
        <div class="sl-grid">${cards}</div>
        <div class="sl-actions">
          <button class="sl-btn ghost" data-action="cancel" type="button">취소</button>
          <button class="sl-btn primary" data-action="start" type="button">시작하기</button>
        </div>
      </section>
    `;

    this._el.querySelectorAll('[data-weapon-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this._selectedWeaponId = button.dataset.weaponId;
        this._render();
      });
    });

    this._el.querySelectorAll('[data-action="cancel"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.hide();
        this._onCancel?.();
      });
    });

    this._el.querySelector('[data-action="start"]')?.addEventListener('click', () => {
      const selectedWeaponId = this._selectedWeaponId;
      this.hide();
      this._onStart?.(selectedWeaponId);
    });
  }

  _injectStyles() {
    if (document.getElementById('start-loadout-view-styles')) return;
    const style = document.createElement('style');
    style.id = 'start-loadout-view-styles';
    style.textContent = `
      .sl-root {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 12;
      }
      .sl-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(5, 3, 8, 0.74);
        backdrop-filter: blur(8px);
      }
      .sl-panel {
        position: relative;
        width: min(760px, calc(100% - 32px));
        padding: 28px;
        border-radius: 24px;
        border: 1px solid rgba(212, 175, 106, 0.28);
        background: linear-gradient(180deg, rgba(18, 12, 28, 0.98) 0%, rgba(9, 7, 15, 0.98) 100%);
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
        color: #f4ede0;
      }
      .sl-eyebrow {
        margin: 0 0 6px;
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(212, 175, 106, 0.7);
      }
      .sl-title {
        margin: 0;
        font-size: 28px;
      }
      .sl-copy {
        margin: 8px 0 18px;
        color: rgba(244, 237, 224, 0.66);
      }
      .sl-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .sl-card {
        padding: 16px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.16s, background 0.16s, transform 0.16s;
      }
      .sl-card:hover,
      .sl-card.selected {
        border-color: rgba(212, 175, 106, 0.56);
        background: rgba(212, 175, 106, 0.1);
        transform: translateY(-1px);
      }
      .sl-card-top {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .sl-icon {
        font-size: 22px;
      }
      .sl-name {
        font-size: 16px;
        font-weight: 700;
      }
      .sl-tag-row {
        margin-bottom: 10px;
      }
      .sl-tag {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(244, 237, 224, 0.72);
        font-size: 11px;
      }
      .sl-desc {
        margin: 0;
        color: rgba(244, 237, 224, 0.68);
        font-size: 13px;
        line-height: 1.45;
      }
      .sl-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      .sl-btn {
        min-width: 120px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: transparent;
        color: #f4ede0;
        cursor: pointer;
      }
      .sl-btn.primary {
        border-color: rgba(212, 175, 106, 0.7);
        background: linear-gradient(180deg, #d8bb78 0%, #9a7130 100%);
        color: #140d03;
        font-weight: 700;
      }
      .sl-btn.ghost:hover,
      .sl-btn.ghost:focus-visible {
        border-color: rgba(255, 255, 255, 0.32);
        background: rgba(255, 255, 255, 0.06);
      }
      @media (max-width: 640px) {
        .sl-panel {
          padding: 22px;
        }
        .sl-grid {
          grid-template-columns: 1fr;
        }
        .sl-actions {
          flex-direction: column-reverse;
        }
        .sl-btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function _getWeaponEmoji(behaviorId) {
  const map = {
    targetProjectile: '🔵',
    areaBurst: '✨',
    orbit: '⚡',
    boomerang: '🪃',
    chainLightning: '⚡',
    omnidirectional: '🌀',
  };
  return map[behaviorId] ?? '⚔';
}

function _getWeaponTag(behaviorId) {
  const map = {
    targetProjectile: '투사체',
    areaBurst: '광역',
    orbit: '궤도',
    boomerang: '관통',
    chainLightning: '연쇄',
    omnidirectional: '전방향',
  };
  return map[behaviorId] ?? '기본';
}
