import { spawn } from 'node:child_process';

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

export function spawnCommand(command, args, options = {}) {
  const invocation = buildCommandInvocation(command, args, options);
  return spawn(invocation.command, invocation.args, {
    cwd: options.cwd ?? process.cwd(),
    stdio: options.stdio ?? 'pipe',
    env: options.env ?? process.env,
    shell: invocation.shell,
  });
}

export function pipeChildOutput(child, output = { stdout: process.stdout, stderr: process.stderr }) {
  const detachFns = [];

  if (child.stdout && output.stdout) {
    const onStdout = (chunk) => output.stdout.write(chunk);
    child.stdout.on('data', onStdout);
    detachFns.push(() => child.stdout.off('data', onStdout));
  }

  if (child.stderr && output.stderr) {
    const onStderr = (chunk) => output.stderr.write(chunk);
    child.stderr.on('data', onStderr);
    detachFns.push(() => child.stderr.off('data', onStderr));
  }

  const detach = () => {
    for (const detachFn of detachFns) {
      detachFn();
    }
  };
  child.once?.('close', detach);
  child.once?.('exit', detach);
}

export function waitForChildExit(
  child,
  timeoutMs = 5000,
  {
    setTimeoutFn = globalThis.setTimeout,
    clearTimeoutFn = globalThis.clearTimeout,
    unrefTimeout = false,
  } = {},
) {
  if (!child) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (result, isError = false) => {
      if (settled) return;
      settled = true;
      clearTimeoutFn(timeoutId);
      child.removeListener?.('exit', handleExit);
      child.removeListener?.('close', handleClose);
      child.removeListener?.('error', handleError);
      if (isError) {
        reject(result);
        return;
      }
      resolve(result);
    };
    const handleExit = (code) => finish(code);
    const handleClose = (code) => finish(code);
    const handleError = (error) => finish(error, true);
    const timeoutId = setTimeoutFn(() => finish(null), timeoutMs);
    if (unrefTimeout && typeof timeoutId?.unref === 'function') {
      timeoutId.unref();
    }
    child.once?.('exit', handleExit);
    child.once?.('close', handleClose);
    child.once?.('error', handleError);
  });
}

function closeChildStreams(child) {
  child.stdout?.destroy?.();
  child.stderr?.destroy?.();
}

export async function stopChildProcess(child, { env = process.env } = {}) {
  if (!child?.pid) return;
  if (child.exitCode !== null || child.signalCode !== null) {
    closeChildStreams(child);
    return;
  }

  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      shell: false,
      env,
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
