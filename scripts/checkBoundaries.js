import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const SOURCE_EXTENSIONS = new Set(['.js', '.mjs']);

export const SHIM_IMPORT_PATTERNS = [
  'state/createWorld.js',
  'state/startLoadoutRuntime.js',
  'scenes/play/playerSpawnRuntime.js',
  'scenes/play/playSceneFlow.js',
  'progression/levelUpFlowRuntime.js',
  'systems/sound/soundEventHandler.js',
  'systems/event/bossAnnouncementHandler.js',
  'systems/event/bossPhaseHandler.js',
  'systems/event/chestRewardHandler.js',
  'systems/event/codexHandler.js',
  'systems/event/currencyHandler.js',
  'systems/event/weaponEvolutionHandler.js',
  'core/Game.js',
  'scenes/play/PlayResultHandler.js',
];

const REPO_INTERNAL_PREFIXES = ['src/', 'tests/', 'scripts/'];
const MIGRATED_WRAPPER_PATTERNS = [
  'scenes/play/playerSpawnRuntime.js',
  'scenes/play/playSceneFlow.js',
  'progression/levelUpFlowRuntime.js',
];

const DOMAIN_FORBIDDEN_SEGMENTS = [
  '/ui/',
  '/renderer/',
  '/adapters/browser/',
  '/scenes/',
];

function walkFiles(dirPath, bucket = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(nextPath, bucket);
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      bucket.push(nextPath);
    }
  }
  return bucket;
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function toProjectRelative(filePath) {
  return toPosixPath(path.relative(ROOT_DIR, filePath));
}

function extractImports(source) {
  const matches = source.matchAll(/from\s+['"]([^'"]+)['"]/g);
  return [...matches].map((match) => match[1]);
}

function resolveImportTarget(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return specifier;

  const resolved = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = [
    resolved,
    `${resolved}.js`,
    `${resolved}.mjs`,
    path.join(resolved, 'index.js'),
    path.join(resolved, 'index.mjs'),
  ];

  const hit = candidates.find((candidate) => fs.existsSync(candidate));
  return hit ? toProjectRelative(hit) : toPosixPath(path.relative(ROOT_DIR, resolved));
}

function collectSourceImports() {
  return walkFiles(SRC_DIR).flatMap((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const relPath = toProjectRelative(filePath);
    return extractImports(source).map((specifier) => ({
      sourceFile: relPath,
      specifier,
      targetFile: resolveImportTarget(filePath, specifier),
    }));
  });
}

function collectRepoImports() {
  return ['src', 'tests', 'scripts'].flatMap((rootSegment) => {
    const baseDir = path.join(ROOT_DIR, rootSegment);
    if (!fs.existsSync(baseDir)) return [];
    return walkFiles(baseDir).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const relPath = toProjectRelative(filePath);
      return extractImports(source).map((specifier) => ({
        sourceFile: relPath,
        specifier,
        targetFile: resolveImportTarget(filePath, specifier),
      }));
    });
  });
}

function findShimViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => (
      sourceFile.startsWith('src/')
      && SHIM_IMPORT_PATTERNS.some((pattern) => targetFile.endsWith(pattern))
    ))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'compatibility-shim',
      sourceFile,
      targetFile,
      message: `compatibility shim import is forbidden: ${sourceFile} -> ${targetFile}`,
    }));
}

function findDomainViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => sourceFile.startsWith('src/domain/'))
    .filter(({ targetFile }) => DOMAIN_FORBIDDEN_SEGMENTS.some((segment) => targetFile.includes(segment)))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'domain-boundary',
      sourceFile,
      targetFile,
      message: `domain module crosses forbidden boundary: ${sourceFile} -> ${targetFile}`,
    }));
}

function findSceneToSystemsViolations(imports) {
  return imports
    .filter(({ sourceFile, targetFile }) => sourceFile.startsWith('src/scenes/'))
    .filter(({ targetFile }) => targetFile.startsWith('src/systems/'))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'scene-to-systems',
      sourceFile,
      targetFile,
      message: `scene module imports systems implementation directly: ${sourceFile} -> ${targetFile}`,
    }));
}

function findMigratedWrapperViolations(imports) {
  return imports
    .filter(({ sourceFile }) => REPO_INTERNAL_PREFIXES.some((prefix) => sourceFile.startsWith(prefix)))
    .filter(({ targetFile }) => MIGRATED_WRAPPER_PATTERNS.some((pattern) => targetFile.endsWith(pattern)))
    .map(({ sourceFile, targetFile }) => ({
      rule: 'migrated-wrapper',
      sourceFile,
      targetFile,
      message: `migrated wrapper import is forbidden outside public compatibility usage: ${sourceFile} -> ${targetFile}`,
    }));
}

export function collectBoundaryViolations() {
  const sourceImports = collectSourceImports();
  const repoImports = collectRepoImports();
  return [
    ...findShimViolations(sourceImports),
    ...findDomainViolations(sourceImports),
    ...findSceneToSystemsViolations(sourceImports),
    ...findMigratedWrapperViolations(repoImports),
  ];
}

export async function main() {
  const violations = collectBoundaryViolations();
  if (violations.length === 0) {
    console.log('[check:boundaries] ok');
    return 0;
  }

  console.error('[check:boundaries] violations detected:');
  for (const violation of violations) {
    console.error(`- ${violation.message}`);
  }
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exitCode = await main();
  process.exit(exitCode);
}
