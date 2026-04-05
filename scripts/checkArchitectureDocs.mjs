import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getArchitectureSnapshot, renderArchitectureSnapshotSections } from './architectureSnapshot.mjs';
import { renderWrapperInventorySections, WRAPPER_INVENTORY } from './compatibilityWrappers.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHITECTURE_DOC_PATH = path.join(ROOT_DIR, 'docs', 'architecture-current.md');
const MODULE_MAP_PATH = path.join(ROOT_DIR, 'docs', 'module-map.md');
const WRAPPER_DOC_PATH = path.join(ROOT_DIR, 'docs', 'compatibility-wrappers.md');
const README_PATH = path.join(ROOT_DIR, 'README.md');

function readSource(filePath) {
  return readFileSync(filePath, 'utf8');
}

function normalizeLineEndings(source) {
  return source.replace(/\r\n/g, '\n');
}

export async function collectArchitectureDocViolations(rootDir = ROOT_DIR) {
  const architectureSource = normalizeLineEndings(readSource(path.join(rootDir, 'docs', 'architecture-current.md')));
  const moduleMapSource = normalizeLineEndings(readSource(path.join(rootDir, 'docs', 'module-map.md')));
  const wrapperSource = normalizeLineEndings(readSource(path.join(rootDir, 'docs', 'compatibility-wrappers.md')));
  const readmeSource = normalizeLineEndings(readSource(path.join(rootDir, 'README.md')));
  const snapshot = await getArchitectureSnapshot(rootDir);
  const sections = renderArchitectureSnapshotSections(snapshot);
  const wrapperSections = renderWrapperInventorySections();
  const violations = [];

  for (const [label, section] of Object.entries(sections)) {
    if (!architectureSource.includes(normalizeLineEndings(section))) {
      violations.push({
        rule: 'architecture-snapshot',
        message: `architecture-current is missing generated ${label}`,
      });
    }
  }

  const moduleMapRequirements = [
    'Module Map',
    '`play`',
    '`meta`',
    '`catalog`',
    '`platform`',
    '`shared`',
    '`compat`',
    'src/progression',
    'sessionSnapshot',
    'metaShopPurchaseDomain',
    'compatibility wrapper',
  ];
  for (const snippet of moduleMapRequirements) {
    if (!moduleMapSource.includes(snippet)) {
      violations.push({
        rule: 'module-map-drift',
        message: `module-map is missing required guidance: ${snippet}`,
      });
    }
  }

  if (!architectureSource.includes('docs/module-map.md')) {
    violations.push({
      rule: 'module-map-reference',
      message: 'architecture-current must reference docs/module-map.md for owner placement guidance',
    });
  }

  for (const wrapperEntry of WRAPPER_INVENTORY) {
    if (!wrapperSource.includes(wrapperEntry.path)) {
      violations.push({
        rule: 'wrapper-inventory',
        message: `compatibility wrapper inventory is missing ${wrapperEntry.path}`,
      });
    }
  }

  for (const [label, section] of Object.entries(wrapperSections)) {
    if (!wrapperSource.includes(normalizeLineEndings(section))) {
      violations.push({
        rule: 'wrapper-snapshot',
        message: `compatibility wrapper inventory is missing generated ${label}`,
      });
    }
  }

  const readmeRequirements = [
    'npm run architecture:snapshot',
    'npm run lint',
    'npm run check:cycles',
    'npm run check:architecture-docs',
    'npm run verify:smoke',
    'npm run verify:ci',
  ];
  for (const snippet of readmeRequirements) {
    if (!readmeSource.includes(snippet)) {
      violations.push({
        rule: 'readme-command-drift',
        message: `README is missing command reference: ${snippet}`,
      });
    }
  }

  return violations;
}

export async function main() {
  const violations = await collectArchitectureDocViolations(ROOT_DIR);
  if (violations.length === 0) {
    console.log('[check:architecture-docs] ok');
    return 0;
  }

  console.error('[check:architecture-docs] violations detected:');
  for (const violation of violations) {
    console.error(`- ${violation.message}`);
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await main();
  process.exit(exitCode);
}
