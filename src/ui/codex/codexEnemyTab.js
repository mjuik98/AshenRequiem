export {
  buildCodexEnemyDetailModel,
  buildCodexEnemyGridModel,
  ENEMY_TIER_LABELS,
  getCodexEnemyTier,
} from '../../domain/meta/codex/codexEnemyPresentation.js';

export function renderCodexEnemyTabShell() {
  return `
    <div class="cx-detail-layout">
      <div class="cx-detail-column">
        <div id="cx-enemy-detail"></div>
      </div>
      <div class="cx-list-column">
        <div class="cx-search-row">
          <input class="cx-search" id="cx-enemy-search" placeholder="적 이름 검색..." aria-label="적 검색">
          <div class="cx-tier-filter">
            <button class="cx-tf active" data-tier="all">전체</button>
            <button class="cx-tf" data-tier="normal">일반</button>
            <button class="cx-tf" data-tier="elite">엘리트</button>
            <button class="cx-tf" data-tier="boss">보스</button>
          </div>
          <div class="cx-tier-filter">
            <button class="cx-sf active" data-status-filter="all" type="button">전체 상태</button>
            <button class="cx-sf" data-status-filter="discovered" type="button">발견</button>
            <button class="cx-sf" data-status-filter="undiscovered" type="button">미발견</button>
          </div>
        </div>
        <div class="cx-summary-bar">
          <div>
            <div class="cx-summary-kicker">현재 범위</div>
            <div class="cx-summary-title" id="cx-enemy-label"></div>
          </div>
          <div class="cx-summary-metrics" id="cx-enemy-summary"></div>
        </div>
        <p class="cx-section-label">발견한 적</p>
        <div class="cx-enemy-grid" id="cx-enemy-grid"></div>
        <p class="cx-section-label" id="cx-enemy-locked-label">미발견 적</p>
        <div class="cx-enemy-grid" id="cx-enemy-grid-locked"></div>
      </div>
    </div>
  `;
}

export function renderCodexEnemyGrid(model) {
  return model.entries.map((enemy) => `
    <div class="cx-ecard ${enemy.tier} ${enemy.isSelected ? 'selected' : ''} ${!enemy.discovered ? 'locked' : ''}"
         data-id="${enemy.id}" role="button" tabindex="0"
         aria-label="${enemy.discovered ? enemy.name : '미발견 적'} 상세 보기">
      <div class="cx-eavatar" style="background:${enemy.color}22;border-color:${enemy.borderColor};color:${enemy.color}">
        ${enemy.avatarText}
      </div>
      <div class="cx-ename">${enemy.discovered ? enemy.name : '???'}</div>
      <div class="cx-etype-row">
        <span class="cx-ebadge badge-${enemy.tier}">${enemy.tierLabel}</span>
      </div>
      ${enemy.discovered ? `
        <div class="cx-estats">
          <div class="cx-estat"><span class="v">${enemy.stats.hp}</span><span class="k">체력</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.damage}</span><span class="k">공격</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.moveSpeed}</span><span class="k">이속</span></div>
          <div class="cx-estat"><span class="v">${enemy.stats.xpValue}</span><span class="k">경험치</span></div>
        </div>
        <div class="cx-ekills">처치 <span>${enemy.killCount.toLocaleString()}</span>회</div>
      ` : `
        <div class="cx-lock-overlay" aria-label="미발견">
          <div class="cx-lock-icon"><div class="arc"></div><div class="body"></div></div>
          <span class="cx-lock-text">미발견</span>
        </div>
      `}
    </div>
  `).join('');
}

export function renderCodexEnemyDetail(model) {
  if (!model) {
    return `
      <div class="cx-detail cx-detail-empty" id="cx-enemy-detail-card">
        <div class="cx-detail-kicker">선택한 적</div>
        <div class="cx-empty-title">탐색할 적을 선택하세요</div>
        <div class="cx-empty-copy">발견한 적을 선택하면 특성과 드롭, 처치 기록을 크게 읽을 수 있습니다.</div>
      </div>
    `;
  }

  if (model.unlocked === false) {
    return `
      <div class="cx-detail" id="cx-enemy-detail-card" role="region" tabindex="-1" aria-label="선택한 적 상세 정보">
        <div class="cx-detail-kicker">선택한 적</div>
        <div class="cx-dh">
          <div class="cx-davatar" style="background:${model.color}22;border-color:${model.borderColor};color:${model.color}">
            ${model.avatarText}
          </div>
          <div>
            <div class="cx-dname">${model.displayName}</div>
            <div class="cx-dtier"><span class="cx-ebadge badge-${model.tier}">${model.tierLabel}</span></div>
          </div>
        </div>
        <div class="cx-discovery-hint">${model.discoveryHint}</div>
      </div>
    `;
  }

  return `
    <div class="cx-detail" id="cx-enemy-detail-card" role="region" tabindex="-1" aria-label="선택한 적 상세 정보">
      <div class="cx-detail-kicker">선택한 적</div>
      <div class="cx-dh">
        <div class="cx-davatar" style="background:${model.color}22;border-color:${model.borderColor};color:${model.color}">
          ${model.avatarText}
        </div>
        <div>
          <div class="cx-dname">${model.name}</div>
          <div class="cx-dtier"><span class="cx-ebadge badge-${model.tier}">${model.tierLabel}</span></div>
        </div>
      </div>
      <div class="cx-dstat-grid">
        <div class="cx-dstat"><div class="v">${model.stats.hp}</div><div class="k">최대 HP</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.moveSpeed}</div><div class="k">이동 속도</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.damage}</div><div class="k">데미지</div></div>
        <div class="cx-dstat"><div class="v">${model.stats.xpValue}</div><div class="k">경험치 보상</div></div>
      </div>
      <div class="cx-drops-row">
        <span class="cx-drop-label">드롭:</span>
        ${model.drops.map((drop) => `<span class="cx-drop-pill">${drop}</span>`).join('')}
      </div>
      <div class="cx-discovery-hint">${model.discoveryHint}</div>
      ${model.effects.length > 0 ? `<div class="cx-effects-row">${model.effects.map((effect) => `<span class="cx-effect-pill">${effect}</span>`).join('')}</div>` : ''}
      <div class="cx-kills-row">
        <div>
          <div class="cx-kills-key">총 처치 횟수</div>
          <div class="cx-kills-val">${model.killCount.toLocaleString()}</div>
        </div>
        <div>
          <div class="cx-kills-key" style="text-align:right;margin-bottom:4px">마일스톤</div>
          <div class="cx-milestone">
            ${model.milestoneStates.map((state) => `<div class="dp-ms ${state.done ? 'done' : ''}" title="${state.value}회"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
