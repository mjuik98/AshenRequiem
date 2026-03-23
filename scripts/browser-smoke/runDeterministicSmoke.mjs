import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCENARIOS, getScenarioIds, OUTPUT_ROOT } from './scenarios.js';

const OUTPUT_PATH_PREFIX = 'output/web-game/';
const PWCLI = resolvePwcliPath();
const SMOKE_SESSION_PREFIX = 'ashen-smoke-';

function resolveWindowsPlaywrightCliPath() {
  const explicit = process.env.PLAYWRIGHT_CLI_JS ?? process.env.PWCLI_JS;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  const localAppData = process.env.LOCALAPPDATA?.replaceAll('\\', '/');
  if (!localAppData) {
    throw new Error('LOCALAPPDATA is required to resolve @playwright/cli cache path on Windows.');
  }

  const npxRoot = `${localAppData}/npm-cache/_npx`;
  const candidateDirs = fs.existsSync(npxRoot)
    ? fs.readdirSync(npxRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${npxRoot}/${entry.name}`)
    : [];

  const cliCandidates = candidateDirs
    .map((dirPath) => ({
      scriptPath: `${dirPath}/node_modules/@playwright/cli/playwright-cli.js`,
      mtimeMs: fs.existsSync(dirPath) ? fs.statSync(dirPath).mtimeMs : 0,
    }))
    .filter((entry) => fs.existsSync(entry.scriptPath))
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  if (cliCandidates.length > 0) {
    return cliCandidates[0].scriptPath;
  }

  throw new Error('Unable to locate cached @playwright/cli script on Windows.');
}

function withDebugRuntime(url) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('debugRuntime', '1');
  return nextUrl.toString();
}

function parseArgs(argv) {
  const args = {
    url: null,
    scenario: null,
    all: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--url' && next) {
      args.url = next;
      index += 1;
    } else if (arg === '--scenario' && next) {
      args.scenario = next;
      index += 1;
    } else if (arg === '--all') {
      args.all = true;
    }
  }

  if (!args.url) {
    throw new Error('--url is required');
  }

  if (!args.all && !args.scenario) {
    throw new Error('--scenario or --all is required');
  }

  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runCli(args) {
  const invocation = buildPlaywrightInvocation(args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: false,
    timeout: 20000,
  });

  if (result.status !== 0) {
    throw new Error([
      `Playwright CLI failed: ${args.join(' ')}`,
      result.stdout?.trim(),
      result.stderr?.trim(),
    ].filter(Boolean).join('\n'));
  }

  return result.stdout ?? '';
}

function buildPlaywrightInvocation(args) {
  if (process.platform === 'win32') {
    const cliScriptPath = resolveWindowsPlaywrightCliPath();
    return {
      command: process.execPath,
      args: [cliScriptPath, ...args],
    };
  }

  return {
    command: 'bash',
    args: ['-lc', [PWCLI, ...args].map(quoteShellArg).join(' ')],
  };
}

function quoteShellArg(value) {
  const stringValue = String(value);
  return `'${stringValue.replaceAll("'", `'\"'\"'`)}'`;
}

function resolvePwcliPath() {
  const explicit = process.env.PWCLI;
  if (explicit) return explicit.replaceAll('\\', '/');

  const cwd = process.cwd().replaceAll('\\', '/');
  const cwdMatch = cwd.match(/^\/mnt\/([a-z])\/Users\/([^/]+)/i);
  if (cwdMatch) {
    return `/mnt/${cwdMatch[1].toLowerCase()}/Users/${cwdMatch[2]}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  const userProfile = (process.env.USERPROFILE ?? '').replaceAll('\\', '/');
  const profileMatch = userProfile.match(/^([A-Za-z]):\/Users\/([^/]+)/);
  if (profileMatch) {
    return `/mnt/${profileMatch[1].toLowerCase()}/Users/${profileMatch[2]}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  const home = (process.env.HOME ?? '').replaceAll('\\', '/');
  if (home.startsWith('/')) {
    return `${home}/.codex/skills/playwright/scripts/playwright_cli.sh`;
  }

  throw new Error('Unable to resolve playwright_cli.sh path. Set PWCLI explicitly.');
}

function pw(sessionId, args) {
  return runCli(['--session', sessionId, ...args]);
}

function parseEvalResult(stdout) {
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

function assertNoCliError(stdout, context) {
  if (stdout.includes('### Error')) {
    throw new Error(`Playwright ${context} failed:\n${stdout.trim()}`);
  }
}

function parseSnapshotPath(stdout) {
  const match = stdout.match(/\[Snapshot\]\((\.playwright-cli\\[^)]+\.yml)\)/);
  return match ? match[1].replaceAll('\\', '/') : null;
}

function findRefByText(snapshotPath, buttonText) {
  const content = fs.readFileSync(path.resolve(snapshotPath), 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.includes(buttonText) || !line.includes('[ref=e')) {
      continue;
    }
    const match = line.match(/\[ref=(e\d+)\]/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function evalJson(sessionId, expression) {
  const stdout = pw(sessionId, ['eval', expression]);
  return parseEvalResult(stdout);
}

async function clickByText(sessionId, buttonText, timeoutMs = 5000, intervalMs = 150) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const snapshotOutput = pw(sessionId, ['snapshot']);
    const snapshotPath = parseSnapshotPath(snapshotOutput);
    const ref = snapshotPath ? findRefByText(snapshotPath, buttonText) : null;
    if (ref) {
      pw(sessionId, ['click', ref]);
      return true;
    }
    await sleep(intervalMs);
  }

  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollEval(sessionId, expression, predicate, timeoutMs = 5000, intervalMs = 150) {
  const startedAt = Date.now();
  let lastValue = null;

  while (Date.now() - startedAt <= timeoutMs) {
    lastValue = evalJson(sessionId, expression);
    if (predicate(lastValue)) {
      return lastValue;
    }
    await sleep(intervalMs);
  }

  return lastValue;
}

function takeScreenshot(sessionId, outputPath) {
  const stdout = pw(sessionId, ['screenshot']);
  const match = stdout.match(/\((\.playwright-cli\\[^)]+\.png)\)/);
  if (!match) {
    throw new Error(`Failed to parse screenshot path from CLI output:\n${stdout}`);
  }
  const cliPath = match[1].replaceAll('\\', '/');
  fs.copyFileSync(path.resolve(cliPath), path.resolve(outputPath));
}

function writeJson(outputPath, payload) {
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function buildSessionId(scenarioId) {
  return `${SMOKE_SESSION_PREFIX}${scenarioId.replaceAll('_', '-')}-${process.pid}-${Date.now()}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanupSmokeSessionProcesses(sessionPattern) {
  if (!sessionPattern) return;

  if (process.platform === 'win32') {
    const psScript = [
      `$pattern = '${sessionPattern.replaceAll("'", "''")}'`,
      '$targets = Get-CimInstance Win32_Process | Where-Object {',
      '  $_.CommandLine -match $pattern -and ($_.Name -eq "node.exe" -or $_.Name -eq "cmd.exe")',
      '}',
      'foreach ($target in $targets) {',
      '  try { Stop-Process -Id $target.ProcessId -Force -ErrorAction Stop } catch {}',
      '}',
    ].join('; ');
    spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], {
      cwd: process.cwd(),
      env: process.env,
      encoding: 'utf8',
      shell: false,
      timeout: 5000,
    });
    return;
  }

  spawnSync('pkill', ['-f', sessionPattern], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: false,
    timeout: 5000,
  });
}

function closePage(sessionId) {
  cleanupSmokeSessionProcesses(escapeRegExp(sessionId));
}

function runCode(sessionId, source) {
  const stdout = pw(sessionId, ['run-code', source]);
  assertNoCliError(stdout, 'run-code');
  return stdout;
}

async function bootToPlay(sessionId, url) {
  pw(sessionId, ['open', withDebugRuntime(url)]);
  await pollEval(
    sessionId,
    `Boolean(document.querySelector('[data-action="start"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const titleClicked = await clickByText(sessionId, 'Start Game');
  if (!titleClicked) {
    throw new Error('Failed to click Start Game button');
  }

  const loadoutVisible = await pollEval(
    sessionId,
    `Boolean(document.querySelector('.sl-root [data-action="start"]')) && getComputedStyle(document.querySelector('.sl-root')).display !== 'none'`,
    (value) => value === true,
    5000,
    150,
  );
  if (loadoutVisible !== true) {
    throw new Error('Start loadout dialog did not open');
  }

  const loadoutClicked = await clickByText(sessionId, '시작하기');
  if (!loadoutClicked) {
    throw new Error('Failed to click loadout start button');
  }
  await sleep(250);
  evalJson(sessionId, 'window.__ASHEN_DEBUG__?.advanceTime?.(136), true');
  return pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (state) => state?.scene === 'PlayScene',
    5000,
    200,
  );
}

async function runTitleToPlay(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  const state = await bootToPlay(sessionId, url);
  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_to_play',
    state,
    assertions: {
      scene: state?.scene === 'PlayScene',
      weaponCount: (state?.player?.weapons?.length ?? 0) === 1,
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

async function runTitleCodex(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  pw(sessionId, ['open', withDebugRuntime(url)]);
  await pollEval(
    sessionId,
    `Boolean(document.querySelector('[data-action="codex"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const codexClicked = await clickByText(sessionId, 'Codex');
  if (!codexClicked) {
    throw new Error('Failed to click Codex button');
  }
  const codexReady = await pollEval(
    sessionId,
    "Boolean(document.querySelector('.cx-root')) && Boolean(document.querySelector('.cx-tab[data-tab=\"accessory\"]'))",
    (value) => value === true,
    5000,
    200,
  );
  const state = { scene: codexReady ? 'CodexScene' : null };

  const discoveryStripCount = evalJson(sessionId, `document.querySelectorAll('.cx-disc-pill').length`);
  const accessoryTabClicked = await clickByText(sessionId, '장신구 도감');
  if (!accessoryTabClicked) {
    throw new Error('Failed to click accessory tab');
  }
  const codexUi = {
    rootVisible: evalJson(sessionId, `Boolean(document.querySelector('.cx-root'))`),
    tabCount: evalJson(sessionId, `document.querySelectorAll('.cx-tab').length`),
    discoveryStripCount,
    accessoryTabActive: evalJson(sessionId, `Boolean(document.querySelector('#cx-tab-accessory')) && Boolean(document.querySelector('.cx-tab[data-tab="accessory"]'))`),
    accessoryFilterCount: evalJson(sessionId, `document.querySelectorAll('#cx-tab-accessory .cx-af').length`),
    effectFilterCount: evalJson(sessionId, `document.querySelectorAll('#cx-tab-accessory .cx-ef').length`),
    accessoryDetailVisible: evalJson(sessionId, `Boolean(document.getElementById('cx-accessory-detail'))`),
    accessoryHintCount: evalJson(sessionId, `document.getElementById('cx-tab-accessory') ? document.getElementById('cx-tab-accessory').querySelectorAll('.cx-discovery-hint').length : 0`),
  };
  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_codex',
    state,
    codexUi,
    assertions: {
      scene: state?.scene === 'CodexScene',
      rootVisible: codexUi.rootVisible === true,
      hasTabs: codexUi.tabCount >= 4,
      hasDiscoveryStrip: codexUi.discoveryStripCount >= 3,
      hasAccessoryTab: codexUi.accessoryTabActive === true,
      hasAccessoryFilters: codexUi.accessoryFilterCount >= 4 && codexUi.effectFilterCount >= 4,
      hasAccessoryDetail: codexUi.accessoryDetailVisible === true,
      hasHint: codexUi.accessoryHintCount >= 1,
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

async function runTitleSettings(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  pw(sessionId, ['open', withDebugRuntime(url)]);
  await pollEval(
    sessionId,
    `Boolean(document.querySelector('[data-action="settings"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  const settingsClicked = await clickByText(sessionId, 'Settings');
  if (!settingsClicked) {
    throw new Error('Failed to click Settings button');
  }
  const state = await pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.scene === 'SettingsScene',
    5000,
    200,
  );
  const settingsUi = {
    rootVisible: evalJson(sessionId, `Boolean(document.querySelector('.sv-root'))`),
    saveLabel: evalJson(sessionId, `document.querySelector('.sv-btn-primary')?.textContent?.trim() ?? ''`),
  };
  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'title_settings',
    state,
    settingsUi,
    assertions: {
      scene: state?.scene === 'SettingsScene',
      rootVisible: settingsUi.rootVisible === true,
      hasSaveButton: typeof settingsUi.saveLabel === 'string'
        && settingsUi.saveLabel.includes('저장하고 닫기'),
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

async function runPauseOverlay(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  await bootToPlay(sessionId, url);
  const pauseOpened = evalJson(sessionId, 'window.__ASHEN_DEBUG__?.openPauseOverlay?.() ?? false');
  if (pauseOpened !== true) {
    throw new Error('Pause overlay did not open');
  }
  const state = await pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.pauseVisible === true,
    3000,
    150,
  );
  const pauseSnapshotOutput = pw(sessionId, ['snapshot']);
  const pauseSnapshot = parseSnapshotPath(pauseSnapshotOutput);
  const weaponRef = pauseSnapshot ? findRefByText(pauseSnapshot, '마법탄') : null;
  if (!weaponRef) {
    throw new Error('Failed to find 마법탄 ref from pause snapshot');
  }
  pw(sessionId, ['hover', weaponRef]);
  const hover = {
    ok: true,
    weaponRef,
    cardName: evalJson(sessionId, `document.querySelector('.pv-slot-card[data-loadout="weapon"] .pv-slot-name')?.textContent ?? ''`),
  };
  const tooltipVisible = await pollEval(
    sessionId,
    `!!document.querySelector('.pv-tooltip')
      && getComputedStyle(document.querySelector('.pv-tooltip')).display !== 'none'`,
    (value) => value === true,
    3000,
    150,
  );
  const tooltip = {
    visible: tooltipVisible === true,
    text: evalJson(sessionId, `document.querySelector('.pv-tooltip')?.innerText ?? ''`),
  };
  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'pause_overlay',
    pauseOpened,
    hover,
    state,
    tooltip,
    assertions: {
      pauseVisible: state?.ui?.pauseVisible === true,
      tooltipVisible: tooltip?.visible === true,
      hasTooltipText: typeof tooltip?.text === 'string'
        && tooltip.text.includes(hover?.cardName ?? ''),
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

async function runPauseLayout(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  const readLayoutState = (includeVisible = false) => ({
    selected: evalJson(sessionId, `document.querySelector('.pv-slot-card.selected')?.dataset.loadoutKey ?? null`),
    grid: evalJson(sessionId, `getComputedStyle(document.querySelector('.pv-loadout-panel')).gridTemplateColumns ?? ''`),
    width: evalJson(sessionId, 'window.innerWidth'),
    height: evalJson(sessionId, 'window.innerHeight'),
    ...(includeVisible
      ? { visible: evalJson(sessionId, `!!document.querySelector('#pv-tab-loadout.active')`) }
      : {}),
  });

  await bootToPlay(sessionId, url);
  const pauseOpened = evalJson(sessionId, 'window.__ASHEN_DEBUG__?.openPauseOverlay?.() ?? false');
  if (pauseOpened !== true) {
    throw new Error('Pause overlay did not open');
  }

  await pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.pauseVisible === true,
    3000,
    150,
  );

  const desktopBefore = readLayoutState();

  const layoutSnapshotOutput = pw(sessionId, ['snapshot']);
  const layoutSnapshot = parseSnapshotPath(layoutSnapshotOutput);
  const alternateRef = layoutSnapshot ? findRefByText(layoutSnapshot, '빈 무기 슬롯') : null;
  if (!alternateRef) {
    throw new Error('Failed to find 빈 무기 슬롯 ref from pause layout snapshot');
  }
  pw(sessionId, ['click', alternateRef]);
  await sleep(120);
  const accessorySelection = evalJson(
    sessionId,
    `document.querySelector('.pv-slot-card.selected')?.dataset.loadoutKey ?? null`,
  );

  pw(sessionId, ['press', 'Escape']);
  await sleep(180);
  pw(sessionId, ['press', 'Escape']);
  await sleep(250);

  const desktopReopen = readLayoutState(true);

  pw(sessionId, ['resize', '540', '960']);
  await sleep(180);

  const mobile = readLayoutState();

  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'pause_layout',
    pauseOpened,
    desktopBefore,
    accessorySelection,
    desktopReopen,
    mobile,
    assertions: {
      pauseVisibleAfterReopen: desktopReopen?.visible === true,
      selectionChanged: Boolean(accessorySelection) && accessorySelection !== desktopBefore?.selected,
      selectionPersisted: Boolean(accessorySelection) && desktopReopen?.selected === accessorySelection,
      mobileStillSelected: mobile?.selected === accessorySelection,
      mobileSingleColumn: String(mobile?.grid ?? '').trim().split(/\s+/).length === 1,
      mobileViewportApplied: mobile?.width <= 540,
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

async function runResultScreen(url, artifactDir, sessionId) {
  ensureDir(artifactDir);

  await bootToPlay(sessionId, url);
  const resultOpened = evalJson(sessionId, 'window.__ASHEN_DEBUG__?.openResultOverlay?.() ?? false');
  if (resultOpened !== true) {
    throw new Error('Result overlay did not open');
  }
  const triggerState = await pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.resultVisible === true,
    3000,
    150,
  );
  const state = await pollEval(
    sessionId,
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (value) => value?.ui?.resultVisible === true,
    3000,
    150,
  );
  const resultUi = {
    title: evalJson(sessionId, `document.querySelector('.result-title')?.textContent?.trim() ?? ''`),
    restart: evalJson(sessionId, `document.querySelector('.result-restart-btn')?.textContent?.trim() ?? ''`),
    titleButton: evalJson(sessionId, `document.querySelector('.result-title-btn')?.textContent?.trim() ?? ''`),
  };
  takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
  const summary = {
    scenario: 'result_screen',
    resultOpened,
    triggerState,
    state,
    resultUi,
    assertions: {
      resultVisible: state?.ui?.resultVisible === true,
      hasGameOver: typeof resultUi?.title === 'string' && resultUi.title.includes('GAME OVER'),
      hasRestartButton: typeof resultUi?.restart === 'string' && resultUi.restart.includes('다시 시작'),
    },
  };
  writeJson(path.join(artifactDir, 'summary.json'), summary);
  return summary;
}

const RUNNERS = {
  title_to_play: runTitleToPlay,
  title_codex: runTitleCodex,
  title_settings: runTitleSettings,
  pause_overlay: runPauseOverlay,
  pause_layout: runPauseLayout,
  result_screen: runResultScreen,
};

async function runScenario(url, scenarioId, sessionId) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const runner = RUNNERS[scenarioId];
  if (!runner) {
    throw new Error(`No runner registered for scenario: ${scenarioId}`);
  }

  return runner(url, scenario.artifactDir, sessionId);
}

function summarize(results) {
  return {
    outputRoot: OUTPUT_ROOT,
    results,
    allPassed: results.every((result) => Object.values(result.assertions ?? {}).every(Boolean)),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!OUTPUT_ROOT.startsWith(OUTPUT_PATH_PREFIX)) {
    throw new Error(`Smoke output must stay under ${OUTPUT_PATH_PREFIX}`);
  }
  ensureDir(OUTPUT_ROOT);
  cleanupSmokeSessionProcesses(escapeRegExp(SMOKE_SESSION_PREFIX));
  const sessionId = buildSessionId(args.all ? 'all' : args.scenario);

  try {
    const scenarioIds = args.all ? getScenarioIds() : [args.scenario];
    const results = [];
    for (const scenarioId of scenarioIds) {
      // Keep one active CLI request at a time per session.
      results.push(await runScenario(args.url, scenarioId, sessionId));
    }
    const summary = summarize(results);
    writeJson(path.join(OUTPUT_ROOT, 'summary.json'), summary);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

    if (!summary.allPassed) {
      process.exitCode = 1;
    }
  } finally {
    closePage(sessionId);
  }
}

await main();
process.exit(process.exitCode ?? 0);
