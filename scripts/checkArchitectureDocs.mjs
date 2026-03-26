import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getArchitectureSnapshot, renderArchitectureSnapshotSections } from './architectureSnapshot.mjs';
import { renderWrapperInventorySections, WRAPPER_INVENTORY } from './compatibilityWrappers.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHITECTURE_DOC_PATH = path.join(ROOT_DIR, 'docs', 'architecture-current.md');
const WRAPPER_DOC_PATH = path.join(ROOT_DIR, 'docs', 'compatibility-wrappers.md');
const README_PATH = path.join(ROOT_DIR, 'README.md');

function readSource(filePath) {
  return readFileSync(filePath, 'utf8');
}

export async function collectArchitectureDocViolations(rootDir = ROOT_DIR) {
  const architectureSource = readSource(path.join(rootDir, 'docs', 'architecture-current.md'));
  const wrapperSource = readSource(path.join(rootDir, 'docs', 'compatibility-wrappers.md'));
  const readmeSource = readSource(path.join(rootDir, 'README.md'));
  const snapshot = await getArchitectureSnapshot(rootDir);
  const sections = renderArchitectureSnapshotSections(snapshot);
  const wrapperSections = renderWrapperInventorySections();
  const violations = [];

  for (const [label, section] of Object.entries(sections)) {
    if (!architectureSource.includes(section)) {
      violations.push({
        rule: 'architecture-snapshot',
        message: `architecture-current is missing generated ${label}`,
      });
    }
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
    if (!wrapperSource.includes(section)) {
      violations.push({
        rule: 'wrapper-snapshot',
        message: `compatibility wrapper inventory is missing generated ${label}`,
      });
    }
  }

  const readmeRequirements = [
    'npm run architecture:snapshot',
    'npm run lint',
    'npm run check:architecture-docs',
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
