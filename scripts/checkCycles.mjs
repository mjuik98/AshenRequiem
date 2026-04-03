import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, collectSourceImports } from './importGraph.mjs';

export const DEFAULT_ALLOWED_CYCLES = Object.freeze([
  Object.freeze(['src/state/pipelineTypes.js', 'src/state/worldTypes.js']),
]);

function canonicalizeCycleEntries(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  let bestKey = null;

  for (let i = 0; i < entries.length; i += 1) {
    const rotated = entries.slice(i).concat(entries.slice(0, i));
    const key = rotated.join('>');
    if (bestKey === null || key < bestKey) {
      bestKey = key;
    }
  }

  return bestKey ?? '';
}

export function collectImportCycles(
  rootDir = ROOT_DIR,
  {
    imports = collectSourceImports(rootDir),
    allowedCycles = DEFAULT_ALLOWED_CYCLES,
  } = {},
) {
  const graph = new Map();

  for (const { sourceFile, targetFile } of imports) {
    if (!sourceFile.startsWith('src/') || !targetFile.startsWith('src/')) continue;
    if (!graph.has(sourceFile)) graph.set(sourceFile, new Set());
    if (!graph.has(targetFile)) graph.set(targetFile, new Set());
    graph.get(sourceFile).add(targetFile);
  }

  const visited = new Set();
  const inStack = new Set();
  const stack = [];
  const seen = new Set();
  const allowed = new Set(
    (allowedCycles ?? []).map((cycle) => canonicalizeCycleEntries([...cycle].sort())),
  );
  const cycles = [];

  function visit(node) {
    visited.add(node);
    stack.push(node);
    inStack.add(node);

    for (const next of graph.get(node) ?? []) {
      if (!visited.has(next)) {
        visit(next);
        continue;
      }

      if (!inStack.has(next)) continue;
      const index = stack.indexOf(next);
      if (index < 0) continue;

      const ring = stack.slice(index);
      if (ring.length <= 1) continue;

      const canonicalKey = canonicalizeCycleEntries(ring);
      const allowKey = canonicalizeCycleEntries([...ring].sort());
      if (seen.has(canonicalKey) || allowed.has(allowKey)) continue;

      seen.add(canonicalKey);
      cycles.push(ring.concat(ring[0]));
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) visit(node);
  }

  return cycles.sort((a, b) => a.join('>').localeCompare(b.join('>')));
}

export function formatImportCycle(cycle = []) {
  return cycle.join(' -> ');
}

export async function main(rootDir = ROOT_DIR) {
  const cycles = collectImportCycles(rootDir);
  if (cycles.length === 0) {
    console.log('[check:cycles] ok');
    return 0;
  }

  console.error('[check:cycles] cycles detected:');
  for (const cycle of cycles) {
    console.error(`- ${formatImportCycle(cycle)}`);
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await main(ROOT_DIR);
  process.exit(exitCode);
}
