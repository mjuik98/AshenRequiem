import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TESTS_ROOT_URL = new URL('../', import.meta.url);

export function readProjectSource(relativePath) {
  return readFileSync(new URL(relativePath, TESTS_ROOT_URL), 'utf8');
}

export function readProjectJson(relativePath) {
  return JSON.parse(readProjectSource(relativePath));
}

export function readOptionalProjectSource(relativePath, fallback = '') {
  return projectPathExists(relativePath)
    ? readProjectSource(relativePath)
    : fallback;
}

export function projectPathExists(relativePath) {
  return existsSync(new URL(relativePath, TESTS_ROOT_URL));
}

export function resolveProjectPath(relativePath) {
  return fileURLToPath(new URL(relativePath, TESTS_ROOT_URL));
}

export function stripLineComments(source) {
  return String(source)
    .split('\n')
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    })
    .join('\n');
}
