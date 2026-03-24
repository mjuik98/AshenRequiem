import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';
import { readProjectSource } from './helpers/sourceInspection.js';

console.log('\n[TypeDocsSource]');

const { test, summary } = createRunner('TypeDocsSource');
const typesSource = readProjectSource('../src/types.js');

test('legacy types file is reduced to a compatibility shim that points at the real SSOT modules', () => {
  assert.match(typesSource, /compatibility shim|하위 호환|deprecated/i, 'types.js가 하위 호환 shim임을 명시해야 함');
  assert.match(typesSource, /worldTypes\.js/, 'worldTypes.js를 타입 SSOT로 가리켜야 함');
  assert.match(typesSource, /pipelineTypes\.js/, 'pipelineTypes.js를 타입 SSOT로 가리켜야 함');
  assert.equal(typesSource.includes('@typedef {object} Player'), false, 'Player typedef 중복이 남아 있으면 안 됨');
  assert.equal(typesSource.includes('@typedef {object} WorldState'), false, 'WorldState typedef 중복이 남아 있으면 안 됨');
});

summary();
