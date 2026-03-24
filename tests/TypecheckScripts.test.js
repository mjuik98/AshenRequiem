import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRunner } from './helpers/testRunner.js';
import {
  projectPathExists,
  readProjectJson,
  readProjectSource,
} from './helpers/sourceInspection.js';

console.log('\n[TypecheckScripts]');

const { test, summary } = createRunner('TypecheckScripts');

const packageJson = readProjectJson('../package.json');

test('package scripts expose an explicit typecheck baseline and verify runs it', () => {
  assert.equal(typeof packageJson.scripts?.typecheck, 'string', 'typecheck script가 없음');
  assert.match(packageJson.scripts.typecheck, /tsc/, 'typecheck script는 tsc 기반이어야 함');
  assert.equal(packageJson.scripts.verify, 'npm run verify:fast', '기본 verify는 fast baseline alias여야 함');
  assert.match(packageJson.scripts['verify:fast'] ?? '', /typecheck/, 'verify:fast가 typecheck를 포함해야 함');
  assert.equal(typeof packageJson.devDependencies?.typescript, 'string', 'typescript devDependency가 없음');
});

test('scoped typecheck config exists and enables checkJs without emitting', () => {
  assert.equal(projectPathExists('../tsconfig.typecheck.json'), true, 'tsconfig.typecheck.json 파일이 없음');

  const tsconfig = JSON.parse(readProjectSource('../tsconfig.typecheck.json'));
  assert.equal(tsconfig.compilerOptions?.allowJs, true, 'allowJs가 활성화되지 않음');
  assert.equal(tsconfig.compilerOptions?.checkJs, true, 'checkJs가 활성화되지 않음');
  assert.equal(tsconfig.compilerOptions?.noEmit, true, 'noEmit이 활성화되지 않음');
  assert.equal(Array.isArray(tsconfig.include), true, 'include 배열이 필요함');
  assert.equal(tsconfig.include.length > 0, true, 'typecheck 대상 include가 비어 있음');
});

test('scoped typecheck baseline passes on the current source tree', () => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.typecheck.json', '--pretty', 'false'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
    },
  );

  assert.equal(
    result.status,
    0,
    `typecheck failed:\n${result.stdout}${result.stderr}`,
  );
});

summary();
