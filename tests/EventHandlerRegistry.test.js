import assert from 'node:assert/strict';
import { createRunner } from './helpers/testRunner.js';

console.log('\n[EventHandlerRegistry]');

const { test, summary } = createRunner('EventHandlerRegistry');

test('event handler registry는 기본 등록 spec과 공용 register helper를 노출한다', async () => {
  const registryApi = await import('../src/systems/event/eventHandlerRegistry.js');

  assert.equal(typeof registryApi.registerEventHandlers, 'function', '공용 이벤트 핸들러 register helper가 없음');
  assert.equal('DEFAULT_EVENT_HANDLER_REGISTRATIONS' in registryApi, false, '기본 등록 spec 소유권이 registry helper에 남아 있으면 안 됨');
  assert.equal('registerDefaultEventHandlers' in registryApi, false, '기본 등록 orchestration이 registry helper에 남아 있으면 안 됨');
});

test('공용 event handler register helper는 전달된 spec 순서대로 등록한다', async () => {
  const { registerEventHandlers } = await import('../src/systems/event/eventHandlerRegistry.js');
  const calls = [];
  const services = { soundSystem: { id: 'sound' } };
  const registry = { id: 'registry' };
  const session = { id: 'session' };

  registerEventHandlers([
    {
      id: 'first',
      register(context) {
        calls.push(['first', context.services, context.registry, context.session]);
      },
    },
    {
      id: 'second',
      register(context) {
        calls.push(['second', context.services, context.registry, context.session]);
      },
    },
  ], services, registry, session);

  assert.deepEqual(calls, [
    ['first', services, registry, session],
    ['second', services, registry, session],
  ]);
});

summary();
