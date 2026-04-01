import fs from 'node:fs';

export function resolveLocalPlaywrightCliPath({
  cwd = process.cwd(),
  existsSync = fs.existsSync,
} = {}) {
  const normalizedCwd = cwd.replaceAll('\\', '/').replace(/\/+$/, '');
  const localCliPath = `${normalizedCwd}/node_modules/@playwright/cli/playwright-cli.js`;
  return existsSync(localCliPath) ? localCliPath : null;
}

function quoteShellArg(value) {
  const stringValue = String(value);
  return `'${stringValue.replaceAll("'", `'\"'\"'`)}'`;
}

export function resolveWindowsPlaywrightCliPath({
  env = process.env,
  existsSync = fs.existsSync,
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
} = {}) {
  const explicit = env.PLAYWRIGHT_CLI_JS ?? env.PWCLI_JS;
  if (explicit && existsSync(explicit)) {
    return explicit;
  }

  const localAppData = env.LOCALAPPDATA?.replaceAll('\\', '/');
  if (!localAppData) {
    throw new Error('LOCALAPPDATA is required to resolve @playwright/cli cache path on Windows.');
  }

  const npxRoot = `${localAppData}/npm-cache/_npx`;
  const candidateDirs = existsSync(npxRoot)
    ? readdirSync(npxRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${npxRoot}/${entry.name}`)
    : [];

  const cliCandidates = candidateDirs
    .map((dirPath) => ({
      scriptPath: `${dirPath}/node_modules/@playwright/cli/playwright-cli.js`,
      mtimeMs: existsSync(dirPath) ? statSync(dirPath).mtimeMs : 0,
    }))
    .filter((entry) => existsSync(entry.scriptPath))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  if (cliCandidates.length > 0) {
    return cliCandidates[0].scriptPath;
  }

  throw new Error('Unable to locate cached @playwright/cli script on Windows.');
}

export function resolvePwcliPath({
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const explicit = env.PWCLI;
  if (explicit) return explicit.replaceAll('\\', '/');

  const normalizedCwd = cwd.replaceAll('\\', '/');
  const cwdMatch = normalizedCwd.match(/^\/mnt\/([a-z])\/Users\/([^/]+)/i);
  if (cwdMatch) {
    return `/mnt/${cwdMatch[1].toLowerCase()}/Users/${cwdMatch[2]}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  const userProfile = (env.USERPROFILE ?? '').replaceAll('\\', '/');
  const profileMatch = userProfile.match(/^([A-Za-z]):\/Users\/([^/]+)/);
  if (profileMatch) {
    return `/mnt/${profileMatch[1].toLowerCase()}/Users/${profileMatch[2]}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  const home = (env.HOME ?? '').replaceAll('\\', '/');
  if (home.startsWith('/')) {
    return `${home}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  throw new Error('Unable to resolve playwright_cli.sh path. Set PWCLI explicitly.');
}

export function buildPlaywrightInvocation(args, {
  platform = process.platform,
  processPath = process.execPath,
  env = process.env,
  cwd = process.cwd(),
  cliScriptPath = null,
  pwcliPath = null,
} = {}) {
  if (platform === 'win32') {
    const resolvedCliScriptPath = cliScriptPath
      ?? resolveLocalPlaywrightCliPath({ cwd })
      ?? resolveWindowsPlaywrightCliPath({ env });

    return {
      command: processPath,
      args: [resolvedCliScriptPath, ...args],
    };
  }

  return {
    command: 'bash',
    args: ['-lc', [(pwcliPath ?? resolvePwcliPath({ env, cwd })), ...args].map(quoteShellArg).join(' ')],
  };
}
