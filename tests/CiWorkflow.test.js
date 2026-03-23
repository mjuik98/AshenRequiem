import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

const { test, summary } = createRunner('CiWorkflow');

console.log('\n[CiWorkflow]');

test('verify workflow는 test, smoke, build 기준선을 모두 실행한다', () => {
  const workflow = readFileSync(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
  assert.equal(workflow.includes('npm test'), true);
  assert.equal(workflow.includes('npm run test:smoke'), true);
  assert.equal(workflow.includes('npm run build'), true);
});

summary();
