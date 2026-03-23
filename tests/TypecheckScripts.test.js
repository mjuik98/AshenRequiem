import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[TypecheckScripts]');

const { test, summary } = createRunner('TypecheckScripts');

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tsconfigPath = new URL('../tsconfig.typecheck.json', import.meta.url);

test('package scripts expose an explicit typecheck baseline and verify runs it', () => {
  assert.equal(typeof packageJson.scripts?.typecheck, 'string', 'typecheck script가 없음');
  assert.match(packageJson.scripts.typecheck, /tsc/, 'typecheck script는 tsc 기반이어야 함');
  assert.match(packageJson.scripts.verify ?? '', /typecheck/, 'verify script가 typecheck를 포함해야 함');
  assert.equal(typeof packageJson.devDependencies?.typescript, 'string', 'typescript devDependency가 없음');
});

test('scoped typecheck config exists and enables checkJs without emitting', () => {
  assert.equal(existsSync(tsconfigPath), true, 'tsconfig.typecheck.json 파일이 없음');

  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
  assert.equal(tsconfig.compilerOptions?.allowJs, true, 'allowJs가 활성화되지 않음');
  assert.equal(tsconfig.compilerOptions?.checkJs, true, 'checkJs가 활성화되지 않음');
  assert.equal(tsconfig.compilerOptions?.noEmit, true, 'noEmit이 활성화되지 않음');
  assert.equal(Array.isArray(tsconfig.include), true, 'include 배열이 필요함');
  assert.equal(tsconfig.include.length > 0, true, 'typecheck 대상 include가 비어 있음');
});

summary();
