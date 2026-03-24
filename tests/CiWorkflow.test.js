import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

const { test, summary } = createRunner('CiWorkflow');

console.log('\n[CiWorkflow]');

test('verify workflow는 smoke가 포함된 CI 기준선을 실행한다', () => {
  const workflow = readProjectSource('../.github/workflows/verify.yml');
  assert.equal(workflow.includes('npm run verify:ci'), true);
});

summary();
