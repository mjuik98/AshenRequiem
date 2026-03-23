export function assertNoCliError(stdout, context) {
  if (stdout.includes('### Error')) {
    throw new Error(`Playwright ${context} failed:\n${stdout.trim()}`);
  }
}

export function parseEvalResult(stdout) {
  assertNoCliError(stdout, 'eval');
  const marker = '### Result';
  const ranMarker = '### Ran';
  const start = stdout.indexOf(marker);
  if (start === -1) return null;
  const after = stdout.slice(start + marker.length);
  const end = after.indexOf(ranMarker);
  const raw = (end === -1 ? after : after.slice(0, end)).trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

export function parseSnapshotPath(stdout) {
  const match = stdout.match(/\[Snapshot\]\((\.playwright-cli\\[^)]+\.yml)\)/);
  return match ? match[1].replaceAll('\\', '/') : null;
}

export function parseScreenshotPath(stdout) {
  const match = stdout.match(/\((\.playwright-cli\\[^)]+\.png)\)/);
  return match ? match[1].replaceAll('\\', '/') : null;
}
