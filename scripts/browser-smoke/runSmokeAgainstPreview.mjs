import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const DEFAULT_PORT = 4173;
const DEFAULT_HOST = '127.0.0.1';

function quoteCommandArg(value) {
  const text = String(value ?? '');
  if (text.length === 0) return '""';
  if (/[\s"&()<>^|]/.test(text)) {
    return `"${text.replaceAll('"', '\\"')}"`;
  }
  return text;
}

export function buildCommandInvocation(command, args, options = {}) {
  const platform = options.platform ?? process.platform;
  const comspec = options.comspec ?? process.env.ComSpec ?? process.env.COMSPEC ?? 'cmd.exe';
  const isNpmCommand = /(^|[\\/])npm(?:\.cmd)?$/i.test(command);

  if (platform === 'win32' && isNpmCommand) {
    return {
      command: comspec,
      args: ['/d', '/s', '/c', [command, ...args].map(quoteCommandArg).join(' ')],
      shell: false,
    };
  }

  return { command, args, shell: false };
}

function parseArgs(argv) {
  const args = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    scenario: null,
    all: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    const next = argv[index + 1];
    if (value === '--host' && next) {
      args.host = next;
      index += 1;
    } else if (value === '--port' && next) {
      args.port = Number(next);
      index += 1;
    } else if (value === '--scenario' && next) {
      args.scenario = next;
      index += 1;
    } else if (value === '--all') {
      args.all = true;
    }
  }

  if (!args.all && !args.scenario) {
    args.all = true;
  }

  return args;
}

function spawnCommand(command, args, options = {}) {
  const invocation = buildCommandInvocation(command, args, options);
  return spawn(invocation.command, invocation.args, {
    cwd: ROOT,
    stdio: options.stdio ?? 'inherit',
    env: process.env,
    shell: invocation.shell,
  });
}

async function runCommand(command, args, options = {}) {
  const child = spawnCommand(command, args, options);
  const [code] = await once(child, 'close');
  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
  }
}

export function waitForChildExit(child, timeoutMs = 5000) {
  if (!child) {
    return Promise.resolve(null);
  }
  return Promise.race([
    once(child, 'close').then(([code]) => code),
    new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

function pipeChildOutput(child) {
  child.stdout?.on('data', (chunk) => process.stdout.write(String(chunk)));
  child.stderr?.on('data', (chunk) => process.stderr.write(String(chunk)));
}

function closeChildStreams(child) {
  child.stdout?.destroy?.();
  child.stderr?.destroy?.();
}

export async function stopChildProcess(child) {
  if (!child?.pid) return;
  if (child.exitCode !== null || child.signalCode !== null) {
    closeChildStreams(child);
    return;
  }

  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: false,
      env: process.env,
    });
    const killerCode = await waitForChildExit(killer, 2000).catch(() => null);
    if (killerCode === null && killer.exitCode === null) {
      killer.kill('SIGKILL');
      await waitForChildExit(killer, 1000).catch(() => {});
    }
    const closed = await waitForChildExit(child).catch(() => null);
    if (closed === null && child.exitCode === null) {
      child.kill('SIGKILL');
      await waitForChildExit(child, 1000).catch(() => {});
    }
    closeChildStreams(child);
    return;
  }

  child.kill('SIGTERM');
  const closed = await waitForChildExit(child);
  if (closed === null && child.exitCode === null) {
    child.kill('SIGKILL');
    await waitForChildExit(child, 1000).catch(() => {});
  }
  closeChildStreams(child);
}

export async function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for preview server: ${url}`);
}

async function waitForPreviewReady(preview, url, timeoutMs = 15000) {
  pipeChildOutput(preview);
  await waitForServer(url, timeoutMs);
}

async function canListen(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort(startPort, host, attempts = 10) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = startPort + offset;
    if (await canListen(candidate, host)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find available preview port near ${startPort}`);
}

export async function runSmokeAgainstPreview(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = await findAvailablePort(options.port ?? DEFAULT_PORT, host);
  const url = `http://${host}:${port}`;
  const smokeArgs = [
    path.join('scripts', 'browser-smoke', 'runDeterministicSmoke.mjs'),
    '--url',
    url,
  ];

  if (options.all !== false) {
    smokeArgs.push('--all');
  } else if (options.scenario) {
    smokeArgs.push('--scenario', options.scenario);
  }

  await runCommand(NPM_CMD, ['run', 'build']);

  const preview = spawnCommand(NPM_CMD, [
    'run',
    'preview',
    '--',
    '--host',
    host,
    '--port',
    String(port),
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForPreviewReady(preview, url);
    await runCommand(process.execPath, smokeArgs, { shell: false });
  } finally {
    await stopChildProcess(preview);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv);
  await runSmokeAgainstPreview(args);
}
