function countUnlocked(values = []) {
  return Array.isArray(values) ? values.length : 0;
}

export function buildSessionPreviewSummary(session = {}) {
  return {
    currency: session.meta?.currency ?? 0,
    totalRuns: session.meta?.totalRuns ?? 0,
    unlockedWeapons: countUnlocked(session.meta?.unlockedWeapons),
    unlockedAccessories: countUnlocked(session.meta?.unlockedAccessories),
    completedUnlocks: countUnlocked(session.meta?.completedUnlocks),
    dailyChallengeStreak: session.meta?.dailyChallengeStreak ?? 0,
    selectedStageId: session.meta?.selectedStageId ?? 'ash_plains',
    selectedStartWeaponId: session.meta?.selectedStartWeaponId ?? 'magic_bolt',
    quality: session.options?.quality ?? 'medium',
    pauseBinding: session.options?.keyBindings?.pause?.[0] ?? 'escape',
  };
}

function pushDiffLine(lines, label, before, after, formatter = (value) => String(value)) {
  if (before === after) return;
  lines.push(`${label} ${formatter(before)} → ${formatter(after)}`);
}

export function buildSessionPreviewDiff(currentSession, importedSession) {
  const current = buildSessionPreviewSummary(currentSession);
  const imported = buildSessionPreviewSummary(importedSession);
  const lines = [];
  pushDiffLine(lines, '재화', current.currency, imported.currency);
  pushDiffLine(lines, '총 런', current.totalRuns, imported.totalRuns);
  pushDiffLine(lines, '해금 무기 수', current.unlockedWeapons, imported.unlockedWeapons);
  pushDiffLine(lines, '해금 장신구 수', current.unlockedAccessories, imported.unlockedAccessories);
  pushDiffLine(lines, '완료 해금 수', current.completedUnlocks, imported.completedUnlocks);
  pushDiffLine(lines, '일일 연속 보상', current.dailyChallengeStreak, imported.dailyChallengeStreak, (value) => `${value}일`);
  pushDiffLine(lines, '선택 스테이지', current.selectedStageId, imported.selectedStageId);
  pushDiffLine(lines, '시작 무기', current.selectedStartWeaponId, imported.selectedStartWeaponId);
  pushDiffLine(lines, '렌더 품질', current.quality, imported.quality);
  pushDiffLine(lines, 'pause 키', current.pauseBinding, imported.pauseBinding);
  return lines;
}
