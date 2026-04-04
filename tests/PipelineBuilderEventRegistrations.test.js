import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[PipelineBuilderEventRegistrations]');

const { test, summary } = createRunner('PipelineBuilderEventRegistrations');

let PipelineBuilder = null;

try {
  ({ PipelineBuilder } = await import('../src/core/PipelineBuilder.js'));
} catch (error) {
  PipelineBuilder = { error };
}

test('PipelineBuilder는 injected event registration orchestrator를 호출한다', () => {
  assert.ok(!PipelineBuilder?.error, PipelineBuilder?.error?.message ?? 'PipelineBuilder를 불러오지 못함');
  const services = { soundSystem: { id: 'sound' } };
  const registry = { id: 'registry' };
  const session = { id: 'session' };
  const calls = [];
  const builder = new PipelineBuilder(
    services,
    registry,
    session,
    null,
    (nextServices, nextRegistry, nextSession) => {
      calls.push([nextServices, nextRegistry, nextSession]);
    },
  );

  builder._registerEventHandlers();

  assert.deepEqual(calls, [[services, registry, session]]);
});

summary();
