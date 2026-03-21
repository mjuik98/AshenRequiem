import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SCENARIOS, getScenarioIds, OUTPUT_ROOT } from './scenarios.js';

const OUTPUT_PATH_PREFIX = 'output/web-game/';
const BASH_CMD = 'bash';
const PWCLI = resolvePwcliPath();

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
  const command = [PWCLI, ...args].map(quoteShellArg).join(' ');
  const result = spawnSync(BASH_CMD, ['-lc', command], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
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
  return `ashen-smoke-${scenarioId.replaceAll('_', '-')}-${process.pid}-${Date.now()}`;
}

function closePage(sessionId) {
  try {
    pw(sessionId, ['close']);
  } catch (error) {
    console.warn(`[browser-smoke] close skipped for ${sessionId}: ${error.message}`);
  }
}

function runCode(sessionId, source) {
  const stdout = pw(sessionId, ['run-code', source]);
  assertNoCliError(stdout, 'run-code');
  return stdout;
}

async function bootToPlay(sessionId, url) {
  const openOutput = pw(sessionId, ['open', url]);
  const titleSnapshot = parseSnapshotPath(openOutput);
  const titleStartRef = titleSnapshot ? findRefByText(titleSnapshot, 'Start Game') : null;
  if (!titleStartRef) {
    throw new Error('Failed to find Start Game ref from title snapshot');
  }

  const loadoutOutput = pw(sessionId, ['click', titleStartRef]);
  const loadoutSnapshot = parseSnapshotPath(loadoutOutput);
  const loadoutStartRef = loadoutSnapshot ? findRefByText(loadoutSnapshot, '시작하기') : null;
  if (!loadoutStartRef) {
    throw new Error('Failed to find loadout start ref from snapshot');
  }

  pw(sessionId, ['click', loadoutStartRef]);
  await sleep(250);
  evalJson(sessionId, 'window.__ASHEN_RUNTIME__?.game?.advanceTime?.(136), true');
  return pollEval(
    sessionId,
    'JSON.parse(window.render_game_to_text())',
    (state) => state?.scene === 'PlayScene',
    5000,
    200,
  );
}

async function runTitleToPlay(url, artifactDir) {
  const sessionId = buildSessionId('title_to_play');
  ensureDir(artifactDir);

  try {
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
  } finally {
    closePage(sessionId);
  }
}

async function runPauseOverlay(url, artifactDir) {
  const sessionId = buildSessionId('pause_overlay');
  ensureDir(artifactDir);

  try {
    await bootToPlay(sessionId, url);
    const pauseOpened = evalJson(
      sessionId,
      `window.__ASHEN_RUNTIME__.game.sceneManager.currentScene._ui.showPause({ player: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene.world.player, data: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene._gameData, world: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene.world, session: window.__ASHEN_RUNTIME__.game.session, onResume: null, onForfeit: null, onOptionsChange: null }), window.__ASHEN_RUNTIME__.game.sceneManager.currentScene._ui.isPaused()`,
    );
    if (pauseOpened !== true) {
      throw new Error('Pause overlay did not open');
    }
    const state = await pollEval(
      sessionId,
      'JSON.parse(window.render_game_to_text())',
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
  } finally {
    closePage(sessionId);
  }
}

async function runResultScreen(url, artifactDir) {
  const sessionId = buildSessionId('result_screen');
  ensureDir(artifactDir);

  try {
    await bootToPlay(sessionId, url);
    const resultOpened = evalJson(
      sessionId,
      `window.__ASHEN_RUNTIME__.game.sceneManager.currentScene._ui.showResult({ survivalTime: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene.world.elapsedTime ?? 0, level: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene.world.player?.level ?? 1, killCount: window.__ASHEN_RUNTIME__.game.sceneManager.currentScene.world.killCount ?? 0, outcome: 'defeat', currencyEarned: 0, totalCurrency: window.__ASHEN_RUNTIME__.game.session?.meta?.currency ?? 0 }, null, null), window.__ASHEN_RUNTIME__.game.sceneManager.currentScene._ui.isResultVisible()`,
    );
    if (resultOpened !== true) {
      throw new Error('Result overlay did not open');
    }
    const triggerState = await pollEval(
      sessionId,
      'JSON.parse(window.render_game_to_text())',
      (value) => value?.ui?.resultVisible === true,
      3000,
      150,
    );
    const state = await pollEval(
      sessionId,
      'JSON.parse(window.render_game_to_text())',
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
  } finally {
    closePage(sessionId);
  }
}

const RUNNERS = {
  title_to_play: runTitleToPlay,
  pause_overlay: runPauseOverlay,
  result_screen: runResultScreen,
};

async function runScenario(url, scenarioId) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const runner = RUNNERS[scenarioId];
  if (!runner) {
    throw new Error(`No runner registered for scenario: ${scenarioId}`);
  }

  return runner(url, scenario.artifactDir);
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

  const scenarioIds = args.all ? getScenarioIds() : [args.scenario];
  const results = [];
  for (const scenarioId of scenarioIds) {
    // Keep one active CLI request at a time per session.
    results.push(await runScenario(args.url, scenarioId));
  }
  const summary = summarize(results);
  writeJson(path.join(OUTPUT_ROOT, 'summary.json'), summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (!summary.allPassed) {
    process.exitCode = 1;
  }
}

await main();
