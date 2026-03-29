import fs from 'node:fs';
import path from 'node:path';

export function withRuntimeFlags(url, flags = {}) {
  const nextUrl = new URL(url);
  for (const [flagName, enabled] of Object.entries(flags)) {
    if (enabled) {
      nextUrl.searchParams.set(flagName, '1');
    } else {
      nextUrl.searchParams.delete(flagName);
    }
  }
  return nextUrl.toString();
}

export function withDebugRuntime(url) {
  return withRuntimeFlags(url, { debugRuntime: true });
}

export function ensureScenarioDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeScenarioJson(outputPath, payload) {
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readSnapshotContent(snapshotPath) {
  return snapshotPath ? fs.readFileSync(path.resolve(snapshotPath), 'utf8') : '';
}

export function findRefByText(snapshotContent, label) {
  const escaped = String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = snapshotContent.match(new RegExp(`^.*${escaped}.*\\[ref=(e\\d+)\\].*$`, 'm'));
  return match?.[1] ?? null;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function bootToPlay(url, transport, options = {}) {
  const runtimeUrl = withRuntimeFlags(url, {
    debugRuntime: true,
    ...(options.runtimeFlags ?? {}),
  });
  await transport.open(runtimeUrl);
  if (options.viewport?.width && options.viewport?.height && typeof transport.resize === 'function') {
    await transport.resize(options.viewport.width, options.viewport.height);
  }
  await transport.pollEval(
    `Boolean(document.querySelector('[data-action="start"]'))`,
    (value) => value === true,
    5000,
    150,
  );
  let titleClicked = await transport.clickByText('Start Game');
  if (!titleClicked) {
    titleClicked = await transport.evalJson(`
      document.querySelector('[data-action="start"]')
        ? (document.querySelector('[data-action="start"]').click(), true)
        : false
    `);
  }
  if (!titleClicked) {
    throw new Error('Failed to click Start Game button');
  }

  const loadoutVisible = await transport.pollEval(
    `Boolean(document.querySelector('.sl-root [data-action="start"]')) && getComputedStyle(document.querySelector('.sl-root')).display !== 'none'`,
    (value) => value === true,
    5000,
    150,
  );
  if (loadoutVisible !== true) {
    throw new Error('Start loadout dialog did not open');
  }

  await options.beforeStartRun?.(transport);

  let loadoutClicked = await transport.clickByText('시작하기');
  if (!loadoutClicked) {
    loadoutClicked = await transport.evalJson(`
      document.querySelector('.sl-root [data-action="start"]')
        ? (document.querySelector('.sl-root [data-action="start"]').click(), true)
        : false
    `);
  }
  if (!loadoutClicked) {
    throw new Error('Failed to click loadout start button');
  }
  await sleep(250);
  await transport.evalJson('window.__ASHEN_DEBUG__?.advanceTime?.(136), true');
  return transport.pollEval(
    'window.__ASHEN_DEBUG__?.getSnapshot?.() ?? null',
    (state) => state?.scene === 'PlayScene',
    5000,
    200,
  );
}
