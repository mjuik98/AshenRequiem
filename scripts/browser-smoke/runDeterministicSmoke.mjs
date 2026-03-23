import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { OUTPUT_ROOT, SCENARIOS, getScenarioIds } from './scenarios.js';
import { createPlaywrightSessionTransport } from './smokeCliTransport.mjs';
import { runSmokeScenario } from './smokeScenarioRunners.mjs';

const OUTPUT_PATH_PREFIX = 'output/web-game/';
const SMOKE_SESSION_PREFIX = 'ashen-smoke-';

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

function writeJson(outputPath, payload) {
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function buildSessionId(scenarioId) {
  return `${SMOKE_SESSION_PREFIX}${scenarioId.replaceAll('_', '-')}-${process.pid}-${Date.now()}`;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function cleanupSmokeSessionProcesses(sessionPattern) {
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
  const transport = createPlaywrightSessionTransport(sessionId);

  try {
    const scenarioIds = args.all ? getScenarioIds() : [args.scenario];
    const results = [];
    for (const scenarioId of scenarioIds) {
      const scenario = SCENARIOS[scenarioId];
      if (!scenario) {
        throw new Error(`Unknown scenario: ${scenarioId}`);
      }
      results.push(await runSmokeScenario(args.url, scenarioId, scenario.artifactDir, transport));
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
