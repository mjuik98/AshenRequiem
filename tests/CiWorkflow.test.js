import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

const { test, summary } = createRunner('CiWorkflow');

console.log('\n[CiWorkflow]');

test('verify workflow는 smoke가 포함된 CI 기준선을 실행한다', () => {
  const workflow = readProjectSource('../.github/workflows/verify.yml');
  assert.equal(workflow.includes('npm run verify:ci'), true);
});

test('extended smoke workflow는 full deterministic smoke를 별도 스케줄로 실행한다', () => {
  const workflow = readProjectSource('../.github/workflows/smoke-extended.yml');
  assert.equal(workflow.includes('schedule:'), true, 'extended smoke workflow에 schedule이 없음');
  assert.equal(workflow.includes('workflow_dispatch:'), true, 'extended smoke workflow에 수동 실행 트리거가 없음');
  assert.equal(workflow.includes('npm run build'), true, 'extended smoke workflow가 prebuilt dist를 준비하지 않음');
  assert.equal(workflow.includes('npm run smoke:full:prebuilt'), true, 'extended smoke workflow가 prebuilt full smoke를 실행하지 않음');
});

summary();
