import {
  spawnCommand as spawnCommandImpl,
  stopChildProcess as stopChildProcessImpl,
  waitForChildExit as waitForChildExitImpl,
} from './smokeProcessUtils.mjs';
import { buildPlaywrightInvocation } from './smokeCliPaths.mjs';

export const DEFAULT_CLI_TIMEOUT_MS = 20_000;

function attachOutputCollectors(child) {
  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk) => {
    stdout += String(chunk);
  });
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });

  return {
    getStdout: () => stdout,
    getStderr: () => stderr,
  };
}

export async function runPlaywrightCliCommand(args, {
  cwd = process.cwd(),
  env = process.env,
  timeoutMs = DEFAULT_CLI_TIMEOUT_MS,
  platform = process.platform,
  processPath = process.execPath,
  cliScriptPath = null,
  pwcliPath = null,
  spawnCommand = spawnCommandImpl,
  waitForChildExit = waitForChildExitImpl,
  stopChildProcess = stopChildProcessImpl,
  pipeOutput = false,
} = {}) {
  const invocation = buildPlaywrightInvocation(args, {
    platform,
    processPath,
    env,
    cwd,
    cliScriptPath,
    pwcliPath,
  });
  const child = spawnCommand(invocation.command, invocation.args, {
    cwd,
    env,
    stdio: 'pipe',
    platform,
  });
  const output = attachOutputCollectors(child);

  if (pipeOutput) {
    child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
  }

  let exitCode = null;
  try {
    exitCode = await waitForChildExit(child, timeoutMs, { unrefTimeout: true });
  } catch (error) {
    await stopChildProcess(child, { env }).catch(() => {});
    throw error;
  }

  const stdout = output.getStdout();
  const stderr = output.getStderr();

  if (exitCode === null) {
    await stopChildProcess(child, { env }).catch(() => {});
    throw new Error([
      `Playwright CLI timed out after ${timeoutMs}ms: ${args.join(' ')}`,
      stdout.trim(),
      stderr.trim(),
    ].filter(Boolean).join('\n'));
  }

  if (exitCode !== 0) {
    throw new Error([
      `Playwright CLI failed: ${args.join(' ')}`,
      stdout.trim(),
      stderr.trim(),
    ].filter(Boolean).join('\n'));
  }

  return stdout;
}
