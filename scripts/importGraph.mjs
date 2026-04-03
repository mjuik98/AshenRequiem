import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE_EXTENSIONS = new Set(['.js', '.mjs']);

export function walkFiles(dirPath, bucket = []) {
  if (!fs.existsSync(dirPath)) return bucket;

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

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

export function toProjectRelative(filePath, rootDir = ROOT_DIR) {
  return toPosixPath(path.relative(rootDir, filePath));
}

export function extractImports(source) {
  const fromMatches = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const bareMatches = [...source.matchAll(/import\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  const dynamicMatches = [...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
  return [...new Set([...fromMatches, ...bareMatches, ...dynamicMatches])];
}

export function resolveImportTarget(sourceFile, specifier, rootDir = ROOT_DIR) {
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
  return hit ? toProjectRelative(hit, rootDir) : toPosixPath(path.relative(rootDir, resolved));
}

export function collectImportsForSegments(rootDir = ROOT_DIR, segments = ['src']) {
  return segments.flatMap((segment) => {
    const baseDir = path.join(rootDir, segment);
    if (!fs.existsSync(baseDir)) return [];

    return walkFiles(baseDir).flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8');
      const sourceFile = toProjectRelative(filePath, rootDir);
      return extractImports(source).map((specifier) => ({
        sourceFile,
        targetFile: resolveImportTarget(filePath, specifier, rootDir),
      }));
    });
  });
}

export function collectSourceImports(rootDir = ROOT_DIR) {
  return collectImportsForSegments(rootDir, ['src']);
}

export function collectRepoImports(rootDir = ROOT_DIR) {
  return collectImportsForSegments(rootDir, ['src', 'tests', 'scripts']);
}
