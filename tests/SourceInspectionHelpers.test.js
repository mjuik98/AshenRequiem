import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[SourceInspectionHelpers]');

const { test, summary } = createRunner('SourceInspectionHelpers');

test('source inspection helper는 공통 파일 읽기와 주석 제거를 제공한다', async () => {
  const sourceInspection = await import('./helpers/sourceInspection.js');

  assert.equal(typeof sourceInspection.readProjectSource, 'function', 'readProjectSource helper가 없음');
  assert.equal(typeof sourceInspection.readProjectJson, 'function', 'readProjectJson helper가 없음');
  assert.equal(typeof sourceInspection.readOptionalProjectSource, 'function', 'readOptionalProjectSource helper가 없음');
  assert.equal(typeof sourceInspection.stripLineComments, 'function', 'stripLineComments helper가 없음');

  const stripped = sourceInspection.stripLineComments([
    '// line comment',
    'const active = true;',
    '  * block comment line',
  ].join('\n'));

  assert.equal(stripped.includes('// line comment'), false, 'line comment가 제거되지 않음');
  assert.equal(stripped.includes('* block comment line'), false, 'block comment line이 제거되지 않음');
  assert.equal(stripped.includes('const active = true;'), true, '실제 코드 줄이 유지되지 않음');
  assert.equal(sourceInspection.readOptionalProjectSource('../missing-file-does-not-exist.txt', 'fallback'), 'fallback', 'optional source helper가 fallback을 반환하지 않음');
});

summary();
