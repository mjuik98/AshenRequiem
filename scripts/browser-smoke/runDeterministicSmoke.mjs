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

function pressEscape(sessionId) {
  evalJson(sessionId, `() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.__ASHEN_RUNTIME__?.game?.advanceTime?.(34);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    window.__ASHEN_RUNTIME__?.game?.advanceTime?.(34);
    return true;
  }`);
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

function openPage(sessionId, url) {
  pw(sessionId, ['open', url]);
}

function closePage(sessionId) {
  try {
    pw(sessionId, ['close']);
  } catch (error) {
    console.warn(`[browser-smoke] close skipped for ${sessionId}: ${error.message}`);
  }
}

async function bootToPlay(sessionId, url) {
  openPage(sessionId, url);
  evalJson(sessionId, `() => {
    const game = window.__ASHEN_RUNTIME__?.game;
    const scene = game?.sceneManager?.currentScene;
    scene?._openStartLoadout?.({
      setMessage: () => {},
      pulseFlash: () => {},
    });
    scene?._loadoutView?.hide?.();
    scene?._loadoutView?._onStart?.('magic_bolt');
    return true;
  }`);
  await sleep(350);
  evalJson(sessionId, '() => (window.__ASHEN_RUNTIME__?.game?.advanceTime?.(136), true)');
  return pollEval(
    sessionId,
    '() => JSON.parse(window.render_game_to_text())',
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
    evalJson(sessionId, `() => {
      const game = window.__ASHEN_RUNTIME__?.game;
      const scene = game?.sceneManager?.currentScene;
      const world = scene?.world;
      const data = scene?._gameData;
      const accDef = data?.accessoryData?.find((item) => item.id === 'tome_of_power') ?? data?.accessoryData?.[0];
      const accessory = globalThis.structuredClone
        ? structuredClone(accDef)
        : JSON.parse(JSON.stringify(accDef));
      accessory.level = 3;
      world.pendingLevelUpChoices = [];
      world.playMode = 'playing';
      scene._ui?.hideLevelUp?.();
      world.player.accessories = [accessory];
      world.player.activeSynergies = [];
      world.player.evolvedWeapons = world.player.evolvedWeapons instanceof Set
        ? world.player.evolvedWeapons
        : new Set();
      return true;
    }`);
    pressEscape(sessionId);
    evalJson(sessionId, `() => {
      const target = Array.from(document.querySelectorAll('.pv-loadout-card[data-loadout="accessory"]'))
        .find((node) => node.textContent?.includes('마력의 서'));
      if (!target) return false;
      const rect = target.getBoundingClientRect();
      const clientX = rect.left + Math.min(24, rect.width / 2);
      const clientY = rect.top + Math.min(24, rect.height / 2);
      target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX, clientY }));
      target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX, clientY }));
      return true;
    }`);

    const state = await pollEval(
      sessionId,
      '() => JSON.parse(window.render_game_to_text())',
      (value) => value?.ui?.pauseVisible === true,
      3000,
      150,
    );
    const tooltip = await pollEval(
      sessionId,
      `() => {
        const tip = document.querySelector('.pv-tooltip');
        return {
          visible: !!tip && getComputedStyle(tip).display !== 'none',
          text: tip?.innerText ?? '',
        };
      }`,
      (value) => value?.visible === true,
      3000,
      150,
    );
    takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
    const summary = {
      scenario: 'pause_overlay',
      state,
      tooltip,
      assertions: {
        pauseVisible: state?.ui?.pauseVisible === true,
        tooltipVisible: tooltip?.visible === true,
        hasAccessoryText: typeof tooltip?.text === 'string' && tooltip.text.includes('마력의 서'),
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
    evalJson(sessionId, `() => {
      const game = window.__ASHEN_RUNTIME__?.game;
      const scene = game?.sceneManager?.currentScene;
      const world = scene?.world;
      world.runOutcome = { type: 'defeat' };
      scene._showResultUI?.();
      return true;
    }`);
    const state = await pollEval(
      sessionId,
      '() => JSON.parse(window.render_game_to_text())',
      (value) => value?.ui?.resultVisible === true,
      3000,
      150,
    );
    const resultUi = evalJson(sessionId, `
      () => ({
        title: document.querySelector('.result-title')?.textContent?.trim() ?? '',
        restart: document.querySelector('.result-restart-btn')?.textContent?.trim() ?? '',
        titleButton: document.querySelector('.result-title-btn')?.textContent?.trim() ?? '',
      })
    `);
    takeScreenshot(sessionId, path.join(artifactDir, 'shot.png'));
    const summary = {
      scenario: 'result_screen',
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
