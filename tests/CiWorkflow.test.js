import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRunner } from './helpers/testRunner.js';

const { test, summary } = createRunner('CiWorkflow');

console.log('\n[CiWorkflow]');

test('verify workflow는 smoke가 포함된 CI 기준선을 실행한다', () => {
  const workflow = readFileSync(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
  assert.equal(workflow.includes('npm run verify:ci'), true);
});

summary();
