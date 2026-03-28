import fs from 'node:fs/promises';
import http from 'node:http';
import { once } from 'node:events';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  buildCommandInvocation,
  pipeChildOutput,
  spawnCommand,
  stopChildProcess,
  waitForChildExit,
} from './smokeProcessUtils.mjs';
import {
  createSmokeLogger,
  getActiveHandleSummary,
  isDebugSmokeEnabled,
} from './smokeDiagnostics.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VITE_CLI = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const DEFAULT_PORT = 4173;
const DEFAULT_HOST = '127.0.0.1';
const BUILD_TIMEOUT_MS = 60_000;
const SMOKE_TIMEOUT_MS = 300_000;
const DEBUG_SMOKE = isDebugSmokeEnabled();
const debugLog = createSmokeLogger({ enabled: DEBUG_SMOKE, output: process.stdout });

export { buildCommandInvocation, stopChildProcess, waitForChildExit } from './smokeProcessUtils.mjs';

const STATIC_MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
});

function parseArgs(argv) {
  const args = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    scenario: null,
    all: false,
    suite: 'core',
    skipBuild: false,
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
      args.suite = null;
      index += 1;
    } else if (value === '--all') {
      args.all = true;
      args.suite = null;
    } else if (value === '--suite' && next) {
      args.suite = next;
      index += 1;
    } else if (value === '--skip-build') {
      args.skipBuild = true;
    } else if (value === '--debug-smoke') {
      continue;
    }
  }

  if (!args.all && !args.scenario && !args.suite) {
    args.all = true;
  }

  return args;
}

async function runCommand(command, args, options = {}) {
  debugLog('runCommand:start', { command, args });
  const child = spawnCommand(command, args, {
    ...options,
    cwd: ROOT,
    env: process.env,
  });
  if ((options.stdio ?? 'pipe') === 'pipe' && options.pipeOutput !== false) {
    pipeChildOutput(child);
  }
  const code = await waitForChildExit(child, options.timeoutMs ?? null);
  debugLog('runCommand:finish', { command, args, code });
  if (code === null) {
    await stopChildProcess(child, { env: process.env });
    throw new Error(`${command} ${args.join(' ')} timed out after ${options.timeoutMs}ms`);
  }
  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
  }
}

function ensureViteCli() {
  if (!path.isAbsolute(VITE_CLI)) {
    throw new Error(`Resolved Vite CLI path is not absolute: ${VITE_CLI}`);
  }
  return VITE_CLI;
}

function getStaticMimeType(filePath) {
  return STATIC_MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function resolveStaticRequestPath(rootDir, requestUrl = '/') {
  const pathname = new URL(requestUrl, 'http://127.0.0.1').pathname;
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidatePath = path.resolve(rootDir, relativePath);
  const normalizedRoot = `${path.resolve(rootDir)}${path.sep}`;

  if (candidatePath !== path.resolve(rootDir) && !candidatePath.startsWith(normalizedRoot)) {
    throw new Error(`Refusing to serve path outside dist root: ${pathname}`);
  }

  try {
    const stats = await fs.stat(candidatePath);
    if (stats.isDirectory()) {
      return path.join(candidatePath, 'index.html');
    }
    return candidatePath;
  } catch {
    return path.join(rootDir, 'index.html');
  }
}

export async function startStaticDistServer({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  rootDir = path.join(ROOT, 'dist'),
} = {}) {
  await fs.access(rootDir);

  const server = http.createServer(async (request, response) => {
    try {
      const filePath = await resolveStaticRequestPath(rootDir, request.url ?? '/');
      const body = await fs.readFile(filePath);
      response.writeHead(200, { 'Content-Type': getStaticMimeType(filePath) });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  return {
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
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

export async function waitForPreviewReady(
  preview,
  url,
  timeoutMs = 15000,
  { waitForServerFn = waitForServer } = {},
) {
  const exitPromise = once(preview, 'close').then(([code]) => {
    throw new Error(`Preview server exited before becoming ready (code: ${code ?? 'unknown'})`);
  });
  await Promise.race([
    waitForServerFn(url, timeoutMs),
    exitPromise,
  ]);
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

export async function runSmokeAgainstPreview(
  options = {},
  {
    ensureViteCliFn = ensureViteCli,
    findAvailablePortFn = findAvailablePort,
    runCommandFn = runCommand,
    spawnCommandFn = spawnCommand,
    startStaticDistServerFn = startStaticDistServer,
    waitForPreviewReadyFn = waitForPreviewReady,
    stopChildProcessFn = stopChildProcess,
  } = {},
) {
  const host = options.host ?? DEFAULT_HOST;
  const port = await findAvailablePortFn(options.port ?? DEFAULT_PORT, host);
  const url = `http://${host}:${port}`;
  const viteCli = ensureViteCliFn();
  const preferStaticServer = options.skipBuild === true;
  const smokeArgs = [
    path.join('scripts', 'browser-smoke', 'runDeterministicSmoke.mjs'),
    '--url',
    url,
  ];

  if (options.all !== false) {
    smokeArgs.push('--all');
  } else if (options.scenario) {
    smokeArgs.push('--scenario', options.scenario);
  } else if (options.suite) {
    smokeArgs.push('--suite', options.suite);
  }

  debugLog('smoke:start', { url });
  if (options.skipBuild !== true) {
    await runCommandFn(process.execPath, [viteCli, 'build'], {
      shell: false,
      timeoutMs: BUILD_TIMEOUT_MS,
    });
  }

  let fallbackServer = null;
  let preview = null;

  try {
    if (preferStaticServer) {
      fallbackServer = await startStaticDistServerFn({ host, port, rootDir: path.join(ROOT, 'dist') });
      debugLog('fallback:ready', { url });
    } else {
      preview = spawnCommandFn(process.execPath, [
        viteCli,
        'preview',
        '--host',
        host,
        '--port',
        String(port),
      ], {
        cwd: ROOT,
        env: process.env,
        stdio: 'ignore',
      });
      debugLog('preview:spawned', { pid: preview.pid });
      try {
        await waitForPreviewReadyFn(preview, url);
        debugLog('preview:ready', { pid: preview.pid });
      } catch (error) {
        debugLog('preview:fallback', { pid: preview.pid, reason: error instanceof Error ? error.message : String(error) });
        await stopChildProcessFn(preview, { env: process.env });
        preview = null;
        fallbackServer = await startStaticDistServerFn({ host, port, rootDir: path.join(ROOT, 'dist') });
        debugLog('fallback:ready', { url });
      }
    }
    await runCommandFn(process.execPath, smokeArgs, {
      shell: false,
      timeoutMs: SMOKE_TIMEOUT_MS,
    });
    debugLog('smoke:completed');
  } finally {
    if (preview) {
      debugLog('preview:stopping', { pid: preview.pid });
      await stopChildProcessFn(preview, { env: process.env });
      debugLog('preview:stopped', { pid: preview.pid, handles: getActiveHandleSummary() });
    }
    if (fallbackServer) {
      await fallbackServer.close();
      debugLog('fallback:stopped', { handles: getActiveHandleSummary() });
    }
  }
}

export async function runSmokeCli(
  argv = process.argv,
  {
    parseArgsFn = parseArgs,
    runFn = runSmokeAgainstPreview,
    exitFn = (code) => process.exit(code),
    errorFn = (message) => console.error(message),
  } = {},
) {
  try {
    const args = parseArgsFn(argv);
    debugLog('cli:parsed', args);
    await runFn(args);
    debugLog('cli:run-finished', { handles: getActiveHandleSummary() });
    exitFn(0);
  } catch (error) {
    errorFn(error instanceof Error ? error.message : String(error));
    exitFn(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await runSmokeCli(process.argv);
}
