import { renderActionButton } from '../shared/actionButtonTheme.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderStat(value, label, isNewBest, prevText) {
  const cardClass = isNewBest ? 'result-stat new-best' : 'result-stat';
  const bestBadge = isNewBest ? '<span class="result-best-badge">★ 신기록</span>' : '';

  let subHtml = '';
  if (isNewBest) {
    subHtml = `<div class="result-stat-sub new-best">${escapeHtml(prevText ?? '')} → 갱신!</div>`;
  } else if (prevText) {
    subHtml = `<div class="result-stat-sub">${escapeHtml(prevText)}</div>`;
  }

  return `
    <div class="${cardClass}">
      <div class="result-stat-val">${escapeHtml(value)}${bestBadge}</div>
      <div class="result-stat-label">${escapeHtml(label)}</div>
      ${subHtml}
    </div>
  `;
}

function renderWeapons(weapons) {
  if (!weapons?.length) return '';

  const chips = weapons.map((weapon) => `
    <div class="result-weapon-chip">
      <span class="result-weapon-name">${escapeHtml(weapon.name)}</span>
      <span class="result-weapon-lv">Lv.${escapeHtml(String(weapon.level ?? 1))}</span>
      ${weapon.isEvolved ? '<span class="result-weapon-evo">진화</span>' : ''}
    </div>
  `).join('');

  return `
    <p class="result-section-title">사용한 무기</p>
    <div class="result-weapons">${chips}</div>
    <div class="result-divider"></div>
  `;
}

function renderCurrency(earned, total) {
  if (!earned) return '';

  return `
    <p class="result-section-title">이번 런 획득 재화</p>
    <div class="result-currency-row">
      <div>
        <div class="result-currency-label">획득 재화</div>
        <div class="result-currency-earn">+ ${escapeHtml(String(earned))} 💰</div>
      </div>
      ${total != null ? `
        <div class="result-currency-total-wrap">
          <div class="result-currency-label">누적 재화</div>
          <div class="result-currency-total">총 ${escapeHtml(String(total))} 💰</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderAscension(stats) {
  const level = stats.ascensionLevel ?? 0;
  const highest = stats.highestAscensionCleared ?? 0;

  return `
    <p class="result-section-title">Ascension</p>
    <div class="result-currency-row">
      <div>
        <div class="result-currency-label">이번 런</div>
        <div class="result-currency-earn">A${escapeHtml(String(level))}</div>
      </div>
      <div class="result-currency-total-wrap">
        <div class="result-currency-label">최고 클리어</div>
        <div class="result-currency-total">A${escapeHtml(String(highest))}</div>
      </div>
    </div>
  `;
}

function renderUnlocks(unlocks) {
  const chips = unlocks.map((unlock) => `
    <div class="result-unlock-chip">⚡ ${escapeHtml(unlock)}</div>
  `).join('');

  return `
    <div class="result-divider"></div>
    <p class="result-section-title">이번 런 해금</p>
    <div class="result-unlocks">${chips}</div>
  `;
}

function renderNextGoals(nextGoals = []) {
  if (!nextGoals?.length) return '';

  const chips = nextGoals.map((goal) => `
    <div class="result-unlock-chip">
      ${escapeHtml(goal.icon ?? '✦')} ${escapeHtml(goal.title ?? '')}
      ${goal.progressText ? ` · ${escapeHtml(goal.progressText)}` : ''}
    </div>
  `).join('');

  return `
    <div class="result-divider"></div>
    <p class="result-section-title">다음 목표</p>
    <div class="result-unlocks">${chips}</div>
  `;
}

function renderRunContext(stats) {
  const parts = [
    stats.archetypeName ? `Archetype ${stats.archetypeName}` : null,
    stats.riskRelicName ? `Relic ${stats.riskRelicName}` : null,
    stats.stageName ?? null,
    stats.seedLabel ? `Seed ${stats.seedLabel}` : null,
    stats.outcome === 'defeat' && stats.deathCause ? `마지막 타격 ${stats.deathCause}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return '';

  return `
    <div class="result-divider"></div>
    <p class="result-section-title">런 컨텍스트</p>
    <div class="result-unlocks">
      ${parts.map((part) => `<div class="result-unlock-chip">${escapeHtml(part)}</div>`).join('')}
    </div>
  `;
}

function renderRecentRuns(recentRuns = []) {
  if (!recentRuns.length) return '';

  const rows = recentRuns.slice(0, 5).map((run) => {
    const minutes = Math.floor((run.survivalTime ?? 0) / 60);
    const seconds = String(Math.floor((run.survivalTime ?? 0) % 60)).padStart(2, '0');
    return `
      <div class="result-weapon-chip">
        <span class="result-weapon-name">${escapeHtml(run.stageName ?? run.stageId ?? 'Unknown Stage')}</span>
        <span class="result-weapon-lv">${escapeHtml(`${minutes}:${seconds}`)}</span>
        <span class="result-weapon-evo">${run.outcome === 'victory' ? '승리' : '패배'}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="result-divider"></div>
    <p class="result-section-title">최근 런</p>
    <div class="result-weapons">${rows}</div>
  `;
}

export function renderResultViewMarkup(stats, { onTitleCallback = null } = {}) {
  const isVictory = stats.outcome === 'victory';
  const modeClass = isVictory ? 'victory' : 'defeat';
  const minutes = Math.floor(stats.survivalTime / 60);
  const seconds = String(Math.floor(stats.survivalTime % 60)).padStart(2, '0');
  const timeText = `${minutes}:${seconds}`;
  const bestTimeText = stats.bestTime != null
    ? `${Math.floor(stats.bestTime / 60)}:${String(Math.floor(stats.bestTime % 60)).padStart(2, '0')}`
    : null;
  const newBestTime = stats.bestTime != null && stats.survivalTime > stats.bestTime;
  const newBestLevel = stats.bestLevel != null && stats.level > stats.bestLevel;
  const newBestKills = stats.bestKills != null && stats.killCount > stats.bestKills;

  const titleBtn = onTitleCallback
    ? renderActionButton({
        className: 'result-title-btn',
        label: '⌂ 메인 화면으로',
        tone: 'neutral',
      })
    : '';

  return `
    <div class="result-card">
      <div class="result-header ${modeClass}">
        <div class="result-outcome-badge ${modeClass}">
          <div class="result-outcome-dot ${modeClass}"></div>
          <span>${isVictory ? 'The night is broken' : 'The hunt ends here'}</span>
        </div>
        <p class="result-title">${isVictory ? 'VICTORY' : 'DEFEAT'}</p>
        <p class="result-sub">${isVictory ? '모든 보스를 처치했습니다' : '당신의 전투가 기록되었습니다'}</p>
      </div>

      <div class="result-body">
        <div class="result-stat-grid">
          ${renderStat(timeText, '생존 시간', newBestTime, bestTimeText ? `이전 기록 ${bestTimeText}` : null)}
          ${renderStat(`Lv.${stats.level}`, '최종 레벨', newBestLevel, stats.bestLevel != null ? `이전 기록 Lv.${stats.bestLevel}` : null)}
          ${renderStat(
            Number(stats.killCount ?? 0).toLocaleString(),
            '처치 수',
            newBestKills,
            stats.bestKills != null ? `이전 기록 ${Number(stats.bestKills).toLocaleString()}` : null,
          )}
        </div>

        ${renderWeapons(stats.weapons)}
        <div class="result-divider"></div>
        ${renderAscension(stats)}
        ${renderCurrency(stats.currencyEarned, stats.totalCurrency)}
        ${renderRunContext(stats)}
        ${stats.analytics?.deathCauseSummary?.length
          ? `
            <div class="result-divider"></div>
            <p class="result-section-title">최근 분석</p>
            <div class="result-unlocks">
              <div class="result-unlock-chip">주요 패배 원인 ${escapeHtml(stats.analytics.deathCauseSummary[0].deathCause)}</div>
              <div class="result-unlock-chip">최근 승률 ${escapeHtml(String(Math.round(stats.analytics.winRate ?? 0)))}%</div>
            </div>
          `
          : ''}
        ${renderNextGoals(stats.nextGoals)}
        ${stats.newUnlocks?.length ? renderUnlocks(stats.newUnlocks) : ''}
        ${renderRecentRuns(stats.recentRuns)}
      </div>

      <div class="result-footer">
        ${titleBtn}
        ${renderActionButton({
          className: 'result-restart-btn',
          label: '↺ 다시 시작',
          tone: isVictory ? 'success' : 'danger',
          stretch: true,
        })}
      </div>
    </div>
  `;
}
