import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CLI_TIMEOUT_MS, runPlaywrightCliCommand } from './smokeCliRunner.mjs';
import {
  assertNoCliError,
  parseEvalResult,
  parseScreenshotPath,
  parseSnapshotPath,
} from './smokeCliParsers.mjs';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createPlaywrightSessionTransport(sessionId, {
  runCommand = runPlaywrightCliCommand,
  cwd = process.cwd(),
  env = process.env,
  timeoutMs = DEFAULT_CLI_TIMEOUT_MS,
} = {}) {
  async function run(args, options = {}) {
    return runCommand(['--session', sessionId, ...args], {
      cwd,
      env,
      timeoutMs: options.timeoutMs ?? timeoutMs,
      pipeOutput: options.pipeOutput ?? false,
    });
  }

  return {
    sessionId,
    run,
    async open(url) {
      await run(['open', url], { timeoutMs: Math.max(timeoutMs, 30_000) });
    },
    async evalJson(expression) {
      const stdout = await run(['eval', expression]);
      return parseEvalResult(stdout);
    },
    async click(ref) {
      await run(['click', ref]);
    },
    async hover(ref) {
      await run(['hover', ref]);
    },
    async press(key) {
      await run(['press', key]);
    },
    async resize(width, height) {
      await run(['resize', String(width), String(height)]);
    },
    async snapshotPath() {
      const stdout = await run(['snapshot']);
      return parseSnapshotPath(stdout);
    },
    async runCode(source) {
      const stdout = await run(['run-code', source]);
      assertNoCliError(stdout, 'run-code');
      return stdout;
    },
    async takeScreenshot(outputPath) {
      const stdout = await run(['screenshot']);
      const cliPath = parseScreenshotPath(stdout);
      if (!cliPath) {
        throw new Error(`Failed to parse screenshot path from CLI output:\n${stdout}`);
      }
      fs.copyFileSync(path.resolve(cliPath), path.resolve(outputPath));
    },
    async clickByText(buttonText, clickTimeoutMs = 5000, intervalMs = 150) {
      const startedAt = Date.now();

      while (Date.now() - startedAt <= clickTimeoutMs) {
        const snapshotPath = await this.snapshotPath();
        const ref = snapshotPath ? findRefByText(snapshotPath, buttonText) : null;
        if (ref) {
          await this.click(ref);
          return true;
        }
        await sleep(intervalMs);
      }

      return false;
    },
    async pollEval(expression, predicate, pollTimeoutMs = 5000, intervalMs = 150) {
      const startedAt = Date.now();
      let lastValue = null;

      while (Date.now() - startedAt <= pollTimeoutMs) {
        lastValue = await this.evalJson(expression);
        if (predicate(lastValue)) {
          return lastValue;
        }
        await sleep(intervalMs);
      }

      return lastValue;
    },
  };
}
