const MODULE_LOAD_FAILURE_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'error loading dynamically imported module',
  'ChunkLoadError',
];

function getRuntimeIssueText(error) {
  return String(error?.message ?? error ?? '');
}

export function isModuleLoadFailure(error) {
  const issueText = getRuntimeIssueText(error);
  return MODULE_LOAD_FAILURE_PATTERNS.some((pattern) => issueText.includes(pattern));
}

export function buildModuleLoadFailureMessage(label, error) {
  if (isModuleLoadFailure(error)) {
    return `${label} 화면을 불러오지 못했습니다. 개발 서버가 중지되었을 수 있습니다. 서버를 다시 켜고 새로고침한 뒤 다시 시도해주세요.`;
  }
  return `${label} 화면을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.`;
}
