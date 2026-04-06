import {
  exportSessionSnapshot as exportSessionSnapshotImpl,
  inspectStoredSessionSnapshots as inspectStoredSessionSnapshotsImpl,
  previewSessionSnapshotImport as previewSessionSnapshotImportImpl,
} from './sessionSnapshotQueryService.js';
import {
  importSessionSnapshot as importSessionSnapshotImpl,
  resetSessionProgress as resetSessionProgressImpl,
  restoreStoredSessionSnapshot as restoreStoredSessionSnapshotImpl,
  saveSettingsAndApplyRuntime as saveSettingsAndApplyRuntimeImpl,
} from './sessionSnapshotCommandService.js';
import { logRuntimeError } from '../../utils/runtimeLogger.js';

function buildSettingsSceneResult({
  session,
  snapshot,
  message,
  detailLines = [],
  includeOptions = false,
} = {}) {
  return {
    snapshot: typeof snapshot === 'string'
      ? snapshot
      : (session ? exportSessionSnapshotImpl({ session }) : ''),
    ...(includeOptions ? { options: session?.options } : {}),
    message,
    detailLines,
  };
}

function resolveSettingsRuntimeDeps(createRuntimeDeps) {
  if (typeof createRuntimeDeps !== 'function') return {};
  return createRuntimeDeps() ?? {};
}

export function createSettingsSceneHandlers({
  session,
  createRuntimeDeps,
  onRequestClose = null,
  isNavigating = () => false,
} = {}) {
  return {
    onSave(newOpts) {
      if (isNavigating()) return null;
      const resolvedOptions = saveSettingsSceneOptions({
        session,
        nextOptions: newOpts,
        ...resolveSettingsRuntimeDeps(createRuntimeDeps),
      });
      onRequestClose?.();
      return resolvedOptions;
    },
    onBack() {
      return onRequestClose?.();
    },
    onExport() {
      return exportSettingsSceneSnapshot({ session });
    },
    onInspect() {
      return inspectSettingsSceneStorage({ session });
    },
    onPreviewImport(rawSnapshot) {
      return previewSettingsSceneImport({
        session,
        rawSnapshot,
      });
    },
    onImport(rawSnapshot) {
      return importSettingsSceneSnapshot({
        session,
        rawSnapshot,
        ...resolveSettingsRuntimeDeps(createRuntimeDeps),
      });
    },
    onReset() {
      return resetSettingsSceneProgress({
        session,
        ...resolveSettingsRuntimeDeps(createRuntimeDeps),
      });
    },
    onRestoreBackup() {
      return restoreSettingsSceneBackup({
        session,
        ...resolveSettingsRuntimeDeps(createRuntimeDeps),
      });
    },
  };
}

export function exportSettingsSceneSnapshot({ session } = {}) {
  return exportSessionSnapshotImpl({ session });
}

export function saveSettingsSceneOptions({
  session,
  nextOptions,
  ...runtimeDeps
} = {}) {
  return saveSettingsAndApplyRuntimeImpl({
    session,
    nextOptions,
    ...runtimeDeps,
  });
}

export function previewSettingsSceneImport({
  session,
  rawSnapshot = '',
} = {}) {
  try {
    const preview = previewSessionSnapshotImportImpl({
      session,
      rawSnapshot,
    });
    return buildSettingsSceneResult({
      session,
      snapshot: rawSnapshot,
      includeOptions: true,
      message: '가져오기 미리보기를 생성했습니다.',
      detailLines: preview.diffLines.length > 0
        ? preview.diffLines
        : ['현재 세션과 차이가 없습니다.'],
    });
  } catch (error) {
    logRuntimeError('SettingsScene', '세션 미리보기 실패:', error);
    return buildSettingsSceneResult({
      session,
      snapshot: rawSnapshot,
      message: '세션 미리보기를 생성하지 못했습니다. JSON 형식을 확인하세요.',
    });
  }
}

export function importSettingsSceneSnapshot({
  session,
  rawSnapshot = '',
  ...runtimeDeps
} = {}) {
  try {
    importSessionSnapshotImpl({
      session,
      rawSnapshot,
      ...runtimeDeps,
    });
    return buildSettingsSceneResult({
      session,
      includeOptions: true,
      message: '세션 데이터를 가져왔습니다.',
    });
  } catch (error) {
    logRuntimeError('SettingsScene', '세션 가져오기 실패:', error);
    return buildSettingsSceneResult({
      session,
      snapshot: rawSnapshot,
      message: '세션 데이터를 가져오지 못했습니다. JSON 형식을 확인하세요.',
    });
  }
}

export function resetSettingsSceneProgress({
  session,
  ...runtimeDeps
} = {}) {
  resetSessionProgressImpl({
    session,
    ...runtimeDeps,
  });
  return buildSettingsSceneResult({
    session,
    includeOptions: true,
    message: '진행 데이터를 초기화했습니다. 옵션과 현재 시작 설정은 유지됩니다.',
  });
}

export function inspectSettingsSceneStorage({
  session,
  ...options
} = {}) {
  const inspection = inspectStoredSessionSnapshotsImpl(options);
  const primaryText = inspection.primary.status === 'ok'
    ? `primary 재화 ${inspection.primary.session.meta?.currency ?? 0}`
    : `primary ${inspection.primary.status}`;
  const backupText = inspection.backup.status === 'ok'
    ? `backup 재화 ${inspection.backup.session.meta?.currency ?? 0}`
    : `backup ${inspection.backup.status}`;
  const corruptText = inspection.corrupt.status === 'missing'
    ? 'corrupt 없음'
    : `corrupt ${inspection.corrupt.status}`;

  return buildSettingsSceneResult({
    session,
    includeOptions: true,
    message: `${primaryText} · ${backupText} · ${corruptText}`,
  });
}

export function restoreSettingsSceneBackup({
  session,
  target = 'backup',
  ...runtimeDeps
} = {}) {
  try {
    restoreStoredSessionSnapshotImpl({
      session,
      target,
      ...runtimeDeps,
    });
    return buildSettingsSceneResult({
      session,
      includeOptions: true,
      message: 'backup 슬롯에서 세션을 복구했습니다.',
    });
  } catch (error) {
    logRuntimeError('SettingsScene', 'backup restore 실패:', error);
    return buildSettingsSceneResult({
      session,
      message: 'backup 슬롯을 복구하지 못했습니다.',
    });
  }
}
