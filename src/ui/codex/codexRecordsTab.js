import {
  buildCodexAchievements,
  buildCodexDiscoverySummary,
  buildCodexRecordSummary,
  buildCodexUnlockEntries,
} from './codexRecords.js';
import { buildMetaGoalRoadmap } from '../../domain/meta/progression/metaGoalDomain.js';

export function buildCodexRecordsModel({ session = null, gameData = null }) {
  const summary = buildCodexRecordSummary(session);
  const achievements = buildCodexAchievements(session, gameData);
  const unlocks = buildCodexUnlockEntries(session);
  const discovery = buildCodexDiscoverySummary({ session, gameData });
  const roadmapGoals = buildMetaGoalRoadmap({ session, gameData, limit: 4 });

  const secondaryGoals = [
    ...achievements
      .filter((entry) => !entry.done)
      .map((entry) => ({
        kind: 'achievement',
        icon: entry.icon,
        title: entry.name,
        description: entry.desc,
        progressText: `${Math.round(entry.pct)}%`,
        pct: entry.pct,
      })),
    ...unlocks
      .filter((entry) => !entry.done)
      .map((entry) => ({
        kind: 'unlock',
        icon: entry.icon,
        title: entry.title,
        description: entry.description,
        progressText: entry.progressText,
        pct: entry.pct,
      })),
  ]
    .sort((left, right) => right.pct - left.pct)
    .slice(0, 4);

  const focusGoals = [
    ...roadmapGoals,
    ...secondaryGoals.filter((entry) => !roadmapGoals.some((goal) => goal.title === entry.title)),
  ].slice(0, 4);

  const discoveryFocus = discovery.entries.map((entry) => ({
    ...entry,
    remaining: Math.max(0, entry.total - entry.discovered),
    progressText: `${entry.discovered}/${entry.total}`,
  }));

  return {
    summary,
    analytics: summary.analytics,
    highlights: [
      { icon: '☠', value: summary.kills.toLocaleString(), label: '총 처치 수' },
      { icon: '⏱', value: `${summary.mm}:${summary.ss}`, label: '최장 생존' },
      { icon: '★', value: `Lv.${summary.best.level ?? 1}`, label: '최고 레벨' },
      { icon: '💰', value: summary.currency.toLocaleString(), label: '누적 재화' },
    ],
    achievements,
    unlocks,
    focusGoals,
    discoveryFocus,
  };
}

export function renderCodexRecordsTab({ session = null, gameData = null }) {
  const {
    summary,
    highlights,
    achievements,
    unlocks,
    focusGoals,
    discoveryFocus,
  } = buildCodexRecordsModel({ session, gameData });

  return `
    <div class="cx-records-hero">
      ${highlights.map((entry) => `
        <div class="cx-records-hero-card">
          <div class="cx-rec-icon">${entry.icon}</div>
          <div class="cx-rec-val">${entry.value}</div>
          <div class="cx-rec-key">${entry.label}</div>
        </div>
      `).join('')}
    </div>
    <p class="cx-section-label">다음 목표</p>
    <div class="cx-records-focus">
      ${focusGoals.map((entry) => `
        <div class="cx-records-focus-card ${entry.kind}">
          <div class="cx-rec-icon">${entry.icon}</div>
          <div class="cx-records-focus-copy">
            <div class="cx-records-focus-title">${entry.title}</div>
            <div class="cx-records-focus-desc">${entry.description}</div>
          </div>
          <div class="cx-records-focus-meta">
            <div class="cx-prog-bar"><div class="cx-prog-fill" style="width:${Math.min(100, entry.pct)}%"></div></div>
            <div class="cx-prog-text">${entry.progressText}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <p class="cx-section-label" style="margin-top:18px">발견 진행</p>
    <div class="cx-records-focus">
      ${discoveryFocus.map((entry) => `
        <div class="cx-records-focus-card tone-${entry.tone}">
          <div class="cx-rec-icon">${entry.icon}</div>
          <div class="cx-records-focus-copy">
            <div class="cx-records-focus-title">${entry.label} 도감</div>
            <div class="cx-records-focus-desc">남은 항목 ${entry.remaining}개</div>
          </div>
          <div class="cx-records-focus-meta">
            <div class="cx-prog-bar"><div class="cx-prog-fill" style="width:${Math.min(100, entry.pct)}%"></div></div>
            <div class="cx-prog-text">${entry.progressText}</div>
          </div>
        </div>
      `).join('')}
    </div>
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
      ${achievements.map((entry) => `
        <div class="cx-ach ${entry.done ? 'done' : ''}">
          <div class="cx-ach-icon">${entry.icon}</div>
          <div class="cx-ach-body">
            <div class="cx-ach-name">${entry.name}</div>
            <div class="cx-ach-desc">${entry.desc}</div>
          </div>
          ${entry.done
            ? `<div class="cx-ach-check">✓ 완료</div>`
            : `<div class="cx-ach-prog">
                 <div class="cx-prog-bar"><div class="cx-prog-fill" style="width:${Math.min(100, entry.pct)}%"></div></div>
                 <div class="cx-prog-text">${Math.round(entry.pct)}%</div>
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
