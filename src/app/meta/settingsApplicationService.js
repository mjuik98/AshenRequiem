import { createSessionState } from '../../state/createSessionState.js';
import {
  normalizeSessionOptions,
} from '../../state/sessionOptions.js';
import { applySessionOptionsToRuntime } from '../session/sessionRuntimeApplicationService.js';
import {
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  parseSessionState,
  restoreStoredSessionSnapshot as restoreStoredSessionSnapshotImpl,
  serializeSessionState,
} from '../../state/session/sessionRepository.js';
import {
  persistSession,
  updateSessionOptionsAndSave,
} from '../session/sessionPersistenceService.js';

function cloneValue(value) {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function countUnlocked(values = []) {
  return Array.isArray(values) ? values.length : 0;
}

function buildSessionPreviewSummary(session = {}) {
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

function buildSessionPreviewDiff(currentSession, importedSession) {
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

function replaceSessionState(session, nextState) {
  session.last = cloneValue(nextState.last);
  session.best = cloneValue(nextState.best);
  session.meta = cloneValue(nextState.meta);
  session.options = cloneValue(nextState.options);
  session.activeRun = cloneValue(nextState.activeRun);
  session._version = nextState._version;
  return session;
}

function buildResetState(session) {
  const resetState = createSessionState();
  const preservedOptions = normalizeSessionOptions(session?.options ?? {});
  const preservedMeta = {
    selectedStartWeaponId: session?.meta?.selectedStartWeaponId ?? resetState.meta.selectedStartWeaponId,
    selectedStartAccessoryId: session?.meta?.selectedStartAccessoryId ?? resetState.meta.selectedStartAccessoryId,
    selectedArchetypeId: session?.meta?.selectedArchetypeId ?? resetState.meta.selectedArchetypeId,
    selectedRiskRelicId: session?.meta?.selectedRiskRelicId ?? resetState.meta.selectedRiskRelicId,
    selectedStageId: session?.meta?.selectedStageId ?? resetState.meta.selectedStageId,
    selectedSeedMode: session?.meta?.selectedSeedMode ?? resetState.meta.selectedSeedMode,
    selectedSeedText: session?.meta?.selectedSeedText ?? resetState.meta.selectedSeedText,
    selectedAscensionLevel: session?.meta?.selectedAscensionLevel ?? resetState.meta.selectedAscensionLevel,
  };

  return {
    ...resetState,
    meta: {
      ...resetState.meta,
      ...preservedMeta,
    },
    options: preservedOptions,
  };
}

export function saveSettingsAndApplyRuntime({
  session,
  nextOptions,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const resolvedOptions = updateSessionOptionsAndSave(session, nextOptions);

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  applySessionOptionsToRuntime(resolvedOptions, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });
  return resolvedOptions;
}

export function exportSessionSnapshot({ session } = {}) {
  return serializeSessionState(session);
}

export function importSessionSnapshot({
  session,
  rawSnapshot = '',
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const importedSession = parseSessionState(rawSnapshot);
  replaceSessionState(session, importedSession);
  applySessionOptionsToRuntime(session.options, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  persistSession(session);
  return session;
}

export function previewSessionSnapshotImport({
  session,
  rawSnapshot = '',
} = {}) {
  const importedSession = parseSessionState(rawSnapshot);
  return {
    summary: buildSessionPreviewSummary(importedSession),
    diffLines: buildSessionPreviewDiff(session, importedSession),
    importedSession,
  };
}

export function resetSessionProgress({
  session,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  replaceSessionState(session, buildResetState(session));
  applySessionOptionsToRuntime(session.options, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });

  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }

  persistSession(session);
  return session;
}

export function inspectStoredSessionSnapshots(options = {}) {
  return inspectStoredSessionSnapshotsImpl(options);
}

export function restoreStoredSessionSnapshot({
  session,
  target = 'backup',
  storage = null,
  renderer = null,
  soundSystem = null,
  accessibilityRuntime = null,
  inputManager = null,
  resizeCanvas = null,
} = {}) {
  const restoredSession = restoreStoredSessionSnapshotImpl(target, { storage });
  replaceSessionState(session, restoredSession);
  applySessionOptionsToRuntime(session.options, {
    renderer,
    soundSystem,
    accessibilityRuntime,
    inputManager,
  });
  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }
  persistSession(session);
  return session;
}
